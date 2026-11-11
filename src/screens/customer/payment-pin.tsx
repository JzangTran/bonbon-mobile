import { useRouter } from 'expo-router'
import { CircleCheck, Delete } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useChangePaymentPin, usePaymentPin } from '@/entities/payment-method'
import { problemCode, problemMessage } from '@/shared/api'
import { Button, Skeleton, SkeletonGroup, Text, fonts, radius, spacing, useTheme, useToast } from '@/shared/ui'
import { PageHeader } from './payment-settings'

const LENGTH = 6
type Step = 'current' | 'new' | 'repeat' | 'done'
const PROMPTS: Record<Exclude<Step, 'done'>, string> = {
  current: 'Nhập mã PIN hiện tại của bạn',
  new: 'Nhập mã PIN mới',
  repeat: 'Nhập lại mã PIN',
}

/**
 * The payment PIN, six digits. With none yet: new, then again. With one: the current one first. The current PIN is only checked
 * by the server when the new one is saved, so a wrong one sends the customer back to the first step.
 */
export default function PaymentPinScreen() {
  const status = usePaymentPin()
  if (status.isLoading || !status.data) {
    return (
      <Shell>
        <SkeletonGroup style={styles.loading}>
          <Skeleton width="60%" height={20} />
        </SkeletonGroup>
      </Shell>
    )
  }
  return <PinFlow hasPin={status.data.set ?? false} />
}

function Shell({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <PageHeader title="Mã PIN" />
      {children}
    </View>
  )
}

function PinFlow({ hasPin }: { hasPin: boolean }) {
  const theme = useTheme()
  const router = useRouter()
  const toast = useToast()
  const change = useChangePaymentPin()
  const [step, setStep] = useState<Step>(hasPin ? 'current' : 'new')
  const [current, setCurrent] = useState('')
  const [fresh, setFresh] = useState('')
  const [typed, setTyped] = useState('')

  const complete = (pin: string) => {
    setTyped('')
    if (step === 'current') {
      setCurrent(pin)
      setStep('new')
    } else if (step === 'new') {
      setFresh(pin)
      setStep('repeat')
    } else if (pin !== fresh) {
      toast.show('Mã PIN nhập lại không khớp. Hãy nhập mã mới lần nữa.', 'error')
      setFresh('')
      setStep('new')
    } else {
      change.mutate(
        { currentPin: hasPin ? current : undefined, newPin: pin },
        {
          onSuccess: () => setStep('done'),
          onError: (e) => {
            toast.show(problemMessage(e), 'error')
            if (problemCode(e) === 'PIN_INCORRECT' || problemCode(e) === 'PIN_LOCKED') {
              setCurrent('')
              setFresh('')
              setStep('current')
            } else setStep('new')
          },
        },
      )
    }
  }

  const press = (key: string) => {
    if (change.isPending) return
    if (key === 'del') return setTyped((t) => t.slice(0, -1))
    const next = typed + key
    if (next.length < LENGTH) return setTyped(next)
    complete(next)
  }

  if (step === 'done') {
    return (
      <Shell>
        <View style={styles.done}>
          <CircleCheck size={72} color={theme.success} />
          <Text variant="title" style={styles.bold}>
            Xác nhận mã PIN thành công
          </Text>
          <Text muted style={styles.center}>
            Mã PIN này dùng để xác nhận các thao tác thanh toán của bạn.
          </Text>
          <Button title="Xong" size="lg" fullWidth onPress={() => router.back()} />
        </View>
      </Shell>
    )
  }

  return (
    <Shell>
      <View style={styles.body}>
        <Text variant="titleSm" style={[styles.bold, styles.center]}>
          {PROMPTS[step]}
        </Text>
        <View accessibilityLabel={`Đã nhập ${typed.length} trên ${LENGTH} số`} style={styles.dots}>
          {Array.from({ length: LENGTH }, (_, i) => (
            <View key={i} style={[styles.dot, { borderColor: theme.text, backgroundColor: i < typed.length ? theme.text : 'transparent' }]} />
          ))}
        </View>
      </View>
      <View style={styles.pad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) =>
          key === '' ? (
            <View key="blank" style={styles.key} />
          ) : (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === 'del' ? 'Xoá' : key}
              onPress={() => press(key)}
              style={({ pressed }) => [styles.key, pressed && { backgroundColor: theme.surfaceMuted }]}
            >
              {key === 'del' ? <Delete size={26} color={theme.text} /> : <Text variant="title">{key}</Text>}
            </Pressable>
          ),
        )}
      </View>
    </Shell>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontFamily: fonts.bold },
  center: { textAlign: 'center' },
  loading: { padding: spacing.lg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, padding: spacing.lg },
  dots: { flexDirection: 'row', gap: spacing.md },
  dot: { width: 16, height: 16, borderRadius: radius.pill, borderWidth: 2 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  key: { width: '33.333%', height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
})
