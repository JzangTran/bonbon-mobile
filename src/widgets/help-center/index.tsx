import { Bot, ChevronDown, ChevronUp } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useHelpArticles } from '@/entities/help'
import { api, problemMessage, type components } from '@/shared/api'
import { useMutation } from '@tanstack/react-query'
import { Button, Card, Input, Notice, Text, spacing, touchTarget, useTheme } from '@/shared/ui'

/** Articles written by the Bonbon team for the role in use, searchable (browse-help-center.md); the last row leads to a ticket. */
export function HelpCenter({ onContact }: { onContact: () => void }) {
  const theme = useTheme()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const articles = useHelpArticles(q)
  const items = articles.data?.items ?? []

  return (
    <View style={styles.list}>
      <AskBox onOpen={setOpen} />
      <Input label="Tìm trong trợ giúp" value={q} onChangeText={setQ} placeholder="Ví dụ: hoàn tiền" returnKeyType="search" />
      {articles.isError ? <Notice tone="error" message={problemMessage(articles.error, 'Không tải được trợ giúp lúc này.')} /> : null}
      {articles.data && items.length === 0 ? (
        <Card>
          <Text muted>Không có bài nào khớp. Thử từ khác, hoặc gửi câu hỏi cho đội hỗ trợ.</Text>
        </Card>
      ) : null}
      {items.map((a) => {
        const expanded = open === a.id
        return (
          <Card key={a.id}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setOpen(expanded ? null : (a.id ?? null))} style={styles.row}>
              <Text variant="titleSm" style={styles.flex}>
                {a.title}
              </Text>
              {expanded ? <ChevronUp size={20} color={theme.textMuted} /> : <ChevronDown size={20} color={theme.textMuted} />}
            </Pressable>
            {expanded ? <Text variant="bodySm">{a.body}</Text> : null}
          </Card>
        )
      })}
      <Button title="Liên hệ hỗ trợ" variant="outline" onPress={onContact} />
    </View>
  )
}

type Answer = components['schemas']['HelpChatAnswer']

/**
 * Ask one question and get the matching help article (chat-with-chatbot.md). Rule-based, with no language model: each answer is an
 * article the team wrote, and every question is answered on its own.
 */
function AskBox({ onOpen }: { onOpen: (id: string) => void }) {
  const theme = useTheme()
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState<{ question: string; answer: Answer } | null>(null)
  const ask = useMutation({
    mutationFn: async (q: string) => {
      const { data, error } = await api.POST('/api/help-articles/ask', { body: { question: q } })
      if (error || !data) throw error
      return data
    },
    onSuccess: (answer, q) => {
      setAsked({ question: q, answer })
      setQuestion('')
    },
  })
  return (
    <Card>
      <View style={styles.row}>
        <Bot size={20} color={theme.primary} />
        <Text variant="titleSm" style={styles.flex}>
          Hỏi nhanh
        </Text>
      </View>
      <Text variant="caption" muted>
        Trả lời tự động từ các bài trợ giúp. Mỗi câu hỏi được trả lời riêng, không nhớ câu trước.
      </Text>
      <Input label="Câu hỏi của bạn" value={question} onChangeText={setQuestion} maxLength={300} placeholder="Ví dụ: khi nào được hoàn tiền?" returnKeyType="send"
        onSubmitEditing={() => question.trim().length >= 2 && ask.mutate(question.trim())} />
      <Button title="Hỏi" variant="outline" disabled={question.trim().length < 2} loading={ask.isPending} onPress={() => ask.mutate(question.trim())} />
      {ask.isError ? <Notice tone="error" message={problemMessage(ask.error)} /> : null}
      {asked ? (
        <View style={[styles.answer, { backgroundColor: theme.surfaceMuted }]} accessibilityLiveRegion="polite">
          <Text variant="caption" muted>
            Bạn hỏi: {asked.question}
          </Text>
          {asked.answer.matched ? <Text variant="titleSm">{asked.answer.title}</Text> : null}
          <Text variant="bodySm">{asked.answer.answer}</Text>
          {(asked.answer.suggestions ?? []).map((sug) => (
            <Pressable key={sug.articleId} accessibilityRole="link" onPress={() => onOpen(sug.articleId ?? '')} hitSlop={6}>
              <Text variant="bodySm" color={theme.primary}>
                {sug.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  answer: { borderRadius: 12, padding: spacing.md, gap: spacing.xs },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touchTarget.min },
  flex: { flex: 1 },
})
