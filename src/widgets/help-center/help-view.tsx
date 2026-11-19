import { useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTheme } from '@/shared/ui'

/** Native: the web help center in a web view; links to other sites open in the browser. */
export function HelpView({ url }: { url: string }) {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const origin = new URL(url).origin
  return (
    <View style={styles.flex}>
      <WebView
        source={{ uri: url }}
        originWhitelist={[`${origin}*`]}
        onLoadEnd={() => setLoading(false)}
        style={[styles.flex, { backgroundColor: theme.background }]}
      />
      {loading ? <ActivityIndicator style={StyleSheet.absoluteFill} color={theme.accent} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({ flex: { flex: 1 } })
