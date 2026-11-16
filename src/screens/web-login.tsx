import { CameraView, useCameraPermissions } from 'expo-camera'
import * as LocalAuthentication from 'expo-local-authentication'
import { useLocalSearchParams, useRouter, type Href } from 'expo-router'
import { X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, problemMessage, type components } from '@/shared/api'
import { formatDateTime } from '@/shared/lib/format'
import { webLoginSession } from '@/shared/lib/web-login-code'
import { Button, Card, Notice, Screen, Text, radius, spacing } from '@/shared/ui'

type Inspect = components['schemas']['Inspect']

type Step =
  | { kind: 'scan' }
  | { kind: 'checking' }
  | { kind: 'confirm'; sessionId: string; info: Inspect }
  | { kind: 'done'; confirmed: boolean }
  | { kind: 'error'; message: string }

/**
 * "Quét mã đăng nhập web" (login-qr-code.md): the seller points the phone at the code on the bonbon seller sign-in page. Scanning
 * never signs the browser in by itself: the phone shows which browser and IP are asking, and only "Đăng nhập" lets it in, after the
 * phone's own lock (fingerprint, face or passcode) when one is set up. This guards against someone showing the seller their own
 * code to get into the shop.
 */
export default function WebLoginScreen({ home }: { home: Href }) {
  const router = useRouter()
  const params = useLocalSearchParams<{ s?: string }>()
  const [step, setStep] = useState<Step>({ kind: 'scan' })
  const [busy, setBusy] = useState(false)
  const handled = useRef(false)

  const leave = () => (router.canGoBack() ? router.back() : router.replace(home))

  const inspect = async (sessionId: string) => {
    setStep({ kind: 'checking' })
    const { data, error } = await api.POST('/api/auth/qr-login/scan', { body: { sessionId } })
    if (!data) {
      setStep({ kind: 'error', message: problemMessage(error) })
      return
    }
    setStep({ kind: 'confirm', sessionId, info: data })
  }

  // a code scanned from the customer scanner arrives with its session id
  const fromParam = useRef(false)
  useEffect(() => {
    if (fromParam.current || !params.s) return
    fromParam.current = true
    handled.current = true
    void inspect(params.s)
  }, [params.s])

  const answer = async (confirmed: boolean) => {
    if (step.kind !== 'confirm') return
    if (confirmed && !(await unlocked())) return
    setBusy(true)
    const path = confirmed ? '/api/auth/qr-login/confirm' : '/api/auth/qr-login/reject'
    const { error } = await api.POST(path, { body: { sessionId: step.sessionId } })
    setBusy(false)
    setStep(error ? { kind: 'error', message: problemMessage(error) } : { kind: 'done', confirmed })
  }

  if (step.kind === 'scan') {
    return (
      <Scanner
        onCode={(data) => {
          if (handled.current) return false
          const sessionId = webLoginSession(data)
          if (!sessionId) return false
          handled.current = true
          void inspect(sessionId)
          return true
        }}
        onClose={leave}
      />
    )
  }

  return (
    <Screen>
      <View>
        <Button title="← Quay lại" variant="ghost" onPress={leave} />
      </View>
      <Text variant="headline">Đăng nhập trang quản lý quán</Text>
      {step.kind === 'checking' ? <Text variant="body">Đang kiểm tra mã…</Text> : null}
      {step.kind === 'confirm' ? (
        <Card>
          <Text variant="titleSm">Có đúng là bạn đang đăng nhập trên máy này?</Text>
          <Text variant="bodySm" muted>
            Chỉ bấm Đăng nhập nếu chính bạn vừa mở trang đăng nhập của bonbon trên máy tính. Nếu ai đó đưa mã này cho bạn quét, hãy từ chối.
          </Text>
          <InfoRow label="Trình duyệt" value={step.info.device ?? '—'} />
          <InfoRow label="Địa chỉ IP" value={step.info.ip ?? '—'} />
          <InfoRow label="Thời điểm" value={formatDateTime(step.info.requestedAt)} />
          <Button title="Đăng nhập" loading={busy} onPress={() => void answer(true)} />
          <Button title="Từ chối" variant="outline" disabled={busy} onPress={() => void answer(false)} />
        </Card>
      ) : null}
      {step.kind === 'done' ? (
        <Card>
          <Text variant="titleSm">{step.confirmed ? 'Đã đăng nhập trên máy tính' : 'Đã từ chối'}</Text>
          <Text variant="bodySm" muted>
            {step.confirmed
              ? 'Trang quản lý quán trên máy tính sẽ tự mở trong vài giây.'
              : 'Máy tính kia không được đăng nhập. Nếu không phải bạn mở trang đó, hãy đổi mật khẩu.'}
          </Text>
          <Button title="Xong" onPress={leave} />
        </Card>
      ) : null}
      {step.kind === 'error' ? (
        <>
          <Notice tone="error" message={step.message} />
          <Button
            title="Quét lại"
            variant="outline"
            onPress={() => {
              handled.current = false
              setStep({ kind: 'scan' })
            }}
          />
        </>
      ) : null}
    </Screen>
  )
}

/** The phone's own lock before letting a browser in, when the phone has one set up; otherwise the confirmation screen is the check. */
async function unlocked(): Promise<boolean> {
  try {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) return true
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Xác nhận đăng nhập trang quản lý quán', cancelLabel: 'Huỷ' })
    return result.success
  } catch {
    return true
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="bodySm" muted>
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  )
}

function Scanner({ onCode, onClose }: { onCode: (data: string) => boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  const [permission, requestPermission] = useCameraPermissions()
  const [problem, setProblem] = useState<string | null>(null)
  const asked = useRef(false)

  useEffect(() => {
    if (!permission || permission.granted || asked.current) return
    asked.current = true
    if (permission.canAskAgain) {
      void requestPermission().then((answer) => {
        if (!answer.granted) onClose()
      })
      return
    }
    Alert.alert('Cho phép dùng máy ảnh', 'bonbon cần máy ảnh để quét mã đăng nhập. Bạn có thể bật quyền này trong Cài đặt.', [
      { text: 'Để sau', style: 'cancel', onPress: onClose },
      {
        text: 'Mở cài đặt',
        onPress: () => {
          void Linking.openSettings()
          onClose()
        },
      },
    ])
  }, [permission, requestPermission, onClose])

  return (
    <View style={styles.camera}>
      {permission?.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            if (!onCode(data)) setProblem('Đây không phải mã đăng nhập của bonbon. Hãy quét mã trên trang đăng nhập của người bán.')
          }}
        />
      ) : null}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.frame} />
        <Text variant="body" color="#FFFFFF" style={styles.hint}>
          Đưa mã QR trên trang đăng nhập máy tính vào khung
        </Text>
        {problem ? <Notice tone="error" message={problem} /> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đóng"
        hitSlop={8}
        onPress={onClose}
        style={[styles.close, { top: insets.top + spacing.sm }]}
      >
        <X size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { gap: 2, paddingVertical: spacing.xs },
  camera: { flex: 1, backgroundColor: '#000' },
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
