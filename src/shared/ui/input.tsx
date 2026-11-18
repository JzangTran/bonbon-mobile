import { useState } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing, touchTarget, typography } from './tokens'

type Props = TextInputProps & {
  label: string
  error?: string
  /** shown under the field until there is an error */
  help?: string
  /** a red * before the label; optional fields are not marked */
  required?: boolean
}

/**
 * A ceiling for what can be typed when the field names none: the backend limits every field, so nothing past these could be
 * accepted anyway. A field with its own `maxLength` wins.
 */
function defaultMaxLength(p: TextInputProps): number {
  if (p.secureTextEntry) return 100
  if (p.multiline) return 2000
  switch (p.keyboardType) {
    case 'email-address':
      return 255
    case 'phone-pad':
      return 30
    case 'numeric':
    case 'number-pad':
    case 'decimal-pad':
      return 12
    default:
      return 255
  }
}

/**
 * A labelled text field (design v5; also exported as TextField): label above, always visible; help text below until there is an
 * error; the error replaces it, is announced, and the typed value is kept.
 */
export function Input({ label, error, help, required, style, onFocus, onBlur, ...props }: Props) {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)
  const borderColor = error ? theme.danger : focused ? theme.primary : theme.borderInput

  return (
    <View style={styles.field}>
      <Text variant="label">
        {required ? <Text variant="label" color={theme.danger}>* </Text> : null}
        {label}
      </Text>
      <TextInput
        accessibilityLabel={required ? `${label}, bắt buộc` : label}
        accessibilityHint={error ?? help}
        placeholderTextColor={theme.textTertiary}
        maxLength={defaultMaxLength(props)}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        style={[
          styles.input,
          typography.body,
          { borderColor, color: theme.text, backgroundColor: theme.surface, borderWidth: focused || error ? 2 : 1 },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text variant="bodySm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : help ? (
        <Text variant="caption" tone="tertiary">
          {help}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: { minHeight: touchTarget.min, borderRadius: radius.md, paddingHorizontal: spacing.lg },
})
