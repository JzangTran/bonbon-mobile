import { useEffect, type ReactNode } from 'react'
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Card } from './card'
import { useTheme } from './theme'
import { radius as radii, spacing } from './tokens'

type Props = { width?: DimensionValue; height: DimensionValue; radius?: number; style?: StyleProp<ViewStyle> }

/** A grey block standing in for content that is on its way; it breathes gently until the real thing replaces it. */
export function Skeleton({ width = '100%', height, radius = radii.sm, style }: Props) {
  const theme = useTheme()
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }), -1, true)
  }, [opacity])
  const breathe = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: theme.surfaceMuted }, breathe, style]} />
}

/** Wraps the blocks of one loading page so a screen reader says "loading" once, not nothing at all. */
export function SkeletonGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Đang tải" style={style}>
      {children}
    </View>
  )
}

/**
 * Cards of the shape most lists here use: a title with something at its end, then (orders) a status badge and a line of detail, then text.
 */
export function CardListSkeleton({ count = 4, badge = false, lines = 1 }: { count?: number; badge?: boolean; lines?: number }) {
  return (
    <SkeletonGroup style={styles.list}>
      {Array.from({ length: count }, (_, card) => (
        <Card key={card}>
          <View style={styles.row}>
            <Skeleton width="55%" height={20} />
            <View style={styles.flex} />
            <Skeleton width={64} height={16} />
          </View>
          {badge ? (
            <View style={styles.row}>
              <Skeleton width={88} height={24} radius={radii.pill} />
              <Skeleton width={110} height={12} />
            </View>
          ) : null}
          {Array.from({ length: lines }, (_, line) => (
            <Skeleton key={line} width={line === lines - 1 ? '70%' : '100%'} height={14} />
          ))}
        </Card>
      ))}
    </SkeletonGroup>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
})
