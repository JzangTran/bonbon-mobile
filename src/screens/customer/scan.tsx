import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Notice, Text, radius, spacing } from '@/shared/ui'

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/** The shop a scanned code points at: bonbon shop links carry /shops/{id} (printed by the seller), or ?id= in an app link. */
export function shopIdFromCode(data: string): string | null {
  const path = /\/shops\/([0-9a-f-]{36})/i.exec(data)
  if (path) return path[1]
  try {
    const id = new URL(data).searchParams.get('id')
    if (id && UUID.test(id)) return id
  } catch {
    // not a link
  }
  return null
}

/**
 * Scans a shop's QR code (on its counter or bag) and opens that shop's menu. The camera fills the screen at once; without
 * permission the system asks first, and saying no goes back to where the customer came from. When the phone will not ask again
 * (refused for good), a short dialog offers the settings instead.
 */
export default function ScanScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()
  const [problem, setProblem] = useState<string | null>(null)
  const handled = useRef(false)
  const asked = useRef(false)

  useEffect(() => {
    if (!permission || permission.granted || asked.current) return
    asked.current = true
    const leave = () => (router.canGoBack() ? router.back() : router.replace('/customer'))
    if (permission.canAskAgain) {
      void requestPermission().then((answer) => {
        if (!answer.granted) leave()
      })
      return
    }
    Alert.alert('Cho phép dùng máy ảnh', 'bonbon cần máy ảnh để quét mã QR của quán. Bạn có thể bật quyền này trong Cài đặt.', [
      { text: 'Để sau', style: 'cancel', onPress: leave },
      {
        text: 'Mở cài đặt',
        onPress: () => {
          void Linking.openSettings()
          leave()
        },
      },
    ])
  }, [permission, requestPermission, router])

  return (
    <View style={styles.root}>
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            if (handled.current) return
            const id = shopIdFromCode(data)
            if (!id) {
              setProblem('Mã này không phải mã quán trên bonbon.')
              return
            }
            handled.current = true
            router.replace({ pathname: '/customer/vendor', params: { id } })
          }}
        />
      ) : null}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.frame} />
        <Text variant="body" color="#FFFFFF" style={styles.hint}>
          Đưa mã QR của quán vào khung
        </Text>
        {problem ? <Notice tone="error" message={problem} /> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng"
        hitSlop={8}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/customer'))}
        style={[styles.close, { top: insets.top + spacing.sm }]}
      >
        <X size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  frame: { width: 240, height: 240, borderRadius: radius.card, borderWidth: 3, borderColor: '#FFFFFF' },
  hint: { textAlign: 'center' },
  close: {
    position: 'absolute',
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
})
