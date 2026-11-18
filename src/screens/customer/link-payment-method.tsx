import { useRouter } from 'expo-router'
import { compactPhone, isVnPhone } from '@/shared/lib/validate'
import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ProviderLogo, usePaymentMethodActions } from '@/entities/payment-method'
import { problemFieldErrors, problemMessage } from '@/shared/api'
import { Input, Notice, Text, fonts, spacing, useTheme, useFeedback , PageHeader } from '@/shared/ui'
import { FooterButton } from './place-parts'


/**
 * Linking a MoMo wallet by its phone number. bonbon keeps the last four digits only; paying still opens MoMo at checkout, so no
 * money can move from here.
 */
export default function LinkPaymentMethodScreen() {
  const theme = useTheme()
  const router = useRouter()
  const feedback = useFeedback()
  const { link } = usePaymentMethodActions()
  const [phone, setPhone] = useState('')
  const errors = link.isError ? problemFieldErrors(link.error) : {}
  const phoneProblem = compactPhone(phone).length >= 10 && !isVnPhone(phone, 'mobile') ? 'Số di động Việt Nam không hợp lệ, ví dụ 0912345678.' : undefined
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <PageHeader title="Thêm phương thức thanh toán" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <View style={styles.provider}>
          <ProviderLogo provider="MOMO" />
          <Text style={styles.strong}>Ví MoMo</Text>
        </View>
        {link.isError && Object.keys(errors).length === 0 ? <Notice tone="error" message={problemMessage(link.error)} /> : null}
        <Input label="Số điện thoại đăng ký MoMo" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="0912345678"
          value={phone} onChangeText={setPhone} error={phoneProblem ?? errors.account} maxLength={15} />
        <Text variant="caption" muted>
          bonbon chỉ lưu 4 số cuối. Khi đặt đơn, bạn vẫn xác nhận thanh toán trong ứng dụng MoMo.
        </Text>
      </ScrollView>
      <FooterButton
        title="Liên kết"
        disabled={!isVnPhone(phone, 'mobile') || link.isPending}
        onPress={() =>
          link.mutate(
            { provider: 'MOMO', account: compactPhone(phone) },
            {
              onSuccess: () => {
                feedback.success('Đã liên kết ví MoMo. Lần đặt món tới bạn chọn được MoMo để thanh toán nhanh.')
                router.back()
              },
            },
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strong: { fontFamily: fonts.semibold },
  page: { padding: spacing.lg, gap: spacing.md },
  provider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
})
