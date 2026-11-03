import { useEffect, useState, type ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import Animated, { Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

type Props = { visible: boolean; onClose: () => void; title?: string; children: ReactNode }

const DURATION = 220

/**
 * Bottom sheet for item options, filters and confirmations. The screen behind darkens in place (the dim fades in, it does not
 * slide up with the sheet) while the sheet itself rises from the bottom; closing plays it backwards before the modal goes.
 */
export function Sheet({ visible, onClose, title, children }: Props) {
  const theme = useTheme()
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

  const dim = useAnimatedStyle(() => ({ opacity: progress.value }))
  const rise = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * 400 }] }))

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, spacing.lg) },
            rise,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.divider }]} />
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
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill },
})
