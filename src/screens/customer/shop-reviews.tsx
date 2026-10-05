import { StyleSheet, View } from 'react-native'
import { RatingSummary, ReviewItem, useShopReviews } from '@/entities/review'
import { problemMessage } from '@/shared/api'
import { Button, Card, Notice, Text, spacing, useTheme } from '@/shared/ui'

/** What other customers said about the shop (reviews are public), with the shop's replies; ten at a time. */
export function ShopReviewsCard({ vendorId }: { vendorId: string }) {
  const theme = useTheme()
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
          <ReviewItem review={review} />
        </View>
      ))}
      {reviews.hasNextPage ? (
        <Button title="Xem thêm đánh giá" variant="outline" loading={reviews.isFetchingNextPage} onPress={() => void reviews.fetchNextPage()} />
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  divider: { borderTopWidth: 1, paddingTop: spacing.sm },
})
