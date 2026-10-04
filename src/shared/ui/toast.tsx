import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

type Tone = 'success' | 'error' | 'info'
type ToastState = { message: string; tone: Tone } | null
type ToastApi = { show: (message: string, tone?: Tone) => void }

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const show = useCallback((message: string, tone: Tone = 'success') => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ message, tone })
    timer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const api = useMemo(() => ({ show }), [show])
  const tones: Record<Tone, { bg: string; fg: string }> = {
    success: { bg: theme.successSubtle, fg: theme.onSuccessSubtle },
    error: { bg: theme.dangerSubtle, fg: theme.onDangerSubtle },
    info: { bg: theme.infoSubtle, fg: theme.onInfoSubtle },
  }

  return (
    <ToastContext value={api}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { top: insets.top + spacing.sm, backgroundColor: tones[toast.tone].bg }]}
        >
          <Text variant="bodySm" color={tones[toast.tone].fg}>
            {toast.message}
          </Text>
        </View>
      ) : null}
    </ToastContext>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
})
