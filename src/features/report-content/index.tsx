import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { api, problemMessage } from '@/shared/api'
import { Button, Input, Notice, Sheet, Text, radius, spacing, touchTarget, useTheme, useFeedback } from '@/shared/ui'

export type ReportTarget = { type: 'SHOP' | 'MESSAGE' | 'REVIEW' | 'REVIEW_RESPONSE'; id: string }
type Reason = 'SPAM' | 'OFFENSIVE' | 'SCAM_OR_FRAUD' | 'INAPPROPRIATE_IMAGE' | 'FALSE_INFORMATION' | 'OTHER'

const REASONS: { id: Reason; label: string; hint: string }[] = [
  { id: 'OFFENSIVE', label: 'Xúc phạm, quấy rối', hint: 'Lời lẽ thô tục, đe doạ, kỳ thị.' },
  { id: 'SCAM_OR_FRAUD', label: 'Lừa đảo', hint: 'Đòi trả tiền hay liên hệ ngoài ứng dụng.' },
  { id: 'SPAM', label: 'Tin rác, quảng cáo', hint: 'Gửi lặp lại hoặc không liên quan.' },
  { id: 'INAPPROPRIATE_IMAGE', label: 'Hình ảnh không phù hợp', hint: 'Ảnh phản cảm hoặc không liên quan.' },
  { id: 'FALSE_INFORMATION', label: 'Thông tin sai sự thật', hint: 'Giá, món, hoặc đánh giá không đúng thực tế.' },
  { id: 'OTHER', label: 'Lý do khác', hint: 'Ghi rõ bên dưới.' },
]

/**
 * Report a shop, a message, a review or a reply (report-content.md): one reason, an optional note (required for "other"). The content
 * stays visible until an administrator decides; the person reported does not learn who reported them.
 */
export function ReportSheet({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const theme = useTheme()
  const feedback = useFeedback()
  const [reason, setReason] = useState<Reason | null>(null)
  const [note, setNote] = useState('')
  const send = useMutation({
    mutationFn: async () => {
      if (!target || !reason) return null
      const { data, error } = await api.POST('/api/reports', {
        body: { targetType: target.type, targetId: target.id, reasonCode: reason, note: note.trim() || undefined },
      })
      if (error || !data) throw error
      return data
    },
    onSuccess: (data) => {
      feedback.success(data?.alreadyReported ? 'Bạn đã báo cáo nội dung này rồi. Chúng tôi đang xem xét.' : 'Cảm ơn bạn. Chúng tôi sẽ xem xét trong vòng 24 giờ.')
      setReason(null)
      setNote('')
      onClose()
    },
  })
  const needsNote = reason === 'OTHER' && note.trim() === ''

  return (
    <Sheet visible={!!target} onClose={onClose} title="Báo cáo vi phạm">
      <View style={styles.body}>
        <Text variant="bodySm" muted>
          Báo cáo được gửi tới quản trị viên bonbon. Người bị báo cáo không biết ai đã báo cáo.
        </Text>
        <View accessibilityRole="radiogroup" style={styles.reasons}>
          {REASONS.map((r) => {
            const selected = reason === r.id
            return (
              <Pressable
                key={r.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setReason(r.id)}
                style={[styles.reason, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primarySubtle : theme.surface }]}
              >
                <View style={styles.flex}>
                  <Text variant="body">{r.label}</Text>
                  <Text variant="caption" muted>
                    {r.hint}
                  </Text>
                </View>
                {selected ? <Check size={18} color={theme.primary} /> : null}
              </Pressable>
            )
          })}
        </View>
        <Input
          label={reason === 'OTHER' ? 'Mô tả (bắt buộc)' : 'Mô tả thêm (không bắt buộc)'}
          value={note}
          onChangeText={setNote}
          maxLength={500}
          multiline
        />
        {send.isError ? <Notice tone="error" message={problemMessage(send.error)} /> : null}
        <Button title="Gửi báo cáo" disabled={!reason || needsNote} loading={send.isPending} onPress={() => send.mutate()} />
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, paddingBottom: spacing.lg },
  reasons: { gap: spacing.sm },
  reason: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, minHeight: touchTarget.min },
  flex: { flex: 1 },
})
