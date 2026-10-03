import { useState } from 'react'
import { Platform } from 'react-native'
import { env } from '@/shared/config/env'
import { Button } from '@/shared/ui'

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin')

/**
 * The native Google Sign-In module only exists in a development or release build; in Expo Go requiring it
 * throws, and then the button is simply not offered.
 */
function loadGoogleSignin(): GoogleSigninModule | null {
  try {
    // A static import would crash Expo Go at load time; this has to be a guarded require.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-google-signin/google-signin') as GoogleSigninModule
  } catch {
    return null
  }
}

const google = loadGoogleSignin()
let configured = false
const available = !!google && (Platform.OS !== 'ios' || !!env.googleIosClientId)

/** Opens the Google account chooser and hands the ID token over. Android tokens carry the web client ID. */
export function GoogleButton({ onIdToken, onError }: { onIdToken: (idToken: string) => void; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false)
  if (!available || !google) return null
  const { GoogleSignin, isErrorWithCode, statusCodes } = google

  const signIn = async () => {
    setBusy(true)
    try {
      if (!configured) {
        GoogleSignin.configure({ webClientId: env.googleWebClientId, iosClientId: env.googleIosClientId || undefined })
        configured = true
      }
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      const response = await GoogleSignin.signIn()
      if (response.type !== 'success') return
      // bonbon keeps its own session; forgetting the Google one lets the next sign-in pick another account.
      await GoogleSignin.signOut().catch(() => undefined)
      if (response.data.idToken) onIdToken(response.data.idToken)
      else onError('Google không trả về thông tin đăng nhập. Vui lòng thử lại.')
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return
      if (isErrorWithCode(e) && e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError('Thiết bị cần Google Play Services để đăng nhập bằng Google.')
        return
      }
      onError('Không đăng nhập được bằng Google. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return <Button title="Tiếp tục với Google" variant="outline" size="lg" fullWidth loading={busy} onPress={signIn} />
}
