import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { problemMessage } from '@/shared/api'
import {
  APPEAL_LABEL,
  CONSEQUENCE_LABEL,
  FAULT_LABEL,
  useAppealPenalty,
  useMyPerformance,
  useMySuspension,
  useWeekFaults,
  type ShopPenalty,
} from '@/entities/performance'
import { formatDateTime } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Screen, Sheet, Text, spacing, useTheme } from '@/shared/ui'

function day(value: string | undefined): string {
  if (!value) return ''
  const [, m, d] = value.split('-')
  return `${d}/${m}`
}

/** How the shop is doing on the orders it fails, the points that follow and what they lead to (view-shop-performance.md). */
export default function SellerPerformanceScreen() {
  const theme = useTheme()
  const router = useRouter()
  const performance = useMyPerformance()
  const suspension = useMySuspension()
  const [week, setWeek] = useState<string | null>(null)
  const faults = useWeekFaults(week)
  const appeal = useAppealPenalty()
  const [appealing, setAppealing] = useState<ShopPenalty | null>(null)
  const [reason, setReason] = useState('')
  const p = performance.data
  const s = p?.standing
  const danger = s?.consequence === 'RESTRICTED' || s?.consequence === 'RESTRICTION_SCHEDULED'

  return (
    <Screen>
      <View>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller/shop')} />
      </View>
      <Text variant="headline">Hiệu suất cửa hàng</Text>
      <Text variant="bodySm" muted>
        Đơn thất bại do quán. Đơn khách huỷ, thanh toán quá hạn và hoàn một phần không bị tính.
      </Text>

      {suspension.data && suspension.data.status !== 'NONE' ? (
        <Card style={{ borderWidth: 2, borderColor: theme.danger }}>
          <Text variant="titleSm" color={theme.danger}>
            {suspension.data.status === 'SUSPENDED' ? 'Quán đang bị đình chỉ' : 'Quán sắp bị đình chỉ'}
          </Text>
          <Text variant="bodySm">
            {suspension.data.status === 'SUSPENDED'
              ? 'Khách không tìm thấy quán và không đặt thêm được. Bạn vẫn hoàn tất các đơn đang làm và xem được thu nhập.'
              : `Từ ${formatDateTime(suspension.data.effectiveAt)} quán sẽ bị đình chỉ. Đến lúc đó quán vẫn hoạt động bình thường.`}
          </Text>
          {suspension.data.reason ? (
            <Text variant="bodySm" muted>
              Lý do: {suspension.data.reason}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {performance.isError ? <Notice tone="error" message={problemMessage(performance.error, 'Không tải được hiệu suất lúc này.')} /> : null}
      {s ? (
        <Card>
          <Text variant="display">{s.activePoints ?? 0}</Text>
          <Text variant="bodySm" muted>
            điểm phạt còn hiệu lực
          </Text>
          <Text variant="titleSm" color={danger ? theme.danger : undefined}>
            {CONSEQUENCE_LABEL[s.consequence ?? 'NONE'] ?? s.consequence}
          </Text>
          <Text variant="bodySm">
            {s.consequence === 'RESTRICTED'
              ? 'Quán không hiện khi khách tìm kiếm và xếp cuối danh sách, nhưng khách mở thẳng quán vẫn đặt được. Gỡ ngay khi điểm xuống dưới 3.'
              : s.consequence === 'RESTRICTION_SCHEDULED'
                ? `Từ ${formatDateTime(s.restrictionStartsAt)} quán sẽ bị hạn chế hiển thị. Điểm xuống dưới 3 trước ngày đó thì được huỷ.`
                : s.consequence === 'WARNING'
                  ? 'Mới là cảnh báo. Từ 3 điểm quán bị hạn chế hiển thị, sau khi được báo trước 5 ngày.'
                  : 'Quán đang đạt yêu cầu.'}
          </Text>
          <Text variant="caption" muted>
            Mỗi thứ Hai hệ thống đánh giá tuần vừa đóng: từ {p?.minOrders} đơn mà tỷ lệ lỗi vượt {p?.thresholdPercent}% thì bị 1 điểm; điểm hết hạn sau 90 ngày.
          </Text>
        </Card>
      ) : null}

      <Text variant="titleSm">Theo tuần</Text>
      {(p?.weeks ?? []).map((w) => (
        <Card key={w.start}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text>
                {day(w.start)} – {day(w.end)}
                {w.current ? ' (tạm tính)' : ''}
              </Text>
              <Text variant="bodySm" muted>
                {w.faultOrders} đơn lỗi trên {w.finishedOrders} đơn · {w.ratePercent}%
                {w.penalised ? ' · +1 điểm' : !w.current && !w.counted ? ` · chưa đủ ${p?.minOrders} đơn` : ''}
              </Text>
            </View>
            {(w.faultOrders ?? 0) > 0 ? <Button title={week === w.start ? 'Ẩn' : 'Xem đơn'} variant="outline" onPress={() => setWeek(week === w.start ? null : (w.start ?? null))} /> : null}
          </View>
          {week === w.start
            ? (faults.data ?? []).map((f) => (
                <Text key={`${f.orderId}-${f.type}`} variant="bodySm">
                  Đơn #{f.orderNumber} · {FAULT_LABEL[f.type ?? ''] ?? f.type}
                </Text>
              ))
            : null}
        </Card>
      ))}

      <Text variant="titleSm">Điểm phạt</Text>
      {p && (p.penalties ?? []).length === 0 ? (
        <Card>
          <Text muted>Quán chưa có điểm phạt nào.</Text>
        </Card>
      ) : null}
      {(p?.penalties ?? []).map((pen) => (
        <Card key={pen.id}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text>
                {pen.points} điểm · {pen.source === 'MANUAL' ? 'quản trị viên cộng' : `tuần ${day(pen.weekStart)}`}
                {pen.status === 'WAIVED' ? ' · đã miễn' : ''}
              </Text>
              <Text variant="caption" muted>
                Cấp {formatDateTime(pen.issuedAt)} · hết hạn {formatDateTime(pen.expiresAt)}
              </Text>
            </View>
            {pen.canAppeal ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setReason('')
                  setAppealing(pen)
                }}
              >
                <Text color={theme.primary}>Kháng nghị</Text>
              </Pressable>
            ) : null}
          </View>
          {pen.reason ? <Text variant="bodySm">Lý do: {pen.reason}</Text> : null}
          {pen.appealStatus ? (
            <Text variant="bodySm" muted>
              {APPEAL_LABEL[pen.appealStatus] ?? pen.appealStatus}
            </Text>
          ) : null}
          {pen.decisionReason ? (
            <Text variant="bodySm" muted>
              Quản trị viên: {pen.decisionReason}
            </Text>
          ) : null}
          {pen.canAppeal ? (
            <Text variant="caption" muted>
              Kháng nghị được đến {formatDateTime(pen.appealDeadline)}
            </Text>
          ) : null}
        </Card>
      ))}

      <Sheet visible={appealing !== null} onClose={() => setAppealing(null)} title="Kháng nghị điểm phạt">
        <Text variant="bodySm" muted>
          Mỗi điểm kháng nghị được một lần. Trong lúc chờ, hạn chế (nếu có) vẫn giữ nguyên; nếu được chấp nhận, điểm được miễn và hậu quả tính lại ngay.
        </Text>
        <Input label="Vì sao điểm này không đúng?" value={reason} onChangeText={setReason} multiline maxLength={500} style={styles.note} />
        <Button
          title="Gửi kháng nghị"
          size="lg"
          fullWidth
          disabled={reason.trim().length === 0}
          loading={appeal.isPending}
          onPress={() => {
            if (appealing?.id) appeal.mutate({ id: appealing.id, reason }, { onSuccess: () => setAppealing(null) })
          }}
        />
      </Sheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  note: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
})
