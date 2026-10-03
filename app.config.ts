import type { ConfigContext, ExpoConfig } from 'expo/config'

/** iOS OAuth client of the bonbon Google Cloud project (public); src/shared/config/env.ts uses the same default. */
const DEFAULT_GOOGLE_IOS_CLIENT_ID = '1083524871594-2dpqinqn9opkekea75vm6gg0ttkfrf67.apps.googleusercontent.com'

/**
 * app.json plus what depends on the environment. Google Sign-In on iOS needs the reversed iOS OAuth client ID
 * as a URL scheme (config plugin). EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID overrides the project default; an empty value
 * leaves the plugin out (Android needs no plugin: the web client ID is enough).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? DEFAULT_GOOGLE_IOS_CLIENT_ID
  const plugins = [...(config.plugins ?? [])]
  if (iosClientId) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}` },
    ])
  }
  return { ...config, name: config.name ?? 'mobile', slug: config.slug ?? 'mobile', plugins }
}
