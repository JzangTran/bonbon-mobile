import * as ImagePicker from 'expo-image-picker'
import { CornerUpLeft, ImagePlus, Send, X } from 'lucide-react-native'
import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMarkRead, useSendMessage, useShopConversation, useThread, type ChatMessage, type PickedImage } from '@/entities/chat'
import { problemMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib/format'
import { Button, Notice, Text, fonts, radius, spacing, touchTarget, typography, useTheme } from '@/shared/ui'

type Props = {
  /** An existing conversation; a customer opening a shop's chat for the first time passes {@code vendorId} instead. */
  conversationId?: string | null
  vendorId?: string
  /** Whether the live socket is up; when it is not, the thread polls. */
  live: boolean
  /** Reserve the status-bar space (screens without a navigation header). */
  topInset?: boolean
  header?: ReactNode
}

/** One conversation: newest message at the bottom, older ones on demand, a composer with one image and reply-to (send-message.md). */
export function ChatThread({ conversationId: given, vendorId, live, topInset = false, header }: Props) {
  const theme = useTheme()
  const existing = useShopConversation(given ? undefined : vendorId)
  const conversationId = given ?? existing.data?.id ?? null
  const thread = useThread(conversationId, live)
  const markRead = useMarkRead()
  const send = useSendMessage({ conversationId, vendorId })
  const [text, setText] = useState('')
  const [image, setImage] = useState<PickedImage | null>(null)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const messages = thread.data?.pages.flatMap((p) => p.items ?? []) ?? []
  const newest = messages[0]?.id

  // Opening a conversation, and every new message while it is open, marks it read.
  useEffect(() => {
    if (conversationId && newest) markRead.mutate(conversationId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, newest])

  const pickImage = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
    if (picked.canceled) return
    const a = picked.assets[0]
    setImage({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName })
  }

  const submit = () => {
    if (!text.trim() && !image) return
    send.mutate(
      { text, image, replyToMessageId: replyTo?.id },
      {
        onSuccess: () => {
          setText('')
          setImage(null)
          setReplyTo(null)
        },
      },
    )
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={topInset ? ['top'] : []}>
      {header}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {thread.isError ? <Notice tone="error" message={problemMessage(thread.error, 'Không tải được tin nhắn lúc này.')} /> : null}
        {conversationId && thread.isPending ? <ActivityIndicator style={styles.loading} color={theme.primary} /> : null}
        {!conversationId && !existing.isPending ? (
          <View style={styles.empty}>
            <Text muted style={styles.center}>
              Chưa có tin nhắn nào. Hỏi quán về món, thời gian hoặc địa chỉ giao.
            </Text>
          </View>
        ) : null}
        <FlatList
          // Newest first, so the list is inverted and the latest message sits next to the composer.
          inverted
          data={messages}
          keyExtractor={(m) => m.id ?? ''}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            thread.hasNextPage ? (
              <Button title="Tải tin cũ hơn" variant="ghost" loading={thread.isFetchingNextPage} onPress={() => void thread.fetchNextPage()} />
            ) : null
          }
          renderItem={({ item }) => <Bubble message={item} onReply={() => setReplyTo(item)} />}
        />
        <View style={[styles.composer, { borderTopColor: theme.divider, backgroundColor: theme.surface }]}>
          {replyTo ? (
            <Chip label={`Trả lời: ${replyTo.text || 'Ảnh'}`} onClear={() => setReplyTo(null)} />
          ) : null}
          {image ? (
            <View style={styles.preview}>
              <Image source={{ uri: image.uri }} style={styles.thumb} accessibilityLabel="Ảnh sẽ gửi" />
              <Pressable accessibilityRole="button" accessibilityLabel="Bỏ ảnh" onPress={() => setImage(null)} hitSlop={8}>
                <X size={18} color={theme.textMuted} />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Đính kèm ảnh" style={styles.iconButton} onPress={() => void pickImage()}>
              <ImagePlus size={22} color={theme.primary} />
            </Pressable>
            <TextInput
              accessibilityLabel="Tin nhắn"
              value={text}
              onChangeText={setText}
              placeholder="Nhập tin nhắn…"
              placeholderTextColor={theme.textMuted}
              maxLength={1000}
              multiline
              style={[styles.input, typography.body, { borderColor: theme.borderInput, color: theme.text, backgroundColor: theme.background }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gửi"
              accessibilityState={{ disabled: send.isPending || (!text.trim() && !image) }}
              disabled={send.isPending || (!text.trim() && !image)}
              style={[styles.iconButton, { opacity: send.isPending || (!text.trim() && !image) ? 0.4 : 1 }]}
              onPress={submit}
            >
              <Send size={22} color={theme.primary} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Bubble({ message: m, onReply }: { message: ChatMessage; onReply: () => void }) {
  const theme = useTheme()
  const mine = !!m.mine
  return (
    <View style={[styles.bubbleRow, { alignItems: mine ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.bubble, { backgroundColor: mine ? theme.primary : theme.surfaceMuted }]}>
        {m.replyTo ? (
          <Text variant="caption" color={mine ? theme.onPrimary : theme.textMuted} numberOfLines={2} style={styles.quote}>
            {m.replyTo.text || (m.replyTo.hasImage ? 'Ảnh' : '')}
          </Text>
        ) : null}
        {m.imageUrl ? <Image source={{ uri: m.imageUrl }} style={styles.photo} accessibilityLabel="Ảnh đính kèm" /> : null}
        {m.text ? <Text color={mine ? theme.onPrimary : theme.text}>{m.text}</Text> : null}
      </View>
      <View style={styles.meta}>
        <Text variant="caption" muted>
          {formatDateTime(m.createdAt)}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Trả lời tin này" onPress={onReply} hitSlop={8} style={styles.replyButton}>
          <CornerUpLeft size={12} color={theme.textMuted} />
          <Text variant="caption" muted>
            Trả lời
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  const theme = useTheme()
  return (
    <View style={[styles.chip, { backgroundColor: theme.surfaceMuted }]}>
      <Text variant="caption" numberOfLines={1} style={styles.flex}>
        {label}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Bỏ trả lời" onPress={onClear} hitSlop={8}>
        <X size={16} color={theme.textMuted} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  loading: { marginTop: spacing.lg },
  empty: { padding: spacing.lg },
  center: { textAlign: 'center' },
  list: { padding: spacing.md, gap: spacing.md },
  bubbleRow: { gap: 2 },
  bubble: { maxWidth: '85%', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  quote: { opacity: 0.85 },
  photo: { width: 200, height: 160, borderRadius: radius.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  replyButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.sm, gap: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  input: { flex: 1, minHeight: touchTarget.min, maxHeight: 120, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.md, fontFamily: fonts.regular },
  iconButton: { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
})
