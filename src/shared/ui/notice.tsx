import { StyleSheet, View } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

/** Inline result message under a form; announced to screen readers. */
export function Notice({ tone, message }: { tone: 'error' | 'success'; message: string | null }) {
  const theme = useTheme()
  if (!message) return null
  const colors = tone === 'error' ? { bg: theme.dangerSubtle, fg: theme.onDangerSubtle } : { bg: theme.successSubtle, fg: theme.onSuccessSubtle }
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
  box: { borderRadius: radius.sm, padding: spacing.md },
})
