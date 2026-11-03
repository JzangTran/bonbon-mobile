import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { MapPin } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useGuestLocation } from '@/entities/address'
import { api, problemMessage } from '@/shared/api'
import { Card, Input, Notice, Screen, Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

/**
 * Where a guest wants the food to go, before any account: type an address, pick a suggestion, and the home page lists the
 * shops that deliver there. Kept on this phone; saving it as a delivery address comes with signing up.
 */
export default function PickLocationScreen() {
  const theme = useTheme()
  const router = useRouter()
  const guest = useGuestLocation()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const suggestions = useQuery({
    queryKey: ['geo', 'autocomplete', debounced],
    enabled: debounced.length >= 3,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/geo/autocomplete', { params: { query: { input: debounced } } })
      if (error || !data) throw error
      return data
    },
  })

  const pick = useMutation({
    mutationFn: async ({ placeId, label }: { placeId: string; label: string }) => {
      const { data, error } = await api.GET('/api/geo/place', { params: { query: { placeId } } })
      if (error || !data || data.lat === undefined || data.lng === undefined) throw error
      await guest.save({ label, formattedAddress: data.formattedAddress ?? label, lat: data.lat, lng: data.lng })
    },
    onSuccess: () => router.back(),
  })

  return (
    <Screen>
      <Card>
        {guest.location ? (
          <View style={[styles.picked, { backgroundColor: theme.surfaceMuted }]}>
            <MapPin size={18} color={theme.primary} />
            <Text variant="bodySm" style={styles.flex}>
              {guest.location.formattedAddress}
            </Text>
          </View>
        ) : null}
        <Input
          label={guest.location ? 'Tìm địa chỉ khác' : 'Bạn muốn nhận món ở đâu?'}
          placeholder="Tên toà nhà, đường, khu công nghiệp…"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoFocus
        />
        {debounced.length >= 3 ? (
          <View style={[styles.list, { borderColor: theme.divider }]}>
            {suggestions.isPending ? (
              <Text variant="bodySm" muted style={styles.row}>
                Đang tìm…
              </Text>
            ) : null}
            {suggestions.isError ? <Notice tone="error" message={problemMessage(suggestions.error)} /> : null}
            {suggestions.data?.length === 0 ? (
              <Text variant="bodySm" muted style={styles.row}>
                Không tìm thấy địa chỉ phù hợp.
              </Text>
            ) : null}
            {suggestions.data?.map((s) => (
              <Pressable
                key={s.placeId}
                accessibilityRole="button"
                disabled={pick.isPending}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}
                onPress={() => pick.mutate({ placeId: s.placeId!, label: s.mainText ?? s.description ?? '' })}
              >
                <Text variant="bodySm">{s.mainText}</Text>
                <Text variant="caption" muted>
                  {s.secondaryText}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text variant="caption" muted>
            Gõ ít nhất 3 ký tự rồi chọn một gợi ý. Địa chỉ chỉ lưu trên điện thoại này để tìm quán giao tới.
          </Text>
        )}
        {pick.isPending ? <Text variant="bodySm" muted>Đang xác định vị trí…</Text> : null}
        {pick.isError ? <Notice tone="error" message={problemMessage(pick.error)} /> : null}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  picked: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.lg },
  list: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  row: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: touchTarget.min, justifyContent: 'center' },
  flex: { flex: 1 },
})
