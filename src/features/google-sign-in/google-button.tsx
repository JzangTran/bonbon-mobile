import { useState } from 'react'
import { Platform, Pressable } from 'react-native'
import { env } from '@/shared/config/env'
import { useTx } from '@/shared/i18n'
import { Button } from '@/shared/ui'
import { GoogleMark, googleIconStyle } from './google-mark'

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
export function GoogleButton({ icon = false, onIdToken, onError }: { icon?: boolean; onIdToken: (idToken: string) => void; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false)
  const tx = useTx()
  if (!available || !google) {
    if (!icon) return null
    // Expo Go has no Google module: the sign-in sheet keeps its button and says why it cannot work here
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tx('Đăng nhập bằng Google', 'Sign in with Google')}
        onPress={() => onError(tx('Đăng nhập Google cần bản cài đặt của app, chưa dùng được trong Expo Go.', 'Google sign-in needs the installed app; it does not work in Expo Go.'))}
        style={googleIconStyle}
      >
        <GoogleMark />
      </Pressable>
    )
  }
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
      else onError(tx('Google không trả về thông tin đăng nhập. Vui lòng thử lại.', 'Google returned no sign-in details. Please try again.'))
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return
      if (isErrorWithCode(e) && e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError(tx('Thiết bị cần Google Play Services để đăng nhập bằng Google.', 'This device needs Google Play Services to sign in with Google.'))
        return
      }
      onError(tx('Không đăng nhập được bằng Google. Vui lòng thử lại.', 'Could not sign in with Google. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  if (icon) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={tx('Đăng nhập bằng Google', 'Sign in with Google')} disabled={busy} onPress={signIn} style={googleIconStyle}>
        <GoogleMark />
      </Pressable>
    )
  }
  return <Button title={tx('Tiếp tục với Google', 'Continue with Google')} variant="outline" size="lg" fullWidth loading={busy} onPress={signIn} />
}
