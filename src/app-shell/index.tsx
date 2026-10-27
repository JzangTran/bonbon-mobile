import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState, type ReactNode } from 'react'
import { SessionProvider } from '@/entities/session'
import { isApiProblem } from '@/shared/api'
import { TextScaleProvider, ToastProvider } from '@/shared/ui'
import { AppGate } from './app-gate'
import { DocumentTitle } from './document-title'

SplashScreen.preventAutoHideAsync()

/**
 * The non-routing half of the FSD app layer (Expo Router owns src/app/, which may only hold routes).
 * Loads fonts behind the splash screen and mounts the app-wide providers.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
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
      <TextScaleProvider>
        <SessionProvider>
          <ToastProvider>
            <DocumentTitle />
            <AppGate>{children}</AppGate>
          </ToastProvider>
        </SessionProvider>
      </TextScaleProvider>
    </QueryClientProvider>
  )
}
