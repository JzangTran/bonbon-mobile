import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { ADDRESSES_QUERY_KEY, MAX_ADDRESSES, useAddresses, type DeliveryAddress } from '@/entities/address'
import { api, problemMessage } from '@/shared/api'
import { confirm } from '@/shared/lib/confirm'
import { Button, Card, Notice, Screen, Text, radius, spacing, useTheme, useToast } from '@/shared/ui'

/** Saved delivery addresses (manage-delivery-addresses.md): default first, up to 10. */
export default function AddressesScreen() {
  const router = useRouter()
  const addresses = useAddresses()
  const count = addresses.data?.length ?? 0

  return (
    <Screen>
      {addresses.isError ? <Notice tone="error" message={problemMessage(addresses.error)} /> : null}
      {addresses.data?.length === 0 ? (
        <Card>
          <Text variant="titleSm">Chưa có địa chỉ nào</Text>
          <Text muted>Thêm địa chỉ nơi bạn nhận món, ví dụ căn hộ hoặc cổng công ty.</Text>
        </Card>
      ) : null}
      {addresses.data?.map((a) => <AddressCard key={a.id} address={a} />)}
      <Text variant="caption" muted style={styles.center}>
        Đã lưu {count}/{MAX_ADDRESSES} địa chỉ. Xoá địa chỉ không ảnh hưởng đơn cũ.
      </Text>
      <Button
        title="+ Thêm địa chỉ"
        size="lg"
        fullWidth
        disabled={count >= MAX_ADDRESSES}
        onPress={() => router.push('/customer/address-form')}
      />
    </Screen>
  )
}

function AddressCard({ address }: { address: DeliveryAddress }) {
  const theme = useTheme()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const id = address.id!
  const refresh = () => queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY })
  const makeDefault = useMutation({
    mutationFn: async () => {
      const { error } = await api.PATCH('/api/account/addresses/{id}/default', { params: { path: { id } } })
      if (error) throw error
    },
    onSuccess: refresh,
    onError: (e) => toast.show(problemMessage(e), 'error'),
  })
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await api.DELETE('/api/account/addresses/{id}', { params: { path: { id } } })
      if (error) throw error
    },
    onSuccess: () => {
      toast.show('Đã xoá địa chỉ.')
      return refresh()
    },
    onError: (e) => toast.show(problemMessage(e), 'error'),
  })

  return (
    <Card style={address.isDefault ? { borderWidth: 2, borderColor: theme.primary } : undefined}>
      <View style={styles.header}>
        <Text variant="titleSm">{address.label}</Text>
        {address.isDefault ? (
          <View style={[styles.badge, { backgroundColor: theme.primarySubtle }]}>
            <Text variant="caption" color={theme.onPrimarySubtle}>
              Mặc định
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="bodySm">
        {address.detail ? `${address.detail} · ` : ''}
        {address.formattedAddress}
      </Text>
      <Text variant="caption" muted>
        {address.recipientName} · {address.recipientPhone}
      </Text>
      <View style={styles.actions}>
        {!address.isDefault ? (
          <Button title="Đặt mặc định" variant="ghost" loading={makeDefault.isPending} onPress={() => makeDefault.mutate()} />
        ) : null}
        <Button title="Sửa" variant="ghost" onPress={() => router.push({ pathname: '/customer/address-form', params: { id } })} />
        <Button
          title="Xoá"
          variant="ghost"
          loading={remove.isPending}
          onPress={async () => {
            if (await confirm('Xoá địa chỉ?', `${address.label}: ${address.formattedAddress}`, 'Xoá')) remove.mutate()
          }}
        />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.xs },
  center: { textAlign: 'center' },
})
