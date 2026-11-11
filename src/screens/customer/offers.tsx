import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, TicketPercent } from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShopVouchers, voucherCondition, voucherEnds, voucherTitle } from '@/entities/vendor'
import { Text, ErrorState, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

/** "Ưu đãi": every voucher of a shop, rising over the shop's page; a voucher opens its details. */
export default function OffersScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>()
  const router = useRouter()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const vouchers = useShopVouchers(vendorId)
  const list = vouchers.data ?? []
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.head, { paddingTop: insets.top + spacing.sm, borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={8} onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text variant="title" accessibilityRole="header">
          Ưu đãi
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {vouchers.isError ? <ErrorState error={vouchers.error} onRetry={() => void vouchers.refetch()} /> : null}
        {vouchers.data && list.length === 0 ? <Text muted>Quán chưa có ưu đãi nào lúc này.</Text> : null}
        {list.map((v) => (
          <Pressable
            key={v.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/customer/offer', params: { vendorId, id: v.id } })}
            style={[styles.row, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <View style={[styles.icon, { backgroundColor: theme.primarySubtle }]}>
              <TicketPercent size={24} color={theme.primary} strokeWidth={1.75} />
            </View>
            <View style={styles.flex}>
              <Text variant="body" style={styles.title}>
                {voucherTitle(v)}
              </Text>
              <Text variant="bodySm" muted>
                {voucherCondition(v)}
              </Text>
              <Text variant="caption" muted>
                {voucherEnds(v)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1 },
  back: { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semibold },
})
