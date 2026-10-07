import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ReviewItem, StarPicker, useMyOrderReview, useOrderReviewActions } from '@/entities/review'
import { confirm } from '@/shared/lib/confirm'
import { useNow } from '@/shared/lib/countdown'
import { formatDateTime } from '@/shared/lib/format'
import { Button, Card, Input, Sheet, Text, spacing, useToast } from '@/shared/ui'

const PROMPTS = ['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Rất tốt']

/**
 * After DELIVERED: asks for a rating once, then shows the review with the shop's reply. Edit and delete stay open
 * for 24 hours (the server decides; {@code editableUntil} only tells us when to stop offering them).
 */
export function OrderReviewCard({ orderId, reviewed }: { orderId: string; reviewed: boolean }) {
  const toast = useToast()
  const now = useNow(60_000)
  const mine = useMyOrderReview(orderId, reviewed)
  const { save, remove } = useOrderReviewActions(orderId)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const review = mine.data
  const existing = reviewed && review !== undefined
  const canChange = existing && !review.hidden && !!review.editableUntil && new Date(review.editableUntil).getTime() > now

  const openForm = () => {
    setRating(review?.rating ?? 0)
    setComment(review?.comment ?? '')
    setOpen(true)
  }

  const submit = () => {
    save.mutate(
      { rating, comment, existing },
      {
        onSuccess: () => {
          setOpen(false)
          toast.show(existing ? 'Đã cập nhật đánh giá.' : 'Cảm ơn bạn đã đánh giá!')
        },
      },
    )
  }

  const askDelete = async () => {
    if (await confirm('Xoá đánh giá này?', 'Phản hồi của quán (nếu có) cũng mất. Bạn vẫn có thể đánh giá lại.', 'Xoá')) {
      remove.mutate(undefined, { onSuccess: () => toast.show('Đã xoá đánh giá.') })
    }
  }

  return (
    <Card>
      <Text variant="titleSm">Đánh giá của bạn</Text>
      {!reviewed ? (
        <>
          <Text variant="bodySm" muted>
            Đơn này thế nào? Đánh giá giúp người khác chọn quán và giúp quán làm tốt hơn.
          </Text>
          <Button title="Đánh giá quán" size="lg" fullWidth onPress={openForm} />
        </>
      ) : review ? (
        <ReviewItem
          review={review}
          footer={
            canChange ? (
              <View style={styles.actions}>
                <Text variant="caption" muted>
                  Sửa hoặc xoá được đến {formatDateTime(review.editableUntil)}
                </Text>
                <View style={styles.buttons}>
                  <Button title="Sửa" variant="outline" onPress={openForm} />
                  <Button title="Xoá" variant="outline" loading={remove.isPending} onPress={() => void askDelete()} />
                </View>
              </View>
            ) : review.hidden ? null : (
              <Text variant="caption" muted>
                Đã quá thời hạn sửa hoặc xoá.
              </Text>
            )
          }
        />
      ) : (
        <Text variant="bodySm" muted>
          Đang tải…
        </Text>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title={existing ? 'Sửa đánh giá' : 'Đánh giá quán'}>
        <StarPicker value={rating} onChange={setRating} />
        <Text variant="bodySm" muted style={styles.center}>
          {PROMPTS[rating] || 'Chạm vào sao để chọn'}
        </Text>
        <Input label="Nhận xét (không bắt buộc)" value={comment} onChangeText={setComment} multiline maxLength={1000} style={styles.comment} placeholder="Món ăn, đóng gói, giao hàng…" />
        <Button title={existing ? 'Lưu thay đổi' : 'Gửi đánh giá'} size="lg" fullWidth disabled={rating === 0} loading={save.isPending} onPress={submit} />
      </Sheet>
    </Card>
  )
}

const styles = StyleSheet.create({
  actions: { gap: spacing.xs },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  center: { textAlign: 'center' },
  comment: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
})
