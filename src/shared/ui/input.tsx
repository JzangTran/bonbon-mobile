import { useState } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { fonts, radius, spacing, touchTarget, typography } from './tokens'

type Props = TextInputProps & { label: string; error?: string }

export function Input({ label, error, style, onFocus, onBlur, ...props }: Props) {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)
  const borderColor = error ? theme.danger : focused ? theme.primary : theme.borderInput

  return (
    <View style={styles.field}>
      <Text variant="bodySm" style={styles.label}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textMuted}
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
        <Text variant="bodySm" color={theme.danger} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontFamily: fonts.medium },
  input: { minHeight: touchTarget.min, borderRadius: radius.sm, paddingHorizontal: spacing.md },
})
