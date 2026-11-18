import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { useRouter, type Href } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ChevronRight, Heart, Plus, TicketPercent, Wallet } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAddresses } from '@/entities/address'
import { ProviderLogo, usePaymentMethods } from '@/entities/payment-method'
import { useSession } from '@/entities/session'
import { unregisterPush } from '@/features/push'
import { api } from '@/shared/api'
import { Text, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

const BAND = 120

/**
 * "Tài khoản": a hub, like the account page of the big delivery apps. A green band with the profile card over its edge (the
 * "Hồ sơ" pill opens the profile, password, sessions and privacy), the main payment method and a card to add one, then plain
 * rows grouped by what they are for. Every page it links to already exists; this screen only gathers them.
 */
export default function CustomerAccountScreen() {
  const theme = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session, signOut } = useSession()
  const addresses = useAddresses()
  const methods = usePaymentMethods()
  const profile = useQuery({
    queryKey: ['account', 'me'],
    enabled: !!session && !session.team,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/me')
      if (error || !data) throw error
      return data
    },
  })
  const name = session?.team?.login ?? profile.data?.name ?? ''
  const main = (methods.data?.methods ?? []).find((m) => m.primary) ?? methods.data?.methods?.[0]
  const defaultAddress = addresses.data?.find((a) => a.isDefault)
  const go = (href: Href) => () => router.push(href)

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll}>
      <StatusBar style="light" />
      <View style={[styles.band, { height: insets.top + BAND, backgroundColor: theme.payBand }]} />

      <View style={styles.body}>
        <View style={[styles.profile, styles.shadow, { backgroundColor: theme.surface, marginTop: -BAND / 2 }]}>
          <View style={styles.profileTop}>
            <Avatar name={name} url={profile.data?.avatarUrl} />
            <Text variant="titleSm" style={[styles.flex, styles.bold]} numberOfLines={1}>
              {name || 'Tài khoản của bạn'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mở hồ sơ"
              onPress={go('/customer/profile')}
              style={[styles.pill, { backgroundColor: theme.primarySubtle }]}
            >
              <Text variant="bodySm" color={theme.onPrimarySubtle} style={styles.semi}>
                Hồ sơ
              </Text>
            </Pressable>
          </View>
          <View style={styles.chips}>
            <Chip icon={<Heart size={16} color={theme.primary} />} label="Quán yêu thích" onPress={go('/customer/favorites')} />
            <Chip icon={<TicketPercent size={16} color={theme.primary} />} label="Ưu đãi của tôi" onPress={go('/customer/offers')} />
          </View>
        </View>

        <View style={styles.methods}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={main ? `Phương thức thanh toán chính: ${main.name}` : 'Cài đặt thanh toán'}
            onPress={go('/customer/payment-settings')}
            style={[styles.method, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <View style={styles.methodTop}>
              {main ? <ProviderLogo provider={main.provider ?? ''} size={40} /> : <RoundIcon><Wallet size={20} color={theme.primary} /></RoundIcon>}
              <View style={[styles.tag, { backgroundColor: theme.surfaceMuted }]}>
                <Text variant="caption" muted>
                  Mặc định
                </Text>
              </View>
            </View>
            <Text style={styles.semi} numberOfLines={1}>
              {main?.name ?? 'Tiền mặt'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={go('/customer/link-payment-method')}
            style={[styles.method, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <RoundIcon>
              <Plus size={20} color={theme.primary} />
            </RoundIcon>
            <Text numberOfLines={2}>Thêm phương thức thanh toán</Text>
          </Pressable>
        </View>
      </View>

      <Section title="Ưu đãi và tiết kiệm">
        <Row label="Ưu đãi" onPress={go('/customer/offers')} />
        <Row label="Deal HOT" onPress={go('/customer/deals')} />
      </Section>

      <Section title="Tổng quát">
        <Row label="Quán yêu thích" onPress={go('/customer/favorites')} />
        <Row label="Địa chỉ giao hàng" value={defaultAddress?.label} onPress={go('/customer/addresses')} />
        <Row label="Lịch sử thanh toán" onPress={go('/customer/payment-history')} />
        <Row label="Cài đặt thanh toán" onPress={go('/customer/payment-settings')} />
      </Section>

      <Section title="Cài đặt">
        <Row label="Hồ sơ và bảo mật" onPress={go('/customer/profile')} />
        <Row label="Cài đặt thông báo" onPress={go('/customer/notification-settings')} />
      </Section>

      <Section title="Hỗ trợ">
        <Row label="Trung tâm trợ giúp" onPress={go('/customer/help')} />
        <Row label="Liên hệ hỗ trợ" onPress={go('/customer/support')} />
      </Section>

      {session && !session.team && !session.availableRoles.includes('SELLER') ? (
        <Section title="Cơ hội">
          <Row label="Mở quán trên bonbon" onPress={go('/customer/become-seller')} />
        </Section>
      ) : null}

      <View style={styles.signOutWrap}>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await unregisterPush()
            await signOut()
          }}
          style={[styles.signOut, { borderColor: theme.borderInput }]}
        >
          <Text style={styles.semi} color={theme.danger}>
            Đăng xuất
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

function Avatar({ name, url }: { name: string; url?: string }) {
  const theme = useTheme()
  return (
    <View style={[styles.avatar, { backgroundColor: theme.primarySubtle }]}>
      {url ? (
        <Image source={url} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <Text variant="titleSm" color={theme.onPrimarySubtle} style={styles.bold}>
          {(name.trim()[0] ?? '?').toUpperCase()}
        </Text>
      )}
    </View>
  )
}

function RoundIcon({ children }: { children: ReactNode }) {
  const theme = useTheme()
  return <View style={[styles.round, { backgroundColor: theme.primarySubtle }]}>{children}</View>
}

function Chip({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, { borderColor: theme.border }]}>
      {icon}
      <Text variant="bodySm" style={styles.semi} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title" style={styles.bold} accessibilityRole="header">
        {title}
      </Text>
      <View>{children}</View>
    </View>
  )
}

function Row({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}
    >
      <Text style={styles.flex}>{label}</Text>
      {value ? (
        <Text variant="bodySm" muted numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      <ChevronRight size={20} color={theme.text} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxxl * 2, gap: spacing.xl },
  band: {},
  body: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  profile: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  shadow: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pill: { minHeight: 36, paddingHorizontal: spacing.lg, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1 },
  methods: { flexDirection: 'row', gap: spacing.md },
  method: { flex: 1, minHeight: 128, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, justifyContent: 'space-between', gap: spacing.md },
  methodTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  round: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touchTarget.large, borderRadius: radius.md },
  value: { maxWidth: '45%' },
  signOutWrap: { paddingHorizontal: spacing.lg },
  signOut: { minHeight: touchTarget.min, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  bold: { fontFamily: fonts.bold },
  semi: { fontFamily: fonts.semibold },
})
