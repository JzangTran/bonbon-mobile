import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { api } from '@/shared/api'

const TOKEN_KEY = 'bonbon.pushToken'

/** Push needs a real device build: it does nothing on the web preview, and Expo Go cannot receive remote pushes. */
const supported = Platform.OS === 'android' || Platform.OS === 'ios'

let configured = false
/** Tokens already sent to the server in this launch, so a screen remounting never repeats the call. */
const sent = new Set<string>()

/** Shows pushes even while the app is open (a new order must not be missed because the screen happens to be on). */
function configure() {
  if (configured || !supported) return
  configured = true
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  })
}

/** Two channels so the OS can tell them apart (push-notifications.md): urgent order alerts, and everything else. */
async function ensureChannels() {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('orders_urgent', {
    name: 'Đơn hàng',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 200, 400],
    sound: 'default',
  })
  await Notifications.setNotificationChannelAsync('general', { name: 'Thông báo khác', importance: Notifications.AndroidImportance.DEFAULT })
}

/**
 * Registers this phone for pushes (push-notifications.md "Lifecycle"). With {@code ask: false} it only refreshes
 * the token when permission was already given, so it is safe on every launch; with {@code ask: true} it also shows
 * the OS permission prompt, which should happen at a moment with context (a shop just approved, a first order placed)
 * because iOS asks only once. Returns whether the device ended up registered.
 */
export async function registerForPush(options: { ask: boolean }): Promise<boolean> {
  if (!supported) return false
  try {
    configure()
    await ensureChannels()
    let permission = await Notifications.getPermissionsAsync()
    if (!permission.granted && options.ask && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync()
    if (!permission.granted) return false

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    if (!sent.has(token)) {
      const { error } = await api.POST('/api/push-devices', {
        body: { token, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID', appVersion: Constants.expoConfig?.version },
      })
      if (error) return false
      sent.add(token)
    }
    await AsyncStorage.setItem(TOKEN_KEY, token)
    return true
  } catch {
    // No project id, no Google services, an emulator: push simply is not available, and the app works without it.
    return false
  }
}

/** Call before logging out, while the access token is still valid: this phone stops receiving this account's pushes. */
export async function unregisterPush(): Promise<void> {
  if (!supported) return
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY)
    if (!token) return
    await api.POST('/api/push-devices/revoke', { body: { token } })
    sent.delete(token)
    await AsyncStorage.removeItem(TOKEN_KEY)
  } catch {
    // Offline: the server keeps the device until the token is re-registered by another account or goes stale.
  }
}

/** Opens the order a push is about, from a tap while the app runs or the one that launched it. */
export function useNotificationTaps() {
  const router = useRouter()
  useEffect(() => {
    if (!supported) return
    configure()
    const open = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data as { orderId?: string; audience?: string } | undefined
      if (!data?.orderId) return
      if (data.audience === 'SHOP') router.push({ pathname: '/seller/order-detail', params: { id: data.orderId } })
      else if (data.audience === 'CUSTOMER') router.push({ pathname: '/customer/order', params: { id: data.orderId } })
    }
    void Notifications.getLastNotificationResponseAsync().then(open)
    const subscription = Notifications.addNotificationResponseReceivedListener(open)
    return () => subscription.remove()
  }, [router])
}
