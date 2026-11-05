import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCart } from '@/entities/cart'
import { useShopVouchers, voucherCondition, voucherEnds, voucherTitle } from '@/entities/vendor'
import { Button, Card, ErrorState, Screen, Text, useTheme, useToast } from '@/shared/ui'

/** One voucher in full: what it takes off, its conditions and dates, and the way to use it on this shop's cart. */
export default function OfferScreen() {
  const { vendorId, id } = useLocalSearchParams<{ vendorId: string; id: string }>()
  const router = useRouter()
  const theme = useTheme()
  const toast = useToast()
  const cart = useCart()
  const vouchers = useShopVouchers(vendorId)
  const voucher = vouchers.data?.find((v) => v.id === id)
  const applied = cart.voucher?.code === voucher?.code

  return (
    <Screen>
      {vouchers.isError ? <ErrorState error={vouchers.error} onRetry={() => void vouchers.refetch()} /> : null}
      {vouchers.data && !voucher ? <Text muted>Ưu đãi này đã kết thúc.</Text> : null}
      {voucher ? (
        <>
          <Text variant="headline" color={theme.primary} accessibilityRole="header">
            {voucherTitle(voucher)}
          </Text>
          <Card>
            <Text variant="titleSm">Mã ưu đãi: {voucher.code}</Text>
            <Text muted>{voucherCondition(voucher)}</Text>
            <Text muted>{voucherEnds(voucher)}</Text>
            {voucher.maxPerCustomer ? <Text muted>Mỗi khách dùng tối đa {voucher.maxPerCustomer} lần.</Text> : null}
            <Text muted>Áp dụng cho tiền món của quán này, không gồm phí giao hàng.</Text>
          </Card>
          <Button
            title={applied ? 'Đã chọn cho giỏ hàng' : 'Dùng ưu đãi này'}
            size="lg"
            fullWidth
            disabled={applied}
            onPress={() => {
              cart.setVoucher({ vendorId, code: voucher.code!, discountType: voucher.discountType!, discountValue: voucher.discountValue!, maxDiscount: voucher.maxDiscount, minOrderValue: voucher.minOrderValue })
              toast.show('Đã chọn ưu đãi cho giỏ hàng.')
              router.dismissTo({ pathname: '/customer/vendor', params: { id: vendorId } })
            }}
          />
        </>
      ) : null}
    </Screen>
  )
}
