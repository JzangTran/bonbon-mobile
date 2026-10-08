import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, useShopCases, type CaseStatus } from '@/entities/order-case'
import { problemMessage } from '@/shared/api'
import { useNow } from '@/shared/lib/countdown'
import { formatDateTime, formatVnd } from '@/shared/lib/format'
import { Button, Card, Notice, Screen, Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

const TABS: { id: CaseStatus; label: string }[] = [
  { id: 'AWAITING_SHOP', label: 'Chờ trả lời' },
  { id: 'OPEN', label: 'Chờ quản trị' },
  { id: 'UPHELD', label: 'Đã chấp nhận' },
  { id: 'DISMISSED', label: 'Đã bác bỏ' },
]

/** What customers reported about this shop's delivered orders (respond-to-order-case.md); waiting ones come first. */
export default function SellerOrderCasesScreen() {
  const theme = useTheme()
  const router = useRouter()
  const now = useNow(60_000)
  const [tab, setTab] = useState<CaseStatus>('AWAITING_SHOP')
  const cases = useShopCases(tab)
  const items = cases.data?.items ?? []

  return (
    <Screen>
      <View>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller/shop')} />
      </View>
      <Text variant="headline">Khiếu nại của khách</Text>
      <Text variant="bodySm" muted>
        Bạn có 12 giờ để chấp nhận (khách được hoàn tiền) hoặc phản đối (quản trị viên quyết định).
      </Text>
      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            onPress={() => setTab(t.id)}
            style={[styles.tab, { borderColor: tab === t.id ? theme.primary : theme.borderInput, backgroundColor: tab === t.id ? theme.primarySubtle : theme.surface }]}
          >
            <Text variant="bodySm" color={tab === t.id ? theme.onPrimarySubtle : theme.text}>
              {t.label}
              {tab === t.id && (cases.data?.total ?? 0) > 0 ? `  ${cases.data?.total}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {cases.isError ? <Notice tone="error" message={problemMessage(cases.error, 'Không tải được khiếu nại lúc này.')} /> : null}
      {cases.data && items.length === 0 ? (
        <Card>
          <Text muted>Không có khiếu nại nào ở mục này.</Text>
        </Card>
      ) : null}
      {items.map((item) => {
        const hoursLeft = item.status === 'AWAITING_SHOP' && item.shopResponseDueAt ? Math.max(0, Math.ceil((new Date(item.shopResponseDueAt).getTime() - now) / 3_600_000)) : null
        return (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/seller/order-case', params: { id: item.id } })}>
            <Card>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text variant="titleSm">Đơn #{item.orderNumber}</Text>
                  <Text variant="bodySm">{CASE_TYPE_LABEL[item.type ?? ''] ?? item.type}</Text>
                </View>
                <Text variant="titleSm">{formatVnd(item.shopBears)}</Text>
              </View>
              <Text variant="bodySm" muted>
                {CASE_STATUS_LABEL[item.status ?? '']?.shop ?? item.status} · {formatDateTime(item.openedAt)}
                {hoursLeft !== null ? ` · còn khoảng ${hoursLeft} giờ` : ''}
              </Text>
            </Card>
          </Pressable>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tab: { minHeight: touchTarget.min, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
})
