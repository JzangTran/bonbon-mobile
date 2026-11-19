import { ChevronRight } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { formatVnd } from '@/shared/lib/format'
import { Text, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

/** One payment: what it was and where the money went, the amount at the end. */
export function TransactionRow({ amount, onPress }: { amount: number; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Thanh toán ${formatVnd(amount)} đến bonbon`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}
    >
      <View style={styles.flex}>
        <Text>Thanh toán</Text>
        <Text variant="bodySm" color={theme.textTertiary}>
          Đến bonbon
        </Text>
      </View>
      <Text style={styles.amount}>{formatVnd(amount)}</Text>
      <ChevronRight size={20} color={theme.textTertiary} strokeWidth={1.5} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, minHeight: touchTarget.min, borderRadius: radius.md },
  amount: { fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] },
})
