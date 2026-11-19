import { StyleSheet, View, type ViewProps } from 'react-native'
import { useTheme } from './theme'
import { radius, shadows, spacing } from './tokens'

/** A block of related content (design v6, Fluent 2): white surface, 8 pt corners, lifted by shadow4 on the grey canvas. */
export function Card({ style, ...props }: ViewProps) {
  const theme = useTheme()
  return <View style={[styles.card, { backgroundColor: theme.surface }, style]} {...props} />
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: spacing.lg, gap: spacing.sm, ...shadows.card },
})
