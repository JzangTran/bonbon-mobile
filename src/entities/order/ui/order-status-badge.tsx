import {
  Ban,
  Bike,
  Check,
  ChefHat,
  CircleCheck,
  CircleX,
  Clock,
  PackageX,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { Text, radius, spacing, useTheme, type ColorScheme } from '@/shared/ui'
import type { OrderStatus } from '../model'

type Style = { label: string; icon: LucideIcon; bg: keyof ColorScheme; fg: keyof ColorScheme }

/** Label + icon + color for every status (never color alone); values from the design-tokens doc. */
const STATUS_STYLE: Record<OrderStatus, Style> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', icon: Wallet, bg: 'warningSubtle', fg: 'onWarningSubtle' },
  PLACED: { label: 'Chờ quán xác nhận', icon: Clock, bg: 'infoSubtle', fg: 'onInfoSubtle' },
  CONFIRMED: { label: 'Quán đã nhận đơn', icon: Check, bg: 'infoSubtle', fg: 'onInfoSubtle' },
  PREPARING: { label: 'Đang chuẩn bị', icon: ChefHat, bg: 'caramel', fg: 'onCaramel' },
  OUT_FOR_DELIVERY: { label: 'Đang giao', icon: Bike, bg: 'primarySubtle', fg: 'onPrimarySubtle' },
  DELIVERED: { label: 'Đã giao', icon: CircleCheck, bg: 'successSubtle', fg: 'onSuccessSubtle' },
  CANCELLED: { label: 'Đã huỷ', icon: CircleX, bg: 'surfaceMuted', fg: 'textMuted' },
  REJECTED: { label: 'Quán từ chối', icon: Ban, bg: 'dangerSubtle', fg: 'onDangerSubtle' },
  NOT_DELIVERED: { label: 'Giao không thành công', icon: PackageX, bg: 'dangerSubtle', fg: 'onDangerSubtle' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const theme = useTheme()
  const { label, icon: Icon, bg, fg } = STATUS_STYLE[status]
  return (
    <View style={[styles.badge, { backgroundColor: theme[bg] }]} accessibilityLabel={`Trạng thái: ${label}`}>
      <Icon size={14} color={theme[fg]} />
      <Text variant="caption" color={theme[fg]} style={styles.label}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  label: { fontFamily: 'BeVietnamPro_500Medium' },
})
