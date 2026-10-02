import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing, touchTarget } from './tokens'

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
    primary: { bg: theme.primary, bgPressed: theme.primaryPressed, fg: theme.onPrimary },
    outline: { bg: 'transparent', bgPressed: theme.surfaceMuted, fg: theme.text, border: theme.borderInput },
    ghost: { bg: 'transparent', bgPressed: theme.surfaceMuted, fg: theme.text },
    destructive: { bg: theme.danger, bgPressed: theme.danger, fg: '#FFFFFF' },
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
        <Text variant={size === 'lg' ? 'titleSm' : 'body'} color={p.fg} style={styles.label}>
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: 'BeVietnamPro_600SemiBold' },
})
