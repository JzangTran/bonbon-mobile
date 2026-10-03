import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { env } from '@/shared/config/env'
import { Button } from './button'
import { DevCaptcha } from './captcha-dev'
import { Sheet } from './sheet'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

/** reCAPTCHA tokens expire after 2 minutes; forget ours a little earlier so the server never sees a stale one. */
const TOKEN_LIFETIME_MS = 110_000

/**
 * reCAPTCHA v2 on iOS and Android: the challenge runs on the web app's /captcha-bridge page inside a WebView
 * (reCAPTCHA only works on a domain registered for the site key) and posts the token back.
 */
export function Captcha({ token, onToken }: { token: string | null; onToken: (token: string | null) => void }) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const expiry = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (expiry.current) clearTimeout(expiry.current)
  }, [])

  if (!env.recaptchaSiteKey) return <DevCaptcha token={token} onToken={onToken} />

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; token?: string }
      if (message.type !== 'bonbon-captcha' || !message.token) return
      onToken(message.token)
      setOpen(false)
      if (expiry.current) clearTimeout(expiry.current)
      expiry.current = setTimeout(() => onToken(null), TOKEN_LIFETIME_MS)
    } catch {
      // Not ours.
    }
  }

  return (
    <View>
      {token ? (
        <View style={[styles.done, { backgroundColor: theme.successSubtle }]}>
          <Text variant="bodySm" color={theme.onSuccessSubtle}>
            ✓ Đã xác minh bạn không phải robot
          </Text>
        </View>
      ) : (
        <Button title="Xác minh tôi không phải robot" variant="outline" onPress={() => setOpen(true)} />
      )}
      <Sheet visible={open} onClose={() => setOpen(false)} title="Xác minh">
        <View style={styles.frame}>
          <WebView
            source={{ uri: `${env.webUrl}/captcha-bridge` }}
            onMessage={onMessage}
            originWhitelist={[`${env.webUrl}*`]}
            javaScriptEnabled
            style={styles.web}
          />
        </View>
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  done: { borderRadius: radius.sm, padding: spacing.md },
  frame: { height: 520, borderRadius: radius.sm, overflow: 'hidden' },
  web: { flex: 1, backgroundColor: 'transparent' },
})
