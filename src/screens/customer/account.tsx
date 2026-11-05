import { useRouter } from 'expo-router'
import { Bell, ChevronRight, LifeBuoy, MapPin, Store } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useAddresses } from '@/entities/address'
import { useSession } from '@/entities/session'
import { Card, Screen, Text, spacing, touchTarget, useTheme } from '@/shared/ui'
import { AccountPanel } from '@/widgets/account-panel'

export default function CustomerAccountScreen() {
  const theme = useTheme()
  const router = useRouter()
  const addresses = useAddresses()
  const { session } = useSession()
  const defaultAddress = addresses.data?.find((a) => a.isDefault)
  return (
    <Screen>
      <Text variant="headline">Tài khoản</Text>
      {session && !session.availableRoles.includes('SELLER') ? (
        <Card>
          <Pressable accessibilityRole="button" style={styles.row} onPress={() => router.push('/customer/become-seller')}>
            <Store size={20} color={theme.primary} />
            <View style={styles.flex}>
              <Text variant="body">Đăng ký trở thành người bán hàng</Text>
              <Text variant="caption" muted>
                Mở quán bằng chính tài khoản này
              </Text>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </Pressable>
        </Card>
      ) : null}
      <Card>
        <Pressable accessibilityRole="button" style={styles.row} onPress={() => router.push('/customer/addresses')}>
          <MapPin size={20} color={theme.primary} />
          <View style={styles.flex}>
            <Text variant="body">Địa chỉ giao hàng</Text>
            <Text variant="caption" muted numberOfLines={1}>
              {defaultAddress ? `${defaultAddress.label}: ${defaultAddress.formattedAddress}` : 'Chưa có địa chỉ'}
            </Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.row} onPress={() => router.push('/customer/help')}>
          <LifeBuoy size={20} color={theme.primary} />
          <View style={styles.flex}>
            <Text variant="body">Trợ giúp và liên hệ hỗ trợ</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.row} onPress={() => router.push('/customer/notification-settings')}>
          <Bell size={20} color={theme.primary} />
          <View style={styles.flex}>
            <Text variant="body">Cài đặt thông báo</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </Pressable>
      </Card>
      <AccountPanel />
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.large },
  flex: { flex: 1 },
})
