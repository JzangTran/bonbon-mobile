import { NavigationContext } from 'expo-router/react-navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { problemMessage } from '@/shared/api'
import { InlineMessage, type MessageTone } from './message'
import { useToast } from './toast'
import { overlayShadow, radius, spacing } from './tokens'

/**
 * The feedback ladder in code (design v5), the same API as the web: screens call useFeedback() instead of a toast, and the message
 * appears in a FeedbackRegion where the user is looking. <Screen> holds one between its header and its scroll; immersive screens
 * (home, shop) float one above the cart bar; a Sheet holds one by its buttons that takes only errors.
 *
 * Which region: the FeedbackHost keeps the open regions as layers and a message goes to the top one that takes it: the sheet that
 * is open, else the screen in focus. It does not depend on where useFeedback() is called in the tree, so a screen that renders its
 * own <Screen> still reaches it. A success skips error-only layers (a sheet usually closes on success) and lands on the screen.
 * Carry-over: when a layer goes away holding a message under 3 s old (save, then back), the message moves to the layer below.
 *
 * Write a message as "what happened. What it means / what next."; the first sentence becomes the title, the rest the body.
 */
type Message = { tone: MessageTone; title: string; body?: string; action?: ReactNode }
type RegionApi = { show: (message: Message) => void; clear: () => void }
type Delivered = Message & { at: number }
type Layer = { api: RegionApi; errorsOnly: boolean; parent: RegionApi | null; stamp: number }
type Host = {
  register: (layer: Omit<Layer, 'stamp'>) => void
  unregister: (api: RegionApi, fresh: Delivered | null) => void
  /** a region whose screen gains focus becomes the top layer */
  activate: (api: RegionApi) => void
  /** false when no layer takes the message */
  show: (message: Message) => boolean
  clear: () => void
}

const RegionContext = createContext<RegionApi | null>(null)
const HostContext = createContext<Host | null>(null)

const takes = (layer: Layer, m: Message) => !(layer.errorsOnly && (m.tone === 'success' || m.tone === 'info'))

export function FeedbackHost({ children }: { children: ReactNode }) {
  const layers = useRef<Layer[]>([])
  const pending = useRef<Delivered | null>(null)
  const clock = useRef(0)
  const host = useMemo<Host>(() => {
    /** the layer opened or focused last that takes the message, then its deepest open child that takes it too */
    const topFor = (m: Message): Layer | undefined => {
      const byRecency = [...layers.current].sort((a, b) => b.stamp - a.stamp)
      let best = byRecency.find((l) => takes(l, m))
      while (best) {
        const parent = best.api
        const child = byRecency.find((l) => l.parent === parent && takes(l, m))
        if (!child) break
        best = child
      }
      return best
    }
    const showOn = (m: Message) => {
      const layer = topFor(m)
      layer?.api.show(m)
      return !!layer
    }
    return {
      register: (entry) => {
        clock.current += 1
        const layer = { ...entry, stamp: clock.current }
        layers.current = [...layers.current, layer]
        const waiting = pending.current
        if (waiting && Date.now() - waiting.at < 5000 && takes(layer, waiting)) {
          pending.current = null
          layer.api.show(waiting)
        }
      },
      unregister: (api, fresh) => {
        layers.current = layers.current.filter((l) => l.api !== api)
        if (!fresh || Date.now() - fresh.at > 3000) return
        if (!showOn(fresh)) pending.current = fresh
      },
      activate: (api) => {
        clock.current += 1
        const stamp = clock.current
        layers.current = layers.current.map((l) => (l.api === api ? { ...l, stamp } : l))
      },
      show: showOn,
      clear: () => topFor({ tone: 'danger', title: '' })?.api.clear(),
    }
  }, [])
  return <HostContext value={host}>{children}</HostContext>
}

export function splitMessage(text: string): { title: string; body?: string } {
  const m = /^(.+?[.;!?])\s+(\S[\s\S]*)$/.exec(text.trim())
  return m ? { title: m[1].replace(/[.;]$/, ''), body: m[2] } : { title: text.trim().replace(/\.$/, '') }
}

/**
 * `top`: between a screen's header and its scroll. `bottom`: by a sheet's buttons. `float`: for immersive screens (a cover photo under
 * the status bar) the message floats at the bottom, above the cart bar, near what was just pressed; it stays until dismissed.
 */
export function FeedbackRegion({ children, errorsOnly = false, placement = 'top' }: { children: ReactNode; errorsOnly?: boolean; placement?: 'top' | 'bottom' | 'float' }) {
  const insets = useSafeAreaInsets()
  const parent = useContext(RegionContext)
  const host = useContext(HostContext)
  const navigation = useContext(NavigationContext)
  const latest = useRef<Delivered | null>(null)
  const [message, setMessage] = useState<(Message & { id: number }) | null>(null)
  const seq = useRef(0)
  const api = useMemo<RegionApi>(
    () => ({
      show: (m) => {
        // without a host (tests, a screen outside the app shell) a success leaves an error-only region for the one around it
        if (!host && errorsOnly && (m.tone === 'success' || m.tone === 'info') && parent) {
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
    [errorsOnly, parent, host],
  )

  useEffect(() => {
    if (!host) return
    host.register({ api, errorsOnly, parent })
    // a tab or a screen coming back into view becomes the top layer again
    const unsubscribe = navigation?.addListener?.('focus', () => host.activate(api))
    return () => {
      unsubscribe?.()
      host.unregister(api, latest.current)
    }
  }, [host, api, errorsOnly, parent, navigation])

  const el = message ? (
    <View
      style={
        placement === 'float'
          ? [{ position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: insets.bottom + 96, borderRadius: radius.card }, overlayShadow]
          : { paddingHorizontal: placement === 'top' ? spacing.lg : 0, paddingTop: spacing.sm }
      }
    >
      <InlineMessage key={message.id} tone={message.tone} title={message.title} action={message.action} onDismiss={() => setMessage(null)}>
        {message.body}
      </InlineMessage>
    </View>
  ) : null
  return (
    <RegionContext value={api}>
      {placement === 'top' ? el : null}
      {children}
      {placement === 'bottom' || placement === 'float' ? el : null}
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
  const host = useContext(HostContext)
  const region = useContext(RegionContext)
  const toast = useToast()
  const show = useCallback(
    (raw: Message) => {
      const m = raw.body === undefined ? { ...raw, ...splitMessage(raw.title) } : raw
      if (host?.show(m)) return
      if (region) return region.show(m)
      toast.show(m.body ? `${m.title}. ${m.body}` : m.title, m.tone === 'danger' ? 'error' : m.tone === 'success' ? 'success' : 'info')
    },
    [host, region, toast],
  )
  return useMemo(
    () => ({
      success: (title, body, action) => show({ tone: 'success', title, body, action }),
      info: (title, body, action) => show({ tone: 'info', title, body, action }),
      warning: (title, body, action) => show({ tone: 'warning', title, body, action }),
      error: (problemOrTitle, body, action) =>
        show({ tone: 'danger', title: typeof problemOrTitle === 'string' ? problemOrTitle : problemMessage(problemOrTitle), body, action }),
      clear: () => (host ? host.clear() : region?.clear()),
    }),
    [show, host, region],
  )
}
