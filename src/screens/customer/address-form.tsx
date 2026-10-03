import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { MapPin } from 'lucide-react-native'
import { useEffect, useLayoutEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ADDRESSES_QUERY_KEY, useAddresses, type DeliveryAddress } from '@/entities/address'
import { api, problemFieldErrors, problemMessage } from '@/shared/api'
import { Button, Card, Checkbox, Input, Notice, Screen, Text, radius, spacing, touchTarget, useTheme, useToast } from '@/shared/ui'

const LABELS = ['Nhà', 'Công ty', 'Khác'] as const

/**
 * Add or edit a delivery address. The place must be picked from Goong suggestions (≥ 3 characters, 300 ms pause);
 * editing only the detail line or the recipient makes no Goong call.
 */
export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const navigation = useNavigation()
  const addresses = useAddresses()
  const existing = id ? addresses.data?.find((a) => a.id === id) : undefined

  useLayoutEffect(() => {
    navigation.setOptions({ title: id ? 'Sửa địa chỉ' : 'Thêm địa chỉ' })
  }, [navigation, id])

  if (id && addresses.isPending) return <Screen>{null}</Screen>
  return <AddressForm key={existing?.id ?? 'new'} existing={existing} />
}

function AddressForm({ existing }: { existing?: DeliveryAddress }) {
  const theme = useTheme()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [label, setLabel] = useState(existing?.label ?? 'Nhà')
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [place, setPlace] = useState<{ placeId: string; description: string } | null>(null)
  const [detail, setDetail] = useState(existing?.detail ?? '')
  const [name, setName] = useState(existing?.recipientName ?? '')
  const [phone, setPhone] = useState(existing?.recipientPhone ?? '')
  const [makeDefault, setMakeDefault] = useState(false)

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

  const save = useMutation({
    mutationFn: async () => {
      if (existing?.id) {
        const { error } = await api.PATCH('/api/account/addresses/{id}', {
          params: { path: { id: existing.id } },
          body: { label, placeId: place?.placeId, detail, recipientName: name.trim(), recipientPhone: phone.trim() },
        })
        if (error) throw error
      } else {
        const { error } = await api.POST('/api/account/addresses', {
          body: {
            label,
            placeId: place?.placeId ?? '',
            detail: detail.trim() || undefined,
            recipientName: name.trim(),
            recipientPhone: phone.trim(),
            makeDefault,
          },
        })
        if (error) throw error
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY })
      toast.show(existing ? 'Đã lưu địa chỉ.' : 'Đã thêm địa chỉ.')
      router.back()
    },
  })
  const fieldErrors = save.isError ? problemFieldErrors(save.error) : {}
  const currentAddress = place?.description ?? existing?.formattedAddress
  const canSave = !!currentAddress && name.trim() !== '' && phone.trim() !== ''

  return (
    <Screen>
      <Card>
        <Text variant="bodySm">Nhãn</Text>
        <View style={styles.chips}>
          {LABELS.map((l) => (
            <Pressable
              key={l}
              accessibilityRole="radio"
              accessibilityState={{ selected: label === l }}
              onPress={() => setLabel(l)}
              style={[
                styles.chip,
                { borderColor: label === l ? theme.primary : theme.borderInput, backgroundColor: label === l ? theme.primarySubtle : theme.surface },
              ]}
            >
              <Text variant="bodySm" color={label === l ? theme.onPrimarySubtle : theme.text}>
                {l}
              </Text>
            </Pressable>
          ))}
        </View>
        {currentAddress ? (
          <View style={[styles.picked, { backgroundColor: theme.surfaceMuted }]}>
            <MapPin size={18} color={theme.primary} />
            <Text variant="bodySm" style={styles.flex}>
              {currentAddress}
            </Text>
          </View>
        ) : null}
        <Input
          label={currentAddress ? 'Tìm địa chỉ khác' : 'Tìm địa chỉ'}
          placeholder="Tên toà nhà, đường, khu công nghiệp…"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          error={fieldErrors.placeId}
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
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}
                onPress={() => {
                  setPlace({ placeId: s.placeId!, description: s.description ?? s.mainText ?? '' })
                  setQuery('')
                }}
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
            Gõ ít nhất 3 ký tự rồi chọn một gợi ý; địa chỉ phải được chọn từ gợi ý mới lưu được.
          </Text>
        )}
        <Input label="Chi tiết (toà, tầng, căn hộ)" placeholder="Ví dụ: Toà S2, tầng 12, căn 05" value={detail} onChangeText={setDetail} maxLength={200} />
        <Input label="Người nhận" value={name} onChangeText={setName} maxLength={100} error={fieldErrors.recipientName} />
        <Input
          label="Số điện thoại người nhận"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          error={fieldErrors.recipientPhone}
        />
        {!existing ? (
          <Checkbox checked={makeDefault} onChange={setMakeDefault}>
            Đặt làm địa chỉ mặc định
          </Checkbox>
        ) : null}
        {save.isError && Object.keys(fieldErrors).length === 0 ? <Notice tone="error" message={problemMessage(save.error)} /> : null}
        <Button title="Lưu địa chỉ" size="lg" fullWidth disabled={!canSave} loading={save.isPending} onPress={() => save.mutate()} />
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: { minHeight: touchTarget.min, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  picked: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.sm },
  list: { borderWidth: 1, borderRadius: radius.sm, overflow: 'hidden' },
  row: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: touchTarget.min, justifyContent: 'center' },
  flex: { flex: 1 },
})
