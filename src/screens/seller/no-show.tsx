import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet } from 'react-native'
import { CASE_STATUS_LABEL, useReportNoShow, useShopNoShow, type PickedPhoto } from '@/entities/order-case'
import { Button, Card, Input, Sheet, Text, radius, spacing, useToast } from '@/shared/ui'
import { formatDateTime } from '@/shared/lib/format'
import { pickImages } from '@/shared/lib/pick-image'

/**
 * An order out for delivery whose customer is not there (report-customer-no-show.md). Only the shop knows, so it is opt-in: a shop
 * that never reports gets the usual "delivered after 3 hours". The server decides when it is too early; its message is shown as it is.
 */
export function NoShowCard({ orderId }: { orderId: string }) {
  const existing = useShopNoShow(orderId)
  const toast = useToast()
  const report = useReportNoShow(orderId)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<PickedPhoto | null>(null)

  const pick = async () => {
    const { images, problems } = await pickImages({ limit: 1 })
    problems.forEach((p) => toast.show(p))
    if (images[0]) setPhoto(images[0])
  }

  if (existing.isPending) return null
  if (existing.data) {
    return (
      <Card>
        <Text variant="titleSm">Đã báo khách vắng mặt</Text>
        <Text variant="bodySm">{CASE_STATUS_LABEL[existing.data.status ?? '']?.shop ?? existing.data.status}</Text>
        <Text variant="caption" muted>
          Gửi lúc {formatDateTime(existing.data.openedAt)}. Khách có 2 giờ để trả lời; nếu không đồng ý hoặc không trả lời, quản trị viên quyết định.
        </Text>
      </Card>
    )
  }

  return (
    <Card>
      <Text variant="titleSm">Không liên lạc được với khách?</Text>
      <Text variant="bodySm" muted>
        Sau khi chờ một lúc ở cửa, bạn báo để đơn không bị treo. Khách được hỏi lại; không có khoản tiền nào bị đòi.
      </Text>
      <Button title="Báo khách vắng mặt" variant="outline" size="lg" fullWidth onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => setOpen(false)} title="Báo khách vắng mặt">
        <Text variant="bodySm" muted>
          Ghi lại bạn đã làm gì: gọi mấy lần, gõ cửa, chờ bao lâu. Có thể gửi kèm một ảnh (cửa, nhật ký cuộc gọi).
        </Text>
        <Input label="Ghi chú" value={note} onChangeText={setNote} multiline maxLength={500} style={styles.note} />
        {photo ? <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" /> : null}
        <Button title={photo ? 'Chọn ảnh khác' : 'Thêm ảnh (không bắt buộc)'} variant="outline" onPress={() => void pick()} />
        <Button
          title="Gửi báo cáo"
          size="lg"
          fullWidth
          disabled={note.trim().length === 0}
          loading={report.isPending}
          onPress={() => report.mutate({ note, photo }, { onSuccess: () => setOpen(false) })}
        />
      </Sheet>
    </Card>
  )
}

const styles = StyleSheet.create({
  note: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
  photo: { width: 96, height: 96, borderRadius: radius.lg },
})
