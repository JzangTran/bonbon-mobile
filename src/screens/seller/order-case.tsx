import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, useCaseAnswer, useShopCase } from '@/entities/order-case'
import { problemMessage } from '@/shared/api'
import { confirm } from '@/shared/lib/confirm'
import { formatDateTime, formatVnd } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Screen, Sheet, Text, radius, spacing } from '@/shared/ui'

/** One complaint with the customer's evidence, and the shop's two answers (respond-to-order-case.md). */
export default function SellerOrderCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const detail = useShopCase(id)
  const { accept, dispute } = useCaseAnswer(id)
  const [disputing, setDisputing] = useState(false)
  const [note, setNote] = useState('')
  const c = detail.data

  const askAccept = async () => {
    if (await confirm('Chấp nhận khiếu nại?', `Khách được hoàn ${formatVnd(c?.refundAmount)}. Quán chịu ${formatVnd(c?.shopBears)} và không hoàn tác được.`, 'Chấp nhận')) {
      accept.mutate()
    }
  }

  return (
    <Screen>
      <View>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller/order-cases')} />
      </View>
      {detail.isError ? <Notice tone="error" message={problemMessage(detail.error, 'Không tìm thấy khiếu nại này.')} /> : null}
      {c ? (
        <>
          <Text variant="headline">Đơn #{c.orderNumber}</Text>
          <Text>{CASE_TYPE_LABEL[c.type ?? ''] ?? c.type}</Text>
          <Text variant="bodySm" muted>
            {CASE_STATUS_LABEL[c.status ?? '']?.shop ?? c.status} · gửi lúc {formatDateTime(c.openedAt)}
            {c.status === 'AWAITING_SHOP' && c.shopResponseDueAt ? ` · trả lời trước ${formatDateTime(c.shopResponseDueAt)}` : ''}
          </Text>

          <Card>
            <Text variant="titleSm">Số tiền</Text>
            <Text variant="bodySm">Khách được hoàn {formatVnd(c.refundAmount)}</Text>
            <Text variant="bodySm">Quán chịu {formatVnd(c.shopBears)} (đã trừ hoa hồng được hoàn lại)</Text>
          </Card>

          <Card>
            <Text variant="titleSm">Món bị báo</Text>
            {(c.lines ?? []).map((line) => (
              <View key={line.orderItemId} style={styles.row}>
                <Text style={styles.flex}>
                  {line.quantity}× {line.name}
                </Text>
                <Text muted>{formatVnd(line.refundAmount)}</Text>
              </View>
            ))}
          </Card>

          {c.note ? (
            <Card>
              <Text variant="titleSm">Khách nói</Text>
              <Text>{c.note}</Text>
            </Card>
          ) : null}

          {(c.photos ?? []).length > 0 ? (
            <Card>
              <Text variant="titleSm">Ảnh khách gửi</Text>
              <View style={styles.photos}>
                {(c.photos ?? []).map((photo) => (
                  <Image key={photo.key} source={{ uri: photo.url }} style={styles.photo} contentFit="cover" />
                ))}
              </View>
            </Card>
          ) : null}

          {c.shopResponse ? (
            <Card>
              <Text variant="titleSm">Quán đã trả lời</Text>
              <Text>{c.shopResponse === 'ACCEPTED' ? 'Chấp nhận.' : 'Phản đối.'}</Text>
              {c.shopResponseNote ? <Text variant="bodySm">{c.shopResponseNote}</Text> : null}
            </Card>
          ) : null}

          {c.decidedAt ? (
            <Card>
              <Text variant="titleSm">Kết quả</Text>
              <Text>
                {c.status === 'UPHELD' ? 'Được chấp nhận' : 'Bị bác bỏ'}
                {c.decidedBy === 'ADMIN' ? ' bởi quản trị viên' : ''} lúc {formatDateTime(c.decidedAt)}.
              </Text>
              {c.reason ? <Text variant="bodySm">{c.reason}</Text> : null}
            </Card>
          ) : null}

          {c.status === 'AWAITING_SHOP' ? (
            <>
              <Button title="Chấp nhận" size="lg" fullWidth loading={accept.isPending} onPress={() => void askAccept()} />
              <Button
                title="Phản đối"
                variant="outline"
                size="lg"
                fullWidth
                onPress={() => {
                  setNote('')
                  setDisputing(true)
                }}
              />
            </>
          ) : null}

          <Sheet visible={disputing} onClose={() => setDisputing(false)} title="Phản đối khiếu nại">
            <Text variant="bodySm" muted>
              Quản trị viên sẽ quyết định. Lý do của bạn được gửi kèm và khách cũng thấy.
            </Text>
            <Input label="Lý do" value={note} onChangeText={setNote} multiline maxLength={500} style={styles.note} />
            <Button
              title="Gửi cho quản trị viên"
              size="lg"
              fullWidth
              disabled={note.trim().length === 0}
              loading={dispute.isPending}
              onPress={() => dispute.mutate(note, { onSuccess: () => setDisputing(false) })}
            />
          </Sheet>
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 96, height: 96, borderRadius: radius.sm },
  note: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
})
