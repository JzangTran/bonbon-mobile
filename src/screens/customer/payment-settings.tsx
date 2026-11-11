import { useRouter } from 'expo-router'
import { ArrowLeft, ChevronRight, LockKeyhole, Plus } from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ProviderLogo, usePaymentMethods } from '@/entities/payment-method'
import { problemMessage } from '@/shared/api'
import { Notice, Skeleton, SkeletonGroup, Text, fonts, spacing, touchTarget, useTheme } from '@/shared/ui'

/** Cài đặt thanh toán: the linked wallets (the main one marked), linking another, and the payment PIN. */
export default function PaymentSettingsScreen() {
  const theme = useTheme()
  const router = useRouter()
  const methods = usePaymentMethods()
  const linked = methods.data?.methods ?? []
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <PageHeader title="Cài đặt thanh toán" />
      <ScrollView contentContainerStyle={styles.page}>
        <Text variant="titleSm" style={styles.label}>
          Thanh toán
        </Text>
        {methods.isError ? <Notice tone="error" message={problemMessage(methods.error)} /> : null}
        {methods.isLoading ? (
          <SkeletonGroup>
            <View style={styles.row}>
              <Skeleton width={44} height={44} radius={999} />
              <View style={styles.flex}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="30%" height={12} style={styles.gap} />
              </View>
            </View>
          </SkeletonGroup>
        ) : null}
        {linked.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={`${m.name}, ${m.maskedAccount}${m.primary ? ', phương thức chính' : ''}`}
            onPress={() => router.push({ pathname: '/customer/payment-method', params: { id: m.id! } })}
            style={styles.row}
          >
            <ProviderLogo provider={m.provider!} primary={m.primary} />
            <View style={styles.flex}>
              <Text style={styles.strong}>{m.name}</Text>
              <Text variant="bodySm" muted>
                {m.maskedAccount}
              </Text>
            </View>
            <ChevronRight size={22} color={theme.textMuted} />
          </Pressable>
        ))}
        {(methods.data?.linkable ?? []).length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/customer/link-payment-method')} style={styles.row}>
            <View style={styles.iconCell}>
              <Plus size={24} color={theme.text} />
            </View>
            <Text style={[styles.flex, styles.strong]}>Thêm phương thức thanh toán</Text>
          </Pressable>
        ) : null}

        <Text variant="titleSm" style={[styles.label, styles.section]}>
          Bảo mật
        </Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/customer/payment-pin')} style={styles.row}>
          <View style={styles.iconCell}>
            <LockKeyhole size={24} color={theme.text} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.strong}>Mã PIN</Text>
            <Text variant="bodySm" muted>
              Tạo hoặc đặt lại mã PIN của bạn
            </Text>
          </View>
          <ChevronRight size={22} color={theme.textMuted} />
        </Pressable>
      </ScrollView>
    </View>
  )
}

/** Back and a title, for the full pages that slide up from the payments tab. */
export function PageHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const theme = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={8} onPress={onBack ?? (() => router.back())} style={styles.back}>
        <ArrowLeft size={24} color={theme.text} />
      </Pressable>
      <Text variant="titleSm" style={styles.strong} accessibilityRole="header">
        {title}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strong: { fontFamily: fonts.semibold },
  label: { fontFamily: fonts.bold },
  gap: { marginTop: spacing.xs },
  section: { marginTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  back: { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  page: { padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min + 8 },
  iconCell: { width: 44, alignItems: 'center' },
})
