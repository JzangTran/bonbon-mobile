import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { useRouter, type Href } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Bell, ChevronRight, CircleHelp, Flame, Heart, MapPin, MessageSquareText, ReceiptText, TicketPercent } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAddresses } from '@/entities/address'
import { useSession } from '@/entities/session'
import { api } from '@/shared/api'
import { ListGroup, ListRow, Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

const ICON = 20

/**
 * "Tài khoản" (design v6.1): who you are at the top (the whole row opens Hồ sơ, where the profile, password, privacy, opening a
 * shop and signing out live), two shortcuts, then the rest in small groups. Each destination appears once.
 */
export default function CustomerAccountScreen() {
  const theme = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const addresses = useAddresses()
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
  const email = profile.data?.email ?? session?.email ?? ''
  const defaultAddress = addresses.data?.find((a) => a.isDefault)
  const go = (href: Href) => () => router.push(href)
  const icon = (I: typeof Heart) => <I size={ICON} color={theme.textSecondary} strokeWidth={1.5} />

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]}>
      <StatusBar style="dark" />
      <Text variant="title1" accessibilityRole="header">
        Tài khoản
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Hồ sơ của ${name || 'bạn'}`}
        onPress={go('/customer/profile')}
        style={({ pressed }) => [styles.me, { borderColor: theme.border }, pressed && { backgroundColor: theme.surfaceSubtle }]}
      >
        <Avatar name={name} url={profile.data?.avatarUrl} />
        <View style={styles.flex}>
          <Text variant="title3" numberOfLines={1}>
            {name || 'Tài khoản của bạn'}
          </Text>
          <Text variant="bodySm" color={theme.textTertiary} numberOfLines={1}>
            {email ? `${email} · Xem hồ sơ` : 'Xem hồ sơ'}
          </Text>
        </View>
        <ChevronRight size={18} color={theme.textTertiary} strokeWidth={1.5} />
      </Pressable>

      <View style={styles.shortcuts}>
        <Shortcut icon={<Heart size={22} color={theme.accent} strokeWidth={1.5} />} label="Quán yêu thích" onPress={go('/customer/favorites')} />
        <Shortcut icon={<TicketPercent size={22} color={theme.accent} strokeWidth={1.5} />} label="Ưu đãi của tôi" onPress={go('/customer/offers')} />
      </View>

      <ListGroup title="Mua sắm">
        <ListRow icon={icon(Flame)} label="Deal HOT" onPress={go('/customer/deals')} />
        <ListRow icon={icon(MapPin)} label="Địa chỉ giao hàng" value={defaultAddress?.label} onPress={go('/customer/addresses')} />
        <ListRow icon={icon(ReceiptText)} label="Lịch sử thanh toán" onPress={go('/customer/payment-history')} />
      </ListGroup>

      <ListGroup title="Cài đặt">
        <ListRow icon={icon(Bell)} label="Cài đặt thông báo" onPress={go('/customer/notification-settings')} />
      </ListGroup>

      <ListGroup title="Hỗ trợ">
        <ListRow icon={icon(CircleHelp)} label="Trung tâm trợ giúp" onPress={go('/customer/help')} />
        <ListRow icon={icon(MessageSquareText)} label="Liên hệ hỗ trợ" onPress={go('/customer/support')} />
      </ListGroup>
    </ScrollView>
  )
}

function Avatar({ name, url }: { name: string; url?: string }) {
  const theme = useTheme()
  return (
    <View style={[styles.avatar, { backgroundColor: theme.accentSubtle }]}>
      {url ? (
        <Image source={url} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <Text variant="title3" color={theme.onAccentSubtle}>
          {(name.trim()[0] ?? '?').toUpperCase()}
        </Text>
      )}
    </View>
  )
}

function Shortcut({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.shortcut, { borderColor: theme.border }, pressed && { backgroundColor: theme.surfaceSubtle }]}
    >
      {icon}
      <Text variant="label" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  // the page title, who you are, the shortcuts and the groups are separate things: larger steps between them than inside them
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl * 2, gap: spacing.xxl },
  me: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderRadius: radius.card, marginTop: -spacing.sm },
  avatar: { width: 52, height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  shortcuts: { flexDirection: 'row', gap: spacing.md, marginTop: -spacing.md },
  shortcut: { flex: 1, minHeight: touchTarget.large + spacing.lg, borderWidth: 1, borderRadius: radius.card, padding: spacing.md, gap: spacing.sm, justifyContent: 'center' },
  flex: { flex: 1 },
})
