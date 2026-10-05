import { Star } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text, palette, spacing, useTheme } from '@/shared/ui'

/** Five stars, filled up to {@code value}. */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const theme = useTheme()
  return (
    <View style={styles.row} accessibilityLabel={`${value} trên 5 sao`} accessible>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} color={n <= value ? palette.amber400 : theme.borderInput} fill={n <= value ? palette.amber400 : 'transparent'} />
      ))}
    </View>
  )
}

/** Tap a star to choose 1–5; each star is a big enough target on its own. */
export function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const theme = useTheme()
  return (
    <View style={styles.picker}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          accessibilityRole="button"
          accessibilityLabel={`${n} sao`}
          accessibilityState={{ selected: n === value }}
          onPress={() => onChange(n)}
          hitSlop={4}
          style={styles.pick}
        >
          <Star size={36} color={n <= value ? palette.amber400 : theme.borderInput} fill={n <= value ? palette.amber400 : 'transparent'} />
        </Pressable>
      ))}
    </View>
  )
}

/** "4,5 ★ (12)" for a shop card; nothing to say yet when there is no review. */
export function RatingSummary({ average, count }: { average?: number | null; count?: number | null }) {
  const theme = useTheme()
  if (!count || average == null) {
    return (
      <Text variant="caption" muted>
        Chưa có đánh giá
      </Text>
    )
  }
  return (
    <View style={styles.row} accessibilityLabel={`${average} trên 5 sao, ${count} đánh giá`} accessible>
      <Star size={14} color={palette.amber400} fill={palette.amber400} />
      <Text variant="bodySm" style={{ color: theme.text }}>
        {average.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </Text>
      <Text variant="caption" muted>
        ({count})
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  picker: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  pick: { padding: 2 },
})
