import { ChevronRight } from 'lucide-react-native'
import { Children, Fragment, type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { fonts, radius, spacing, touchTarget } from './tokens'

/**
 * A group of rows (Fluent list, design v6.1): a small label above, then the rows in one bordered block with thin lines between
 * them. The label is quieter than the rows, because the rows are what the person came for.
 */
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const theme = useTheme()
  const rows = Children.toArray(children).filter(Boolean)
  if (rows.length === 0) return null
  return (
    <View style={styles.group}>
      {title ? (
        <Text variant="caption" color={theme.textTertiary} style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <View style={[styles.block, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={[styles.line, { backgroundColor: theme.divider }]} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  )
}

/** One row: an optional icon, the label, an optional value on the right, a chevron. `tone="danger"` for sign-out and the like. */
export function ListRow({ label, value, icon, onPress, tone, chevron = true }: {
  label: string
  value?: string | null
  icon?: ReactNode
  onPress: () => void
  tone?: 'danger'
  chevron?: boolean
}) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceSubtle }]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.flex, tone === 'danger' && styles.danger]} color={tone === 'danger' ? theme.danger : theme.text}>
        {label}
      </Text>
      {value ? (
        <Text variant="bodySm" color={theme.textTertiary} numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      {chevron ? <ChevronRight size={18} color={theme.textTertiary} strokeWidth={1.5} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  title: { fontFamily: fonts.semibold, paddingHorizontal: spacing.xs },
  block: { borderWidth: 1, borderRadius: radius.card, overflow: 'hidden' },
  line: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.large, paddingHorizontal: spacing.lg },
  icon: { width: 22, alignItems: 'center' },
  flex: { flex: 1 },
  danger: { fontFamily: fonts.semibold },
  value: { maxWidth: '45%' },
})
