import { StyleSheet, View, type ViewProps } from 'react-native'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

/**
 * A block of related content (design v6.1, Fluent 2): white, 8 pt corners and a thin light border, set apart by space; never a
 * shadow (owner 2026-11-19). 16 pt inside, 12 pt between its parts.
 */
export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme()
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]} {...props} />
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
})
