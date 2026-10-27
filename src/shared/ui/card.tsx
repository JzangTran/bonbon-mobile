import { StyleSheet, View, type ViewProps } from 'react-native'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme()
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]} {...props} />
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
})
