import { StyleSheet, View } from 'react-native'
import { describeProblem } from '@/shared/api'
import { Button } from './button'
import { MascotArt } from './illustrations'
import { Text } from './text'
import { spacing } from './tokens'

/**
 * What a screen shows when its content could not be loaded: whose problem it is (no network on the phone, bonbon not answering,
 * a fault at bonbon) in plain words, and a way to try again. A refusal the person can act on keeps the server's own reason.
 */
export function ErrorState({ error, onRetry, retrying = false }: { error: unknown; onRetry?: () => void; retrying?: boolean }) {
  const problem = describeProblem(error)
  return (
    <View style={styles.box} accessibilityRole="alert">
      <MascotArt pose={problem.kind === 'offline' ? 'search' : 'error'} width={150} />
      <Text variant="titleSm" style={styles.center}>
        {problem.title}
      </Text>
      <Text variant="bodySm" muted style={styles.center}>
        {problem.message}
      </Text>
      {onRetry ? <Button title="Thử lại" variant="outline" loading={retrying} onPress={onRetry} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  center: { textAlign: 'center' },
})
