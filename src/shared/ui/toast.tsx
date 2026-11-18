import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { useTheme } from './theme'
import { overlayShadow, radius, spacing } from './tokens'

type Tone = 'success' | 'error' | 'info'
type Snack = { message: string; tone?: Tone; actionLabel?: string; onAction?: () => void; duration: number }
type ToastApi = {
  /** v4 toast: still shown (as a snackbar) until each call moves to the feedback ladder; new code does not call it */
  show: (message: string, tone?: Tone) => void
  /**
   * Rung 4 of the feedback ladder (design v5): a background action the user can undo, "Đã xoá món Trà đá · Hoàn tác". One line,
   * one action, 6 s. Never for errors and never for something the user must read.
   */
  snackbar: (options: { message: string; onUndo?: () => void; actionLabel?: string }) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** The snackbar host: one at a time, bottom of the screen above the tab bar, overlay style; announced to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<Snack | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const present = useCallback((next: Snack) => {
    if (timer.current) clearTimeout(timer.current)
    setSnack(next)
    // Android reads the live region below; VoiceOver needs an explicit announcement.
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(next.message)
    timer.current = setTimeout(() => setSnack(null), next.duration)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      show: (message, tone = 'success') => present({ message, tone, duration: 4000 }),
      snackbar: ({ message, onUndo, actionLabel }) =>
        present({ message, actionLabel: onUndo ? (actionLabel ?? 'Hoàn tác') : undefined, onAction: onUndo, duration: 6000 }),
    }),
    [present],
  )

  const dot = snack?.tone === 'error' ? theme.danger : snack?.tone === 'info' ? theme.info : snack?.tone === 'success' ? theme.success : null

  return (
    <ToastContext value={api}>
      {children}
      {snack ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.snack, overlayShadow, { bottom: insets.bottom + 96, backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
          <Text variant="bodySm" style={styles.flex}>
            {snack.message}
          </Text>
          {snack.actionLabel ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                snack.onAction?.()
                setSnack(null)
              }}
            >
              <Text variant="label" tone="link">
                {snack.actionLabel}
              </Text>
            </Pressable>
          ) : null}
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

/** The v5 name: `const { snackbar } = useSnackbar()`. */
export const useSnackbar = useToast

const styles = StyleSheet.create({
  snack: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  flex: { flex: 1 },
})
