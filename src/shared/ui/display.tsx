import { Image } from 'expo-image'
import { ChevronRight, Minus, Plus, Star } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { formatVnd } from '@/shared/lib/format'
import { Text } from './text'
import { useTheme } from './theme'
import { palette, radius, spacing, touchTarget } from './tokens'

const AVATAR = { sm: 32, md: 40, lg: 56 } as const

/** A person or a shop: the photo, or the first letter of the name on the accent's subtle fill. */
export function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: keyof typeof AVATAR }) {
  const theme = useTheme()
  const [failed, setFailed] = useState(false)
  const d = AVATAR[size]
  return (
    <View accessibilityRole="image" accessibilityLabel={name} style={[styles.avatar, { width: d, height: d, backgroundColor: theme.accentSubtle }]}>
      {src && !failed ? (
        <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" onError={() => setFailed(true)} accessibilityElementsHidden />
      ) : (
        <Text variant={size === 'lg' ? 'title3' : 'label'} color={theme.onAccentSubtle}>
          {(name.trim()[0] ?? '?').toUpperCase()}
        </Text>
      )}
    </View>
  )
}

/**
 * One row of a list: leading icon or picture, title, description, trailing value. With `onPress` the whole row is one target with a
 * chevron; rows never hold two competing targets.
 */
export function ListItem({
  title,
  description,
  leading,
  trailing,
  onPress,
}: {
  title: string
  description?: string
  leading?: ReactNode
  trailing?: ReactNode
  onPress?: () => void
}) {
  const theme = useTheme()
  const body = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.flex}>
        <Text numberOfLines={1}>{title}</Text>
        {description ? (
          <Text variant="bodySm" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      {typeof trailing === 'string' ? (
        <Text variant="bodySm" tone="secondary" numberOfLines={1}>
          {trailing}
        </Text>
      ) : (
        trailing
      )}
      {onPress ? <ChevronRight size={20} color={theme.textTertiary} /> : null}
    </>
  )
  if (!onPress) return <View style={styles.row}>{body}</View>
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, typeof trailing === 'string' ? trailing : null, description].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceSubtle }]}
    >
      {body}
    </Pressable>
  )
}

/** Money in the Vietnamese way, in tabular figures; a sale shows the old price struck through, and both are read out. */
export function Price({ amount, original, size = 'md' }: { amount: number; original?: number | null; size?: 'sm' | 'md' | 'lg' }) {
  const sale = original != null && original > amount
  return (
    <View
      accessible
      accessibilityLabel={sale ? `${formatVnd(amount)}, giá cũ ${formatVnd(original)}` : formatVnd(amount)}
      style={styles.price}
    >
      <Text variant={size === 'sm' ? 'label' : size === 'lg' ? 'title3' : 'body'} style={styles.amount}>
        {formatVnd(amount)}
      </Text>
      {sale ? (
        <Text variant="caption" tone="tertiary" style={styles.struck}>
          {formatVnd(original)}
        </Text>
      ) : null}
    </View>
  )
}

/** "★ 4,8 (126)"; without reviews it says so instead of 0. */
export function Rating({ score, count }: { score: number | null | undefined; count: number }) {
  if (!count || score == null)
    return (
      <Text variant="caption" tone="tertiary">
        Chưa có đánh giá
      </Text>
    )
  const value = score.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (
    <View accessible accessibilityLabel={`${value} trên 5 sao, ${count} đánh giá`} style={styles.rating}>
      <Star size={14} color={palette.amber400} fill={palette.amber400} />
      <Text variant="label">{value}</Text>
      <Text variant="bodySm" tone="tertiary">
        ({count})
      </Text>
    </View>
  )
}

/** How many of a dish: − value +, within min…max. */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** what is being counted, for screen readers */
  label: string
}) {
  const theme = useTheme()
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)))
  const btn = (delta: number, name: string, icon: ReactNode, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name} ${label}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => step(delta)}
      style={({ pressed }) => [styles.stepBtn, { borderColor: theme.borderStrong, backgroundColor: pressed ? theme.surfaceSubtle : theme.surface, opacity: disabled ? 0.4 : 1 }]}
    >
      {icon}
    </Pressable>
  )
  return (
    <View
      // one adjustable element for screen readers (swipe up or down to change); the two buttons serve touch
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Số lượng ${label}`}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={styles.stepper}
    >
      {btn(-1, 'Bớt một', <Minus size={16} color={theme.text} />, value <= min)}
      <Text variant="label" style={styles.count}>
        {value}
      </Text>
      {btn(1, 'Thêm một', <Plus size={16} color={theme.text} />, value >= max)}
    </View>
  )
}

/** Work in progress (1–10 s), shown where the result will appear; announced. */
export function Spinner({ label = 'Đang tải' }: { label?: string }) {
  const theme = useTheme()
  return <ActivityIndicator accessibilityLabel={label} color={theme.textSecondary} />
}

const styles = StyleSheet.create({
  avatar: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.large, paddingVertical: spacing.sm },
  leading: { width: 24, alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  price: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  amount: { fontVariant: ['tabular-nums'] },
  struck: { textDecorationLine: 'line-through' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: { width: 36, height: 36, borderRadius: radius.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  count: { minWidth: 24, textAlign: 'center', fontVariant: ['tabular-nums'] },
})
