import { useRouter, type Href } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useUnreadCount } from '@/entities/notification'
import { Text, radius, touchTarget, useTheme } from '@/shared/ui'

/** The bell with the unread count; opens the notification list of the current role. */
export function NotificationBell({ href }: { href: Href }) {
  const router = useRouter()
  const theme = useTheme()
  const unread = useUnreadCount()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
      onPress={() => router.push(href)}
      style={styles.button}
    >
      <Bell size={22} color={theme.text} strokeWidth={1.75} />
      {unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.danger }]}>
          <Text variant="caption" color={theme.onDanger}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { width: touchTarget.min, height: touchTarget.min, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 4, right: 2, minWidth: 18, height: 18, borderRadius: radius.pill, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
})
