import { useEffect, useState, type ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, { Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

type Props = { visible: boolean; onClose: () => void; title?: string; children: ReactNode; /** Rises to fill the whole screen instead of sitting at the bottom. */ fullScreen?: boolean; /** Fades this sheet out quickly while another rises from it. */ hidden?: boolean; /** No dimming of its own: for a sheet opened from a sheet, which is dimmed already. */ clearBackdrop?: boolean; /** Floats just above the sheet, on the dimmed page. */ above?: ReactNode }

const DURATION = 220
const FADE = 90

/**
 * Bottom sheet for item options, filters and confirmations. The screen behind darkens in place (the dim fades in, it does not
 * slide up with the sheet) while the sheet itself rises from the bottom; closing plays it backwards before the modal goes.
 */
export function Sheet({ visible, onClose, title, children, fullScreen = false, hidden = false, clearBackdrop = false, above }: Props) {
  const theme = useTheme()
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [mounted, setMounted] = useState(visible)
  const progress = useSharedValue(0)
  // opening mounts the modal at once (during render); closing unmounts it after the animation
  if (visible && !mounted) setMounted(true)

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System })
    } else if (mounted) {
      progress.value = withTiming(0, { duration: DURATION, easing: Easing.in(Easing.cubic), reduceMotion: ReduceMotion.System }, (done) => {
        if (done) runOnJS(setMounted)(false)
      })
    }
  }, [visible, mounted, progress])

  const presence = useSharedValue(1)
  useEffect(() => {
    presence.value = withTiming(hidden ? 0 : 1, { duration: FADE, reduceMotion: ReduceMotion.System })
  }, [hidden, presence])

  const dim = useAnimatedStyle(() => ({ opacity: progress.value }))
  const rise = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * height }], opacity: presence.value }))

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, clearBackdrop ? undefined : styles.dim, dim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            fullScreen ? [styles.full, { paddingTop: insets.top + spacing.md }] : undefined,
            { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, spacing.lg) },
            rise,
          ]}
        >
          {above ? <View style={styles.above}>{above}</View> : null}
          {fullScreen ? null : <View style={[styles.handle, { backgroundColor: theme.divider }]} />}
          {title ? <Text variant="title">{title}</Text> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  dim: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  above: { position: 'absolute', left: spacing.lg, bottom: '100%', marginBottom: spacing.md },
  full: { flex: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill },
})
