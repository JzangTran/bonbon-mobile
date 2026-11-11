import { useRouter } from 'expo-router'
import { ArrowLeft, MapPin } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api, problemMessage } from '@/shared/api'
import { Notice, Skeleton, SkeletonGroup, Text, fonts, radius, spacing, touchTarget, typography, useTheme } from '@/shared/ui'

export type Suggestion = { placeId: string; name: string; detail: string }
const MAX_SUGGESTIONS = 5

/** Back, a pin and the box to type a place into: the top of both address pickers. */
export function PlaceSearchHeader({ value, onChange, onBack }: { value: string; onChange: (text: string) => void; onBack?: () => void }) {
  const theme = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={8} onPress={onBack ?? (() => router.back())} style={styles.back}>
        <ArrowLeft size={24} color={theme.text} />
      </Pressable>
      <View style={[styles.search, { backgroundColor: theme.surfaceMuted }]}>
        <MapPin size={18} color={theme.textMuted} />
        <TextInput
          accessibilityLabel="Nhập vị trí"
          placeholder="Nhập vị trí"
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={onChange}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, typography.body, { color: theme.text }]}
        />
      </View>
    </View>
  )
}

/** Up to five places matching what was typed, a pin before each. */
export function PlaceSuggestions({ text, onPick }: { text: string; onPick: (place: Suggestion) => void }) {
  const theme = useTheme()
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(text.trim()), 300)
    return () => clearTimeout(timer)
  }, [text])
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
  if (suggestions.isError) return <Notice tone="error" message={problemMessage(suggestions.error)} />
  if (suggestions.isLoading) {
    return (
      <SkeletonGroup>
        {['60%', '45%', '70%'].map((width) => (
          <View key={width} style={styles.row}>
            <Skeleton width={20} height={20} radius={radius.pill} />
            <View style={styles.flex}>
              <Skeleton width={width as `${number}%`} height={16} />
              <Skeleton width="85%" height={12} style={styles.lineGap} />
            </View>
          </View>
        ))}
      </SkeletonGroup>
    )
  }
  if (suggestions.data?.length === 0) return <Text muted>Không tìm thấy địa chỉ phù hợp.</Text>
  return (
    <View>
      {(suggestions.data ?? []).slice(0, MAX_SUGGESTIONS).map((s) => (
        <Pressable
          key={s.placeId}
          accessibilityRole="button"
          onPress={() => onPick({ placeId: s.placeId ?? '', name: s.mainText ?? s.description ?? '', detail: s.description ?? s.secondaryText ?? '' })}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}
        >
          <MapPin size={20} color={theme.textMuted} />
          <View style={styles.flex}>
            <Text numberOfLines={1}>{s.mainText ?? s.description}</Text>
            <Text variant="caption" muted numberOfLines={2}>
              {s.description ?? s.secondaryText}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

/** The action at the foot of a page: black when it can be used, grey when it cannot. */
export function FooterButton({ title, disabled = false, onPress }: { title: string; disabled?: boolean; onPress: () => void }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.divider, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.footerButton, { backgroundColor: disabled ? theme.surfaceMuted : theme.text }]}>
        <Text color={disabled ? theme.textMuted : theme.background} style={styles.strong}>
          {title}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strong: { fontFamily: fonts.semibold },
  lineGap: { marginTop: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  back: { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.pill, paddingHorizontal: spacing.lg, height: touchTarget.min, marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderRadius: radius.md },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  footerButton: { height: touchTarget.min, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
})
