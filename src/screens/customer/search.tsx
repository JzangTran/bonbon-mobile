import { useRouter } from 'expo-router'
import { Search, Star, Store } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useDeliveryPoint } from '@/entities/address'
import { useSession } from '@/entities/session'
import { formatDistance, useShopsInArea } from '@/entities/vendor'
import { problemMessage } from '@/shared/api'
import { Button, Card, Notice, Screen, Text, radius, spacing, touchTarget, typography, useTheme } from '@/shared/ui'

/** "Bạn đang thèm gì nào": shops near the delivery point whose name or a dish matches, ignoring accents. */
export default function SearchScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { session } = useSession()
  const point = useDeliveryPoint(!!session)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])
  const results = useShopsInArea(debounced ? point.position : null, debounced, null)
  const list = results.data?.items ?? []

  return (
    <Screen>
      <View style={[styles.search, { backgroundColor: theme.surfaceMuted }]}>
        <Search size={18} color={theme.textMuted} />
        <TextInput
          autoFocus
          accessibilityLabel="Tìm món hoặc quán"
          placeholder="Bạn đang thèm gì nào"
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, typography.body, { color: theme.text }]}
        />
      </View>
      {!point.position && !point.loading ? (
        <Card>
          <Text variant="titleSm">Bạn muốn nhận món ở đâu?</Text>
          <Text muted>Nhập địa chỉ để tìm trong các quán giao tới bạn.</Text>
          <Button title="Nhập địa chỉ" fullWidth onPress={() => router.push(session ? '/customer/addresses' : '/customer/pick-location')} />
        </Card>
      ) : null}
      {results.isError ? <Notice tone="error" message={problemMessage(results.error)} /> : null}
      {debounced && results.data && list.length === 0 ? <Text muted>Không có quán hoặc món nào khớp “{debounced}”.</Text> : null}
      {list.map((shop) => (
        <Pressable
          key={shop.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/customer/vendor', params: { id: shop.id } })}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}
        >
          <View style={[styles.logo, { backgroundColor: theme.surfaceMuted }]}>
            <Store size={20} color={theme.textMuted} strokeWidth={1.5} />
          </View>
          <View style={styles.flex}>
            <Text variant="titleSm" numberOfLines={1}>
              {shop.name}
            </Text>
            <View style={styles.meta}>
              {shop.ratingAverage != null ? (
                <>
                  <Star size={13} color="#F5A524" fill="#F5A524" />
                  <Text variant="caption">{shop.ratingAverage.toFixed(1)}</Text>
                </>
              ) : null}
              <Text variant="caption" muted>
                {[formatDistance(shop.distanceKm), shop.open ? 'Đang mở' : 'Đang đóng'].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.pill, paddingHorizontal: spacing.lg, height: touchTarget.min },
  input: { flex: 1, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  logo: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
})
