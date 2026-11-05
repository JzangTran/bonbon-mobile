import { Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { AppShell } from '@/app-shell'
import { useSession } from '@/entities/session'
import { takeAfterSignIn } from '@/features/after-sign-in'
import { registerForPush, useNotificationTaps } from '@/features/push'

export default function RootLayout() {
  return (
    <AppShell>
      <RootNavigator />
    </AppShell>
  )
}

/**
 * Each role sees only its own route group; the active role decides (one role per session). A guest gets the customer group to
 * browse shops, and the sign-in screens to come in through.
 */
function RootNavigator() {
  const { session, restoring } = useSession()
  // Keep the splash up until the stored session is read, so a signed-in user never flashes the login screen.
  if (restoring) return null
  return (
    <>
      <PushBootstrap />
      <RoleStack session={session} />
    </>
  )
}

/** Refreshes this phone's push token on every launch once permission was given, and opens the order a tapped push is about. */
function PushBootstrap() {
  const { session } = useSession()
  const router = useRouter()
  const userId = session?.userId
  const role = session?.role
  useNotificationTaps()
  // A guest who pressed a tab that needs an account lands on it once signed in, whichever way they signed in.
  useEffect(() => {
    if (role !== 'CUSTOMER') return
    const next = takeAfterSignIn()
    // On the next tick: the stack has to drop the sign-in sheet first, or it swallows this navigation.
    if (next) setTimeout(() => router.navigate(next), 0)
  }, [role, router])
  useEffect(() => {
    if (userId) void registerForPush({ ask: false })
  }, [userId])
  return null
}

function RoleStack({ session }: { session: ReturnType<typeof useSession>['session'] }) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!session}>
        {/* A sheet rising over the app, a gap at the top with the app darkened behind it: iOS's page sheet; Android gets the same from a form sheet. */}
        <Stack.Screen
          name="(auth)"
          options={Platform.OS === 'android' ? { presentation: 'formSheet', sheetAllowedDetents: [0.93], sheetCornerRadius: 16, sheetGrabberVisible: true } : { presentation: 'modal' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!session || session.role === 'CUSTOMER'}>
        <Stack.Screen name="customer" />
      </Stack.Protected>
      <Stack.Protected guard={session?.role === 'SELLER'}>
        <Stack.Screen name="seller" />
      </Stack.Protected>
      <Stack.Protected guard={__DEV__}>
        <Stack.Screen name="dev-ui" options={{ headerShown: true, title: 'UI kit' }} />
      </Stack.Protected>
    </Stack>
  )
}
