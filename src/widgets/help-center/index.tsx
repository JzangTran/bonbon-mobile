import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useHelpArticles } from '@/entities/help'
import { problemMessage } from '@/shared/api'
import { Button, Card, Input, Notice, Text, spacing, useTheme } from '@/shared/ui'

/** Articles written by the Bonbon team for the role in use, searchable (browse-help-center.md); the last row leads to a ticket. */
export function HelpCenter({ onContact }: { onContact: () => void }) {
  const theme = useTheme()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const articles = useHelpArticles(q)
  const items = articles.data?.items ?? []

  return (
    <View style={styles.list}>
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

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
})
