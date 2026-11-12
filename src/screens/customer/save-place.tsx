import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ADDRESSES_QUERY_KEY, addressWithSingleLabel, resolvePlace, useAddresses, useLocatedPlace, type RecentPlace } from '@/entities/address'
import { api, problemFieldErrors, problemMessage } from '@/shared/api'
import { Input, Notice, OsmMap, Text, radius, spacing, touchTarget, useTheme, useToast } from '@/shared/ui'
import { FooterButton, PlaceSearchHeader, PlaceSuggestions, type Suggestion } from './place-parts'

const MAP_HEIGHT = 170

/** Saving a place: first find it, then name it and add the details. Pressing the address goes back to finding it. */
export default function SavePlaceScreen() {
  const theme = useTheme()
  const params = useLocalSearchParams<{ label?: string; place?: string }>()
  const [place, setPlace] = useState<RecentPlace | null>(() => (params.place ? (JSON.parse(params.place) as RecentPlace) : null))
  const [searching, setSearching] = useState(!params.place)
  const [text, setText] = useState('')
  const toast = useToast()
  const resolve = useMutation({
    mutationFn: (found: Suggestion) => resolvePlace(found),
    onSuccess: (found) => {
      setPlace(found)
      setText('')
      setSearching(false)
    },
    onError: (e) => toast.show(problemMessage(e), 'error'),
  })
  if (searching) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <PlaceSearchHeader value={text} onChange={setText} onBack={place ? () => setSearching(false) : undefined} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.searchPage}>
          {text.trim() ? <PlaceSuggestions text={text} onPick={(found) => resolve.mutate(found)} /> : null}
        </ScrollView>
      </View>
    )
  }
  return <PlaceForm place={place!} presetName={params.label ?? ''} onChangeAddress={() => setSearching(true)} />
}

function PlaceForm({ place, presetName, onChangeAddress }: { place: RecentPlace; presetName: string; onChangeAddress: () => void }) {
  const theme = useTheme()
  const router = useRouter()
  const toast = useToast()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const here = useLocatedPlace()
  const [name, setName] = useState(presetName)
  const [detail, setDetail] = useState('')
  const [note, setNote] = useState('')
  const [typedPhone, setTypedPhone] = useState('')
  const me = useQuery({
    queryKey: ['account', 'me'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/me')
      if (error || !data) throw error
      return data
    },
  })
  const saved = useAddresses()
  // Nhà and Công ty are one address each: say so here, before the server has to
  const takenBy = addressWithSingleLabel(saved.data ?? [], name)
  const needsPhone = me.isSuccess && !me.data.phone
  const phone = me.data?.phone ?? typedPhone.trim()
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST('/api/account/addresses', {
        body: {
          label: name.trim(),
          placeId: place.placeId ?? '',
          detail: detail.trim() || undefined,
          note: note.trim() || undefined,
          // the place is the customer's own: they receive the food
          recipientName: me.data?.name ?? name.trim(),
          recipientPhone: phone,
          makeDefault: false,
        },
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY })
      toast.show('Đã lưu địa chỉ.')
      router.back()
    },
  })
  const errors = save.isError ? problemFieldErrors(save.error) : {}
  const ready = name.trim() !== '' && !takenBy && !!place.placeId && phone !== '' && me.isSuccess && !save.isPending
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={8} onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <Text variant="titleSm" numberOfLines={1} style={styles.flex}>
          Thêm vào Địa điểm đã lưu
        </Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <OsmMap lat={place.lat} lng={place.lng} height={MAP_HEIGHT} pinColor={theme.primary} me={here?.position} />
        {save.isError && Object.keys(errors).length === 0 ? <Notice tone="error" message={problemMessage(save.error)} /> : null}
        <Input
          label="Tên"
          value={name}
          onChangeText={setName}
          maxLength={30}
          error={errors.label ?? (takenBy ? `Bạn đã có địa chỉ "${takenBy.label}". Hãy gỡ địa chỉ đó ở mục Đã lưu trước, hoặc đặt tên khác.` : undefined)}
        />
        <View style={styles.field}>
          <Text variant="bodySm">Địa chỉ</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Địa chỉ: ${place.detail}. Đổi địa chỉ`} onPress={onChangeAddress} style={[styles.addressBox, { backgroundColor: theme.surface, borderColor: theme.borderInput }]}>
            <Text numberOfLines={1}>{place.detail}</Text>
          </Pressable>
          {!place.placeId ? (
            <Text variant="caption" color={theme.danger}>
              Vị trí này chưa có địa chỉ cụ thể, hãy chọn lại.
            </Text>
          ) : null}
        </View>
        <View style={styles.field}>
          <Input label="Chi tiết địa chỉ" placeholder="Ví dụ: tầng, số căn hộ" value={detail} onChangeText={setDetail} maxLength={200} error={errors.detail} />
          <Text variant="caption" muted>
            Nhập chi tiết địa chỉ giao hàng
          </Text>
        </View>
        <View style={styles.field}>
          <Input label="Ghi chú" placeholder="Ví dụ: Gặp tôi ở dưới sảnh" value={note} onChangeText={setNote} maxLength={300} error={errors.note} />
          <Text variant="caption" muted>
            Ghi chú thêm lưu ý giao hàng hoặc chỉ dẫn đường đi tại đây
          </Text>
        </View>
        {needsPhone ? <Input label="Số điện thoại nhận hàng" keyboardType="phone-pad" value={typedPhone} onChangeText={setTypedPhone} error={errors.recipientPhone} /> : null}
      </ScrollView>
      <FooterButton title="Lưu địa chỉ này" disabled={!ready} onPress={() => save.mutate()} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchPage: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  back: { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  page: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  field: { gap: spacing.xs },
  addressBox: { minHeight: touchTarget.min, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.lg, justifyContent: 'center' },
})
