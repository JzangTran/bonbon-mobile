import { StyleSheet, View } from 'react-native'
import { useTx } from '@/shared/i18n'
import { passwordProblem, passwordStrength } from '@/shared/lib/validate'
import { Text } from './text'
import { radius, spacing } from './tokens'
import { useTheme } from './theme'

/** A four-step bar under a new password, with the reason the server would refuse it, updated while typing. */
export function PasswordStrength({ password, email, name }: { password: string; email?: string; name?: string }) {
  const theme = useTheme()
  const tx = useTx()
  if (!password) return null
  const score = passwordStrength(password, email, name)
  const problem = passwordProblem(password, email, name, tx)
  const color = score <= 1 ? theme.danger : score === 2 ? theme.warning : theme.success
  const labels = ['', tx('Yếu', 'Weak'), tx('Tạm được', 'Fair'), tx('Mạnh', 'Strong'), tx('Rất mạnh', 'Very strong')]
  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i <= score ? color : theme.border }]} />
        ))}
      </View>
      <Text variant="caption" color={problem ? theme.danger : theme.textMuted}>
        {problem ?? tx(`Độ mạnh: ${labels[score]}`, `Strength: ${labels[score]}`)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: radius.pill },
})
