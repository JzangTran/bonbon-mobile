export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
  /** Web app origin: legal documents and email links (reset password, verify email) open there. */
  webUrl: process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:5173',
} as const
