import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform, View } from 'react-native'
import { problemMessage } from '@/shared/api'
import { InlineMessage, type MessageTone } from './message'
import { useToast } from './toast'
import { spacing } from './tokens'

/**
 * The feedback ladder in code (design v5), the same API as the web: screens call useFeedback() instead of a toast, and the message
 * appears in the nearest FeedbackRegion. <Screen> holds one between its header and its scrolling content, so the message is in view
 * whatever the scroll position; a Sheet holds one by its buttons that takes only errors (a success usually closes the sheet, so it
 * goes up to the screen). Outside every region the message falls back to a snackbar.
 *
 * Write a message as "what happened. What it means / what next."; the first sentence becomes the title, the rest the body.
 */
type Message = { tone: MessageTone; title: string; body?: string; action?: ReactNode }
type RegionApi = { show: (message: Message) => void; clear: () => void }

const RegionContext = createContext<RegionApi | null>(null)

/**
 * Carry-over: a screen often saves and then goes back or away at once, which unmounts its region with the fresh message in it. The
 * host keeps the mounted page regions in order; when one goes away holding a message under 3 s old, the message moves to the region
 * still open on top (the screen the user returns to) or waits for the next one that opens (a route change).
 */
type Delivered = Message & { at: number }
type Host = { register: (region: RegionApi) => void; unregister: (region: RegionApi, fresh: Delivered | null) => void }
const HostContext = createContext<Host | null>(null)

export function FeedbackHost({ children }: { children: ReactNode }) {
  const regions = useRef<RegionApi[]>([])
  const pending = useRef<Delivered | null>(null)
  const host = useMemo<Host>(
    () => ({
      register: (region) => {
        regions.current.push(region)
        const waiting = pending.current
        pending.current = null
        if (waiting && Date.now() - waiting.at < 5000) region.show(waiting)
      },
      unregister: (region, fresh) => {
        regions.current = regions.current.filter((r) => r !== region)
        if (!fresh || Date.now() - fresh.at > 3000) return
        const next = regions.current[regions.current.length - 1]
        if (next) next.show(fresh)
        else pending.current = fresh
      },
    }),
    [],
  )
  return <HostContext value={host}>{children}</HostContext>
}

export function splitMessage(text: string): { title: string; body?: string } {
  const m = /^(.+?[.;!?])\s+(\S[\s\S]*)$/.exec(text.trim())
  return m ? { title: m[1].replace(/[.;]$/, ''), body: m[2] } : { title: text.trim().replace(/\.$/, '') }
}

export function FeedbackRegion({ children, errorsOnly = false, placement = 'top' }: { children: ReactNode; errorsOnly?: boolean; placement?: 'top' | 'bottom' }) {
  const parent = useContext(RegionContext)
  const host = useContext(HostContext)
  const latest = useRef<Delivered | null>(null)
  const [message, setMessage] = useState<(Message & { id: number }) | null>(null)
  const seq = useRef(0)
  const api = useMemo<RegionApi>(
    () => ({
      show: (m) => {
        if (errorsOnly && (m.tone === 'success' || m.tone === 'info') && parent) {
          parent.show(m)
          return
        }
        seq.current += 1
        latest.current = { ...m, at: Date.now() }
        setMessage({ ...m, id: seq.current })
        // Android reads the live region; VoiceOver needs an explicit announcement
        if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(m.body ? `${m.title}. ${m.body}` : m.title)
      },
      clear: () => setMessage(null),
    }),
    [errorsOnly, parent],
  )

  useEffect(() => {
    if (!host || errorsOnly) return
    host.register(api)
    return () => host.unregister(api, latest.current)
  }, [host, api, errorsOnly])
  const el = message ? (
    <View style={{ paddingHorizontal: placement === 'top' ? spacing.lg : 0, paddingTop: placement === 'top' ? spacing.sm : spacing.sm }}>
      <InlineMessage key={message.id} tone={message.tone} title={message.title} action={message.action} onDismiss={() => setMessage(null)}>
        {message.body}
      </InlineMessage>
    </View>
  ) : null
  return (
    <RegionContext value={api}>
      {placement === 'top' ? el : null}
      {children}
      {placement === 'bottom' ? el : null}
    </RegionContext>
  )
}

export type Feedback = {
  success: (title: string, body?: string, action?: ReactNode) => void
  info: (title: string, body?: string, action?: ReactNode) => void
  warning: (title: string, body?: string, action?: ReactNode) => void
  /** an API problem (its own sentence is used) or a sentence of your own */
  error: (problemOrTitle: unknown, body?: string, action?: ReactNode) => void
  clear: () => void
}

export function useFeedback(): Feedback {
  const region = useContext(RegionContext)
  const toast = useToast()
  const show = useCallback(
    (raw: Message) => {
      const m = raw.body === undefined ? { ...raw, ...splitMessage(raw.title) } : raw
      if (region) return region.show(m)
      toast.show(m.body ? `${m.title}. ${m.body}` : m.title, m.tone === 'danger' ? 'error' : m.tone === 'success' ? 'success' : 'info')
    },
    [region, toast],
  )
  return useMemo(
    () => ({
      success: (title, body, action) => show({ tone: 'success', title, body, action }),
      info: (title, body, action) => show({ tone: 'info', title, body, action }),
      warning: (title, body, action) => show({ tone: 'warning', title, body, action }),
      error: (problemOrTitle, body, action) =>
        show({ tone: 'danger', title: typeof problemOrTitle === 'string' ? problemOrTitle : problemMessage(problemOrTitle), body, action }),
      clear: () => region?.clear(),
    }),
    [show, region],
  )
}
