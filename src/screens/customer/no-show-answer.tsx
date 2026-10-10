import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useAnswerNoShow, useMyNoShow } from '@/entities/order-case'
import { formatDateTime } from '@/shared/lib/format'
import { Button, Card, Input, Sheet, Text, radius, spacing } from '@/shared/ui'

const OUTCOME: Record<string, string> = {
  CUSTOMER_AT_FAULT: 'Đơn kết thúc vì không có người nhận.',
  CUSTOMER_RECEIVED: 'Đơn được ghi nhận là đã giao.',
  SHOP_NEVER_CAME: 'Quản trị viên xác nhận quán không đến: đơn bị huỷ và bạn được hoàn tiền nếu đã trả online.',
}

/**
 * The shop says it could not reach the customer at the door (answer-no-show-report.md). The customer answers within two hours;
 * silence is not an admission, it only sends the case to an administrator.
 */
export function NoShowAnswerCard({ orderId }: { orderId: string }) {
  const report = useMyNoShow(orderId, true)
  const answer = useAnswerNoShow(orderId)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const c = report.data
  if (!c) return null
  const waiting = c.status === 'AWAITING_CUSTOMER'

  return (
    <Card>
      <Text variant="titleSm">Quán báo không liên lạc được với bạn</Text>
      {c.note ? <Text variant="bodySm">“{c.note}”</Text> : null}
      {(c.photos ?? []).length > 0 ? (
        <View style={styles.photos}>
          {(c.photos ?? []).map((p) => (
            <Image key={p.key} source={{ uri: p.url }} style={styles.photo} contentFit="cover" />
          ))}
        </View>
      ) : null}
      {waiting ? (
        <>
          <Text variant="bodySm" muted>
            Hãy cho biết bạn đã nhận được hay chưa{c.customerAnswerDueAt ? ` trước ${formatDateTime(c.customerAnswerDueAt)}` : ''}.
          </Text>
          <Button title="Tôi đã nhận được đơn" size="lg" fullWidth loading={answer.isPending} onPress={() => answer.mutate({ answer: 'RECEIVED' })} />
          <Button title="Tôi không nhận được hoặc không muốn nhận" variant="outline" size="lg" fullWidth loading={answer.isPending} onPress={() => answer.mutate({ answer: 'UNABLE' })} />
          <Button title="Quán không đến hoặc không gọi" variant="outline" size="lg" fullWidth onPress={() => setOpen(true)} />
          <Text variant="caption" muted>
            Nếu bạn không nhận hoặc không muốn nhận, lượt này được tính vào số lần báo cáo của bạn.
          </Text>
        </>
      ) : (
        <Text variant="bodySm" muted>
          {c.status === 'OPEN' ? 'Quản trị viên đang xem xét.' : (OUTCOME[c.noShowOutcome ?? ''] ?? 'Đã xử lý.')}
          {c.reason ? ` ${c.reason}` : ''}
        </Text>
      )}
      <Sheet visible={open} onClose={() => setOpen(false)} title="Quán không đến">
        <Text variant="bodySm" muted>
          Cho biết bạn đã chờ ở đâu và quán có gọi hay không. Quản trị viên sẽ xem và quyết định.
        </Text>
        <Input label="Ghi chú" value={note} onChangeText={setNote} multiline maxLength={500} style={styles.note} />
        <Button
          title="Gửi"
          size="lg"
          fullWidth
          disabled={note.trim().length === 0}
          loading={answer.isPending}
          onPress={() => answer.mutate({ answer: 'SHOP_NEVER_CAME', note }, { onSuccess: () => setOpen(false) })}
        />
      </Sheet>
    </Card>
  )
}

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 96, height: 96, borderRadius: radius.sm },
  note: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
})
