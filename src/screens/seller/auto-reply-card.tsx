import { useState } from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import { useAutoReply, useSaveAutoReply } from '@/entities/chat'
import { problemMessage } from '@/shared/api'
import { Button, Card, Input, Notice, Text, spacing, useTheme, useFeedback } from '@/shared/ui'

/**
 * The one message the shop sends by itself when a customer writes and nobody has answered yet (configure-auto-reply.md). On by default
 * with a starter text; the customer sees it with an "auto-reply" label.
 */
export function AutoReplyCard() {
  const theme = useTheme()
  const feedback = useFeedback()
  const current = useAutoReply()
  const save = useSaveAutoReply()
  const [draft, setDraft] = useState<string | null>(null)
  if (!current.data) return null
  const message = draft ?? current.data.message ?? ''
  const changed = draft !== null && draft.trim() !== (current.data.message ?? '')
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="titleSm">Trả lời tự động</Text>
          <Text variant="bodySm" muted>
            Gửi một lần khi khách nhắn mà quán chưa trả lời.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Bật trả lời tự động"
          value={!!current.data.enabled}
          disabled={save.isPending}
          onValueChange={(enabled) => save.mutate({ enabled })}
          trackColor={{ true: theme.primary }}
        />
      </View>
      {current.data.enabled ? (
        <>
          <Input label="Nội dung" value={message} onChangeText={setDraft} maxLength={1000} multiline />
          <Button
            title="Lưu"
            variant="outline"
            disabled={!changed || !message.trim()}
            loading={save.isPending}
            onPress={() => save.mutate({ message: message.trim() }, { onSuccess: () => { setDraft(null); feedback.success('Đã lưu tin trả lời tự động. Khách nhắn khi quán chưa trả lời sẽ nhận tin này.') } })}
          />
        </>
      ) : null}
      {save.isError ? <Notice tone="error" message={problemMessage(save.error)} /> : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
})
