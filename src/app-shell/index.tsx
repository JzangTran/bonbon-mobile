import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState, type ReactNode } from 'react'
import { SessionProvider } from '@/entities/session'
import { isApiProblem } from '@/shared/api'
import { ToastProvider } from '@/shared/ui'
import { AppGate } from './app-gate'
import { DocumentTitle } from './document-title'

SplashScreen.preventAutoHideAsync()

/**
 * The non-routing half of the FSD app layer (Expo Router owns src/app/, which may only hold routes).
 * Loads fonts behind the splash screen and mounts the app-wide providers.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  })
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // A gate answer (legal, maintenance, update) will not change by asking again: let the gate screen take over at once.
            retry: (failureCount, error) => failureCount < 1 && !(isApiProblem(error) && [403, 426, 503].includes(error.status)),
          },
        },
      }),
  )

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ToastProvider>
          <DocumentTitle />
          <AppGate>{children}</AppGate>
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
