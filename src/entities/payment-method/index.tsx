import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { api, type components } from '@/shared/api'
import { Text, fonts, radius, useTheme } from '@/shared/ui'

export type LinkedMethod = components['schemas']['LinkedPaymentMethod']

/**
 * Money that changed hands: a MoMo payment that went through, or cash once the order was delivered (a cancelled or undelivered
 * cash order was never paid).
 */
export function isPaid(order: { paymentMethod?: string; paymentStatus?: string; status?: string }) {
  return order.paymentMethod === 'ONLINE' ? order.paymentStatus === 'PAID' : order.status === 'DELIVERED'
}

const METHODS_KEY = ['account', 'payment-methods']
const PIN_KEY = ['account', 'payment-pin']

/** The wallets this customer has linked, the main one first, and the ones still to link. */
export function usePaymentMethods() {
  return useQuery({
    queryKey: METHODS_KEY,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/payment-methods')
      if (error || !data) throw error
      return data
    },
  })
}

export function usePaymentMethodActions() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: METHODS_KEY })
  const link = useMutation({
    mutationFn: async (body: { provider: string; account: string }) => {
      const { data, error } = await api.POST('/api/account/payment-methods', { body })
      if (error || !data) throw error
      return data
    },
    onSuccess: refresh,
  })
  const setPrimary = useMutation({
    mutationFn: async ({ id, primary }: { id: string; primary: boolean }) => {
      const { error } = await api.PATCH('/api/account/payment-methods/{id}', { params: { path: { id } }, body: { primary } })
      if (error) throw error
    },
    onSuccess: refresh,
  })
  const unlink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/account/payment-methods/{id}', { params: { path: { id } } })
      if (error) throw error
    },
    onSuccess: refresh,
  })
  return { link, setPrimary, unlink }
}

/** Whether a payment PIN is set; never the PIN itself. */
export function usePaymentPin() {
  return useQuery({
    queryKey: PIN_KEY,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/payment-pin')
      if (error || !data) throw error
      return data
    },
  })
}

export function useChangePaymentPin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { currentPin?: string; newPin: string }) => {
      const { error } = await api.PUT('/api/account/payment-pin', { body })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PIN_KEY }),
  })
}

/** The provider's colours behind its name, as close to its own mark as bonbon may draw without the trademark itself. */
const BRANDS: Record<string, { background: string; text: string; label: string }> = {
  MOMO: { background: '#A50064', text: '#FFFFFF', label: 'MoMo' },
}

/** A round logo; a small black tick at its foot marks the main method. */
export function ProviderLogo({ provider, size = 44, primary = false }: { provider: string; size?: number; primary?: boolean }) {
  const theme = useTheme()
  const brand = BRANDS[provider] ?? { background: theme.surfaceMuted, text: theme.text, label: provider }
  const badge = Math.round(size * 0.4)
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.logo, { width: size, height: size, backgroundColor: brand.background }]}>
        <Text color={brand.text} style={[styles.label, { fontSize: size * 0.26, lineHeight: size * 0.32 }]}>
          {brand.label}
        </Text>
      </View>
      {primary ? (
        <View accessibilityLabel="Phương thức chính" style={[styles.badge, { width: badge, height: badge, backgroundColor: theme.text, borderColor: theme.background }]}>
          <Check size={badge * 0.62} color={theme.background} strokeWidth={3} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  logo: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bold },
  badge: { position: 'absolute', right: -2, bottom: -2, borderRadius: radius.pill, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
})
