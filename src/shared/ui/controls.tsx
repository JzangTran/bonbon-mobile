import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Switch as RNSwitch, View } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing, touchTarget } from './tokens'

/**
 * A button that shows only an icon (design v5): only for the universal symbols (back, close, search, add, more, notifications,
 * cart, settings). `label` is required: it is the accessible name.
 */
export function IconButton({
  label,
  icon,
  onPress,
  variant = 'ghost',
  disabled,
}: {
  label: string
  icon: ReactNode
  onPress?: () => void
  variant?: 'ghost' | 'secondary' | 'outline'
  disabled?: boolean
}) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.icon,
        {
          backgroundColor: pressed ? theme.surfaceStrong : variant === 'secondary' ? theme.surfaceSubtle : 'transparent',
          borderColor: variant === 'outline' ? theme.borderStrong : 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {icon}
    </Pressable>
  )
}

/**
 * A choice that toggles: a filter ("Gần nhất", "Cơm"), a quick reply. Selected chips use the accent's subtle fill and text; the state
 * is announced. For one-of-many in a form use radio rows; for a single on/off setting use Switch.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  icon,
}: {
  label: string
  selected?: boolean
  onPress?: () => void
  icon?: ReactNode
}) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: theme.accentSubtle, borderColor: 'transparent' }
          : { backgroundColor: pressed ? theme.surfaceSubtle : theme.surface, borderColor: theme.borderStrong },
      ]}
    >
      {icon}
      <Text variant="label" color={selected ? theme.onAccentSubtle : theme.text}>
        {label}
      </Text>
    </Pressable>
  )
}

/**
 * An on/off setting that takes effect at once (accepting orders, notification types), drawn by the platform so it looks and reads
 * the way people expect on iOS and Android. The label row is one target.
 */
export function Switch({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: {
  label: string
  description?: string
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={styles.switchRow}
    >
      <View style={styles.flex}>
        <Text>{label}</Text>
        {description ? (
          <Text variant="bodySm" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      <RNSwitch
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.borderStrong, true: theme.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.borderStrong}
      />
    </Pressable>
  )
}

/** A small status or count label (design v5 tones; 4 px corners, caption style). Always a word, never colour alone. */
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'promo' }) {
  const theme = useTheme()
  const map = {
    neutral: [theme.surfaceSubtle, theme.textSecondary],
    accent: [theme.accentSubtle, theme.onAccentSubtle],
    success: [theme.successSubtle, theme.onSuccessSubtle],
    warning: [theme.warningSubtle, theme.onWarningSubtle],
    danger: [theme.dangerSubtle, theme.onDangerSubtle],
    info: [theme.infoSubtle, theme.onInfoSubtle],
    promo: [theme.promoSubtle, theme.promo],
  } as const
  const [bg, fg] = map[tone]
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" color={fg}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  icon: { width: touchTarget.min, height: touchTarget.min, borderRadius: radius.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.control, borderWidth: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min },
  flex: { flex: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
})
