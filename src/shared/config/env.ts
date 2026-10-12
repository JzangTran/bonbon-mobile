import { Platform } from 'react-native'

/** iOS OAuth client of the bonbon Google Cloud project (public); app.config.ts uses the same default. */
export const DEFAULT_GOOGLE_IOS_CLIENT_ID = '1083524871594-2dpqinqn9opkekea75vm6gg0ttkfrf67.apps.googleusercontent.com'

/** The store platform the server checks versions for; the web preview sends none, so it is never held back (override only to try the update screen). */
const nativePlatform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : undefined

export const env = {
  appPlatform: process.env.EXPO_PUBLIC_APP_PLATFORM ?? nativePlatform,
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
  /** Web app origin: legal documents and email links (reset password, verify email) open there. */
  webUrl: process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:5173',
  /**
   * Google OAuth web client ID (public). On Android it is the audience of the ID token the native SDK returns,
   * and the Expo web target signs in with it directly. The default is the bonbon development client.
   */
  googleWebClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '1083524871594-tim3ulsu19iegg7605ab0t4b7ca6onf0.apps.googleusercontent.com',
  /** iOS OAuth client ID; the backend's GOOGLE_CLIENT_IDS must list it too. */
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? DEFAULT_GOOGLE_IOS_CLIENT_ID,
  /**
   * reCAPTCHA v2 site key. Empty = development stand-in (the dev backend accepts any token). Native apps solve it
   * on the web app's /captcha-bridge page inside a WebView, so the key must allow the web app's domain.
   */
  recaptchaSiteKey: process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY ?? '',
} as const
