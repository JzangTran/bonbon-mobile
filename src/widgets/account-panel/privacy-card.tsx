import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { api, problemMessage } from '@/shared/api'
import { Button, Card, Input, Notice, Sheet, Text, radius, spacing, useTheme, useFeedback } from '@/shared/ui'

const TYPES = [
  { id: 'CORRECT', label: 'Sửa dữ liệu', hint: 'Thông tin sai mà bạn không tự sửa được.' },
  { id: 'WITHDRAW', label: 'Rút lại đồng ý', hint: 'Thôi đồng ý cho một mục đích xử lý dữ liệu.' },
  { id: 'RESTRICT', label: 'Hạn chế xử lý', hint: 'Tạm ngưng dùng một phần dữ liệu.' },
  { id: 'OBJECT', label: 'Phản đối xử lý', hint: 'Không muốn dữ liệu dùng cho một việc cụ thể.' },
] as const
const TYPE_LABEL: Record<string, string> = { ACCESS: 'Tải dữ liệu', CORRECT: 'Sửa dữ liệu', WITHDRAW: 'Rút lại đồng ý', RESTRICT: 'Hạn chế xử lý', OBJECT: 'Phản đối xử lý' }
const STATUS_LABEL: Record<string, string> = { RECEIVED: 'Đã nhận', IN_PROGRESS: 'Đang xử lý', COMPLETED: 'Hoàn thành', REJECTED: 'Từ chối' }
const day = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' })

/**
 * Personal data (data-subject-requests.md): a copy of everything at once, a short request for what needs a person, and the history
 * with deadlines. The same order as the privacy pages of Grab and Shopee: self-service first.
 */
export function PrivacyCard() {
  const theme = useTheme()
  const feedback = useFeedback()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<(typeof TYPES)[number]['id']>('CORRECT')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const history = useQuery({
    queryKey: ['account', 'data-requests'],
    queryFn: async () => {
      const { data, error: e } = await api.GET('/api/me/data-requests')
      if (e || !data) throw e
      return data
    },
  })
  const exportNow = useMutation({
    mutationFn: async () => {
      const { data, error: e } = await api.POST('/api/me/data-export', {})
      if (e || !data) throw e
      return data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['account', 'data-requests'] })
      if (data.downloadUrl) void Linking.openURL(data.downloadUrl)
    },
    onError: (e) => feedback.error(e),
  })
  const ask = useMutation({
    mutationFn: async () => {
      const { data, error: e } = await api.POST('/api/me/data-requests', { body: { type, details: details.trim() } })
      if (e || !data) throw e
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['account', 'data-requests'] })
      setOpen(false)
      setDetails('')
      feedback.success('Đã gửi yêu cầu về dữ liệu. Bạn nhận phản hồi qua email trong 2 ngày làm việc.')
    },
    onError: (e) => setError(problemMessage(e)),
  })

  return (
    <Card>
      <Text variant="title">Quyền riêng tư</Text>
      <Text variant="bodySm" muted>
        Tải bản sao dữ liệu bonbon lưu về bạn (mỗi giờ một lần), hoặc gửi yêu cầu sửa, rút lại đồng ý, hạn chế hay phản đối xử lý.
      </Text>
      <View style={styles.row}>
        <Button title={exportNow.isPending ? 'Đang tạo tệp…' : 'Tải dữ liệu'} onPress={() => exportNow.mutate()} disabled={exportNow.isPending} />
        <Button title="Gửi yêu cầu" variant="outline" onPress={() => setOpen(true)} />
      </View>
      {(history.data ?? []).slice(0, 5).map((r) => (
        <View key={r.id} style={[styles.item, { borderColor: theme.divider }]}>
          <View style={styles.itemHead}>
            <Text variant="body">{TYPE_LABEL[r.type ?? ''] ?? r.type}</Text>
            <Text variant="caption" muted>{STATUS_LABEL[r.status ?? '']}</Text>
          </View>
          <Text variant="caption" muted>
            Gửi {r.receivedAt ? day.format(new Date(r.receivedAt)) : ''}
            {r.status === 'RECEIVED' || r.status === 'IN_PROGRESS' ? ` · hạn ${r.dueAt ? day.format(new Date(r.dueAt)) : ''}` : ''}
          </Text>
          {r.responseNote && r.type !== 'ACCESS' ? <Text variant="bodySm">Trả lời: {r.responseNote}</Text> : null}
          {r.downloadUrl ? (
            <Pressable accessibilityRole="link" onPress={() => r.downloadUrl && void Linking.openURL(r.downloadUrl)}>
              <Text variant="bodySm" style={{ color: theme.primary }}>Tải tệp</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      <Sheet visible={open} onClose={() => setOpen(false)} title="Yêu cầu về dữ liệu">
        {TYPES.map((o) => (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: type === o.id }}
            onPress={() => setType(o.id)}
            style={[styles.option, { borderColor: type === o.id ? theme.primary : theme.border, backgroundColor: type === o.id ? theme.primarySubtle : 'transparent' }]}
          >
            <Text variant="body">{o.label}</Text>
            <Text variant="caption" muted>{o.hint}</Text>
          </Pressable>
        ))}
        <Input label="Mô tả yêu cầu" multiline maxLength={2000} value={details} onChangeText={setDetails} />
        <Notice tone="error" message={error} />
        <Button
          title="Gửi yêu cầu"
          fullWidth
          disabled={ask.isPending}
          onPress={() => {
            if (details.trim().length < 10) return setError('Mô tả ít nhất 10 ký tự để quản trị viên hiểu yêu cầu.')
            setError(null)
            ask.mutate()
          }}
        />
      </Sheet>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  item: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm, gap: 2 },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between' },
  option: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.md, gap: 2 },
})
