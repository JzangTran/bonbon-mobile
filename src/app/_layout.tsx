import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { AppShell } from '@/app-shell'
import { useSession } from '@/entities/session'
import { registerForPush, useNotificationTaps } from '@/features/push'

export default function RootLayout() {
  return (
    <AppShell>
      <RootNavigator />
    </AppShell>
  )
}

/** Each role sees only its own route group; the active role decides (one role per session). */
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
  const userId = session?.userId
  useNotificationTaps()
  useEffect(() => {
    if (userId) void registerForPush({ ask: false })
  }, [userId])
  return null
}

function RoleStack({ session }: { session: ReturnType<typeof useSession>['session'] }) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={session?.role === 'CUSTOMER'}>
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
