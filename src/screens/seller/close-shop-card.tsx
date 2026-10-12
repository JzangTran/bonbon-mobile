import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { CLOSE_REASON_LABEL, useCloseShop, type CloseReason } from '@/entities/shop'
import { useReauthGate } from '@/features/reauthenticate'
import { problemMessage } from '@/shared/api'
import { Button, Card, Checkbox, Input, Notice, Sheet, Text, fonts, radius, spacing, useTheme, useToast } from '@/shared/ui'

const REASONS = Object.keys(CLOSE_REASON_LABEL) as CloseReason[]

/** Closing for good (close-shop.md): irreversible, so it says what will happen first and asks for a recent sign-in. */
export function CloseShopCard() {
  const theme = useTheme()
  const toast = useToast()
  const close = useCloseShop()
  const gate = useReauthGate()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<CloseReason>('STOP_SELLING')
  const [text, setText] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = understood && (reason !== 'OTHER' || text.trim() !== '')

  const submit = () => {
    setError(null)
    const attempt = () =>
      close.mutate(
        { reason, reasonText: text.trim() || undefined },
        {
          onSuccess: () => {
            setOpen(false)
            toast.show('Cửa hàng đang đóng. Bạn vẫn hoàn tất các đơn đang làm.')
          },
          onError: (e) => {
            if (!gate.handle(e, attempt)) setError(problemMessage(e))
          },
        },
      )
    attempt()
  }

  return (
    <Card style={{ borderWidth: 1, borderColor: theme.danger }}>
      <Text variant="titleSm">Đóng cửa hàng</Text>
      <Text variant="bodySm" muted>
        Đóng hẳn cửa hàng, không mở lại được. Muốn bán lại phải mở một cửa hàng mới.
      </Text>
      <Button title="Đóng cửa hàng…" variant="destructive" onPress={() => setOpen(true)} />

      <Sheet visible={open} onClose={() => setOpen(false)} title="Đóng cửa hàng">
        <View style={styles.gap}>
          <Text variant="bodySm" muted>• Cửa hàng biến mất khỏi danh sách và không nhận đơn mới ngay khi bạn xác nhận.</Text>
          <Text variant="bodySm" muted>• Đơn đang làm vẫn làm tiếp; khiếu nại, kháng nghị đang mở vẫn xử lý; bạn vẫn xem được thu nhập.</Text>
          <Text variant="bodySm" muted>
            • Chỉ đóng hẳn khi không còn đơn, khiếu nại, kháng nghị, tiền bị giữ và số dư sổ cái về 0 (số dương được chi trả cho bạn; số âm bạn cần thanh toán hoặc được quản trị viên xử lý).
          </Text>
        </View>
        <Text variant="bodySm" style={{ fontFamily: fonts.semibold }}>Lý do</Text>
        <View style={styles.gap} accessibilityRole="radiogroup">
          {REASONS.map((r) => (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === r }}
              onPress={() => setReason(r)}
              style={[styles.reason, { borderColor: reason === r ? theme.primary : theme.divider, backgroundColor: reason === r ? theme.surfaceMuted : 'transparent' }]}
            >
              <Text variant="bodySm">{CLOSE_REASON_LABEL[r]}</Text>
            </Pressable>
          ))}
        </View>
        <Input label={reason === 'OTHER' ? 'Ghi rõ lý do' : 'Ghi chú thêm (không bắt buộc)'} multiline maxLength={500} value={text} onChangeText={setText} />
        <Checkbox checked={understood} onChange={setUnderstood}>
          Tôi hiểu rằng đóng cửa hàng là vĩnh viễn và không hoàn tác được.
        </Checkbox>
        <Notice tone="error" message={error} />
        <Button title="Đóng cửa hàng" variant="destructive" loading={close.isPending} disabled={!valid} onPress={submit} />
      </Sheet>
      {gate.sheet}
    </Card>
  )
}

const styles = StyleSheet.create({
  gap: { gap: spacing.xs },
  reason: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center' },
})
