import { StyleSheet, View } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

/** v4 inline message, kept for the screens that use it; new code uses InlineMessage (title, what it means, action). */
export function Notice({ tone, message }: { tone: 'error' | 'success' | 'warning'; message: string | null }) {
  const theme = useTheme()
  if (!message) return null
  const colors =
    tone === 'error' ? { bg: theme.dangerSubtle, fg: theme.onDangerSubtle }
    : tone === 'warning' ? { bg: theme.warningSubtle, fg: theme.onWarningSubtle }
    : { bg: theme.successSubtle, fg: theme.onSuccessSubtle }
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: colors.bg }]}
    >
      <Text variant="bodySm" color={colors.fg}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.lg, padding: spacing.md },
})
