import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { Button, Notice, Screen, Text, radius, spacing } from '@/shared/ui'

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

/** Scans a shop's QR code (on its counter or bag) and opens that shop's menu. */
export default function ScanScreen() {
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()
  const [problem, setProblem] = useState<string | null>(null)
  const handled = useRef(false)

  if (!permission) return <Screen>{null}</Screen>
  if (!permission.granted) {
    return (
      <Screen>
        <Text variant="headline">Quét mã QR của quán</Text>
        <Text muted>bonbon cần dùng máy ảnh để đọc mã QR dán ở quầy hoặc trên túi đồ ăn của quán.</Text>
        {permission.canAskAgain ? (
          <Button title="Cho phép dùng máy ảnh" size="lg" fullWidth onPress={() => void requestPermission()} />
        ) : (
          <Button title="Mở cài đặt" size="lg" fullWidth onPress={() => void Linking.openSettings()} />
        )}
      </Screen>
    )
  }

  return (
    <View style={styles.flex}>
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
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.frame} />
        <Text variant="body" color="#FFFFFF" style={styles.hint}>
          Đưa mã QR của quán vào khung
        </Text>
        {problem ? <Notice tone="error" message={problem} /> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.lg },
  frame: { width: 240, height: 240, borderRadius: radius.card, borderWidth: 3, borderColor: '#FFFFFF' },
  hint: { textAlign: 'center' },
})
