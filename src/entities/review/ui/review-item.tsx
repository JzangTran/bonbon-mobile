import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { formatAgo } from '@/shared/lib/format'
import { Text, radius, spacing, useTheme } from '@/shared/ui'
import type { Review } from '../api'
import { Stars } from './stars'

/**
 * One review with the shop's reply under it. Hidden ones (shown only to their author or the shop) carry a label
 * with the reason; {@code footer} is where a screen puts its own actions.
 */
export function ReviewItem({ review, footer }: { review: Review; footer?: ReactNode }) {
  const theme = useTheme()
  const reply = review.reply
  return (
    <View style={styles.item}>
      <View style={styles.head}>
        <Stars value={review.rating ?? 0} />
        <Text variant="caption" muted>
          {review.reviewerName} · {formatAgo(review.createdAt)}
        </Text>
      </View>
      {review.hidden ? (
        <View style={[styles.tag, { backgroundColor: theme.warningSubtle }]}>
          <Text variant="caption" color={theme.onWarningSubtle}>
            Đánh giá bị ẩn vì vi phạm quy định{review.hiddenReason ? `: ${review.hiddenReason}` : ''}
          </Text>
        </View>
      ) : null}
      {review.comment ? <Text variant="bodySm">{review.comment}</Text> : null}
      {reply ? (
        <View style={[styles.reply, { backgroundColor: theme.surfaceMuted }]}>
          <Text variant="caption" muted>
            Quán phản hồi · {formatAgo(reply.createdAt)}
          </Text>
          <Text variant="bodySm">{reply.text}</Text>
          {reply.hidden ? (
            <Text variant="caption" color={theme.onWarningSubtle}>
              Phản hồi bị ẩn vì vi phạm quy định{reply.hiddenReason ? `: ${reply.hiddenReason}` : ''}
            </Text>
          ) : null}
        </View>
      ) : null}
      {footer}
    </View>
  )
}

const styles = StyleSheet.create({
  item: { gap: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  tag: { borderRadius: radius.sm, padding: spacing.sm },
  reply: { borderRadius: radius.sm, padding: spacing.sm, gap: 2 },
})
