import { useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Switch, View } from 'react-native'
import { ProviderLogo, usePaymentMethodActions, usePaymentMethods } from '@/entities/payment-method'
import { problemMessage } from '@/shared/api'
import { confirm } from '@/shared/lib/confirm'
import { Notice, Text, fonts, spacing, touchTarget, useTheme, useToast } from '@/shared/ui'
import { PageHeader } from './payment-settings'

/** One linked wallet: make it the main way to pay, or unlink it. */
export default function PaymentMethodScreen() {
  const theme = useTheme()
  const router = useRouter()
  const toast = useToast()
  const { id } = useLocalSearchParams<{ id: string }>()
  const methods = usePaymentMethods()
  const { setPrimary, unlink } = usePaymentMethodActions()
  const method = methods.data?.methods?.find((m) => m.id === id)

  const askUnlink = async () => {
    if (!method) return
    if (await confirm(`Gỡ liên kết ${method.name}?`, 'Bạn có thể liên kết lại bất cứ lúc nào.', 'Gỡ liên kết')) {
      unlink.mutate(method.id!, {
        onSuccess: () => {
          toast.show(`Đã gỡ liên kết ${method.name}.`)
          router.back()
        },
        onError: (e) => toast.show(problemMessage(e), 'error'),
      })
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <PageHeader title="Chi tiết" />
      {methods.isError ? <Notice tone="error" message={problemMessage(methods.error)} /> : null}
      {method ? (
        <View style={styles.page}>
          <View style={styles.identity}>
            <ProviderLogo provider={method.provider!} size={72} />
            <Text variant="title" style={styles.bold}>
              {method.name}
            </Text>
            <Text variant="bodySm" muted>
              {method.maskedAccount}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.flex}>Đặt làm phương thức thanh toán chính</Text>
            <Switch
              accessibilityLabel="Đặt làm phương thức thanh toán chính"
              value={method.primary}
              disabled={setPrimary.isPending}
              onValueChange={(primary) => setPrimary.mutate({ id: method.id!, primary }, { onError: (e) => toast.show(problemMessage(e), 'error') })}
              trackColor={{ true: theme.text, false: theme.border }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <Pressable accessibilityRole="button" disabled={unlink.isPending} onPress={askUnlink} style={styles.textButton}>
            <Text color={theme.danger} style={styles.semi}>
              Gỡ liên kết
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontFamily: fonts.bold },
  semi: { fontFamily: fonts.semibold },
  page: { padding: spacing.lg, gap: spacing.md },
  identity: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min },
  divider: { height: 1 },
  textButton: { minHeight: touchTarget.min, justifyContent: 'center', alignSelf: 'flex-start' },
})
