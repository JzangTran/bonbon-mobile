export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
  /** Web app origin: legal documents and email links (reset password, verify email) open there. */
  webUrl: process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:5173',
  /**
   * Google OAuth web client ID (public). On Android it is the audience of the ID token the native SDK returns,
   * and the Expo web target signs in with it directly. The default is the bonbon development client.
   */
  googleWebClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '802394872594-j6l9f60rlfmkj0e0m5ohebja14o9dua4.apps.googleusercontent.com',
  /** iOS OAuth client ID; also add it to the backend's GOOGLE_CLIENT_IDS. Empty disables Google on iOS. */
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  /**
   * reCAPTCHA v2 site key. Empty = development stand-in (the dev backend accepts any token). Native apps solve it
   * on the web app's /captcha-bridge page inside a WebView, so the key must allow the web app's domain.
   */
  recaptchaSiteKey: process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY ?? '',
} as const
