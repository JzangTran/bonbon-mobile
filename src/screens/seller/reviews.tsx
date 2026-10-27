import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ReviewItem, useReplyActions, useSellerReviews, type Review } from '@/entities/review'
import { problemMessage } from '@/shared/api'
import { confirm } from '@/shared/lib/confirm'
import { useNow } from '@/shared/lib/countdown'
import { formatDateTime } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Screen, Sheet, Text, radius, spacing, touchTarget, useTheme, useToast } from '@/shared/ui'

/** Customers' reviews of the shop, with the one reply each (respond-to-review.md); a reply can change for 24 hours. */
export default function SellerReviewsScreen() {
  const theme = useTheme()
  const toast = useToast()
  const router = useRouter()
  const [unreplied, setUnreplied] = useState(false)
  const reviews = useSellerReviews(unreplied)
  const { save, remove } = useReplyActions()
  const [target, setTarget] = useState<Review | null>(null)
  const [text, setText] = useState('')
  const items = (reviews.data?.pages ?? []).flatMap((page) => page.items ?? [])
  const total = reviews.data?.pages[0]?.total ?? 0
  const editing = !!target?.reply

  const openReply = (review: Review) => {
    setTarget(review)
    setText(review.reply?.text ?? '')
  }

  const submit = () => {
    if (!target?.id) return
    save.mutate(
      { reviewId: target.id, text, existing: editing },
      {
        onSuccess: () => {
          setTarget(null)
          toast.show(editing ? 'Đã cập nhật phản hồi.' : 'Đã gửi phản hồi.')
        },
      },
    )
  }

  const askDelete = async (review: Review) => {
    if (review.id && (await confirm('Xoá phản hồi này?', 'Bạn có thể phản hồi lại sau đó.', 'Xoá'))) {
      remove.mutate(review.id, { onSuccess: () => toast.show('Đã xoá phản hồi.') })
    }
  }

  return (
    <Screen>
      <View style={styles.top}>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller/shop')} />
      </View>
      <Text variant="headline">Đánh giá của khách</Text>
      <View style={styles.tabs} accessibilityRole="tablist">
        {[
          { id: false, label: 'Tất cả' },
          { id: true, label: 'Chưa phản hồi' },
        ].map((tab) => (
          <Pressable
            key={String(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: unreplied === tab.id }}
            onPress={() => setUnreplied(tab.id)}
            style={[
              styles.tab,
              { borderColor: unreplied === tab.id ? theme.primary : theme.borderInput, backgroundColor: unreplied === tab.id ? theme.primarySubtle : theme.surface },
            ]}
          >
            <Text variant="bodySm" color={unreplied === tab.id ? theme.onPrimarySubtle : theme.text}>
              {tab.label}
              {unreplied === tab.id && total > 0 ? `  ${total}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {reviews.isError ? <Notice tone="error" message={problemMessage(reviews.error, 'Không tải được đánh giá lúc này.')} /> : null}
      {reviews.data && items.length === 0 ? (
        <Card>
          <Text muted>{unreplied ? 'Bạn đã phản hồi hết các đánh giá.' : 'Quán chưa có đánh giá nào.'}</Text>
        </Card>
      ) : null}

      {items.map((review) => (
        <Card key={review.id}>
          <Text variant="caption" muted>
            Đơn #{review.orderNumber}
          </Text>
          <ReviewItem
            review={review}
            footer={
              <ReplyActions
                review={review}
                busy={remove.isPending}
                onReply={() => openReply(review)}
                onDelete={() => void askDelete(review)}
              />
            }
          />
        </Card>
      ))}
      {reviews.hasNextPage ? (
        <Button title="Xem thêm" variant="outline" loading={reviews.isFetchingNextPage} onPress={() => void reviews.fetchNextPage()} />
      ) : null}

      <Sheet visible={target !== null} onClose={() => setTarget(null)} title={editing ? 'Sửa phản hồi' : 'Phản hồi đánh giá'}>
        <Text variant="bodySm" muted>
          Phản hồi hiển thị công khai dưới đánh giá. Hãy lịch sự và cụ thể.
        </Text>
        <Input label="Nội dung" value={text} onChangeText={setText} multiline maxLength={1000} style={styles.reply} />
        <Button title={editing ? 'Lưu thay đổi' : 'Gửi phản hồi'} size="lg" fullWidth disabled={text.trim().length === 0} loading={save.isPending} onPress={submit} />
      </Sheet>
    </Screen>
  )
}

function ReplyActions({ review, busy, onReply, onDelete }: { review: Review; busy: boolean; onReply: () => void; onDelete: () => void }) {
  const now = useNow(60_000)
  const reply = review.reply
  if (!reply) return <Button title="Phản hồi" onPress={onReply} />
  if (reply.hidden) return null
  const open = !!reply.editableUntil && new Date(reply.editableUntil).getTime() > now
  if (!open) {
    return (
      <Text variant="caption" muted>
        Đã quá 24 giờ, không sửa hoặc xoá được phản hồi.
      </Text>
    )
  }
  return (
    <View style={styles.actions}>
      <Text variant="caption" muted>
        Sửa hoặc xoá được đến {formatDateTime(reply.editableUntil)}
      </Text>
      <View style={styles.buttons}>
        <Button title="Sửa phản hồi" variant="outline" onPress={onReply} />
        <Button title="Xoá" variant="outline" loading={busy} onPress={onDelete} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-start' },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { minHeight: touchTarget.min, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  actions: { gap: spacing.xs },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  reply: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
})
