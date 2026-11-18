import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { fonts, radius, spacing, touchTarget } from './tokens'

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive'
type Size = 'md' | 'lg'

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}

export function Button({ title, variant = 'primary', size = 'md', loading, fullWidth, disabled, style, ...props }: Props) {
  const theme = useTheme()
  const isDisabled = disabled || loading

  const palette: Record<Variant, { bg: string; bgPressed: string; fg: string; border?: string }> = {
    // design v5: the one main action in the accent; the second one on the surface with a strong outline; ghost is text only
    primary: { bg: theme.accent, bgPressed: theme.accentPressed, fg: theme.onAccent },
    outline: { bg: theme.surface, bgPressed: theme.surfaceSubtle, fg: theme.text, border: theme.borderStrong },
    ghost: { bg: 'transparent', bgPressed: theme.surfaceSubtle, fg: theme.text },
    destructive: { bg: theme.danger, bgPressed: theme.danger, fg: theme.onDanger },
  }
  const p = palette[variant]

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: size === 'lg' ? touchTarget.large : touchTarget.min,
          backgroundColor: pressed ? p.bgPressed : p.bg,
          borderColor: p.border ?? 'transparent',
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <Text variant={size === 'lg' ? 'body' : 'label'} color={p.fg} style={styles.label}>
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.xl,
    borderRadius: radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.semibold },
})
