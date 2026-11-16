import { Pressable, StyleSheet, View } from 'react-native'
import { useState } from 'react'
import { useSession } from '@/entities/session'
import { ReportSheet, type ReportTarget } from '@/features/report-content'
import { RatingSummary, ReviewItem, useShopReviews } from '@/entities/review'
import { problemMessage } from '@/shared/api'
import { Button, Card, Notice, Text, spacing, useTheme } from '@/shared/ui'

/** What other customers said about the shop (reviews are public), with the shop's replies; ten at a time. */
export function ShopReviewsCard({ vendorId }: { vendorId: string }) {
  const theme = useTheme()
  const { session } = useSession()
  const [reporting, setReporting] = useState<ReportTarget | null>(null)
  const reviews = useShopReviews(vendorId)
  const pages = reviews.data?.pages ?? []
  const items = pages.flatMap((page) => page.items ?? [])
  const first = pages[0]

  return (
    <Card>
      <View style={styles.head}>
        <Text variant="titleSm">Đánh giá</Text>
        {first ? <RatingSummary average={first.ratingAverage} count={first.ratingCount} /> : null}
      </View>
      {reviews.isError ? <Notice tone="error" message={problemMessage(reviews.error, 'Không tải được đánh giá lúc này.')} /> : null}
      {first && items.length === 0 ? (
        <Text variant="bodySm" muted>
          Chưa có đánh giá nào. Hãy là người đầu tiên sau khi đặt món.
        </Text>
      ) : null}
      {items.map((review, index) => (
        <View key={review.id} style={index > 0 ? [styles.divider, { borderTopColor: theme.divider }] : undefined}>
          <ReviewItem
            review={review}
            footer={
              session ? (
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setReporting({ type: 'REVIEW', id: review.id ?? '' })}>
                    <Text variant="caption" muted>
                      Báo cáo đánh giá
                    </Text>
                  </Pressable>
                  {review.reply?.id ? (
                    <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setReporting({ type: 'REVIEW_RESPONSE', id: review.reply?.id ?? '' })}>
                      <Text variant="caption" muted>
                        Báo cáo phản hồi của quán
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null
            }
          />
        </View>
      ))}
      {reviews.hasNextPage ? (
        <Button title="Xem thêm đánh giá" variant="outline" loading={reviews.isFetchingNextPage} onPress={() => void reviews.fetchNextPage()} />
      ) : null}
      <ReportSheet target={reporting} onClose={() => setReporting(null)} />
    </Card>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  divider: { borderTopWidth: 1, paddingTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.lg, paddingTop: 2 },
})
