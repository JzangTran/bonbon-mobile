import { useRouter } from 'expo-router'
import { ShoppingBag } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useCart } from '@/entities/cart'
import { formatVnd } from '@/shared/lib/format'
import { Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

/** A bar pinned above the bottom edge while the cart has dishes: count, total, and the way to checkout. */
export function CartBar() {
  const router = useRouter()
  const theme = useTheme()
  const { totals, shop } = useCart()
  if (totals.count === 0) return null
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem giỏ hàng, ${totals.count} món, ${formatVnd(totals.itemsTotal)}`}
        onPress={() => router.push('/customer/cart')}
        style={[styles.bar, { backgroundColor: theme.primary }]}
      >
        <ShoppingBag size={20} color={theme.onPrimary} />
        <View style={styles.flex}>
          <Text variant="bodySm" color={theme.onPrimary} numberOfLines={1}>
            {shop?.name}
          </Text>
          <Text variant="caption" color={theme.onPrimary}>
            {totals.count} món
          </Text>
        </View>
        <Text variant="titleSm" color={theme.onPrimary} style={styles.money}>
          {formatVnd(totals.itemsTotal)}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.large, paddingHorizontal: spacing.xl, borderRadius: radius.pill },
  flex: { flex: 1 },
  money: { fontVariant: ['tabular-nums'] },
})
