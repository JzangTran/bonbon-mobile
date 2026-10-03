import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * app.json plus what depends on the environment. Google Sign-In on iOS needs the reversed iOS OAuth client ID
 * as a URL scheme (config plugin); without EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID the plugin is left out, which keeps
 * Android and web builds working (Android needs no plugin: the web client ID is enough).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  const plugins = [...(config.plugins ?? [])]
  if (iosClientId) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}` },
    ])
  }
  return { ...config, name: config.name ?? 'mobile', slug: config.slug ?? 'mobile', plugins }
}
