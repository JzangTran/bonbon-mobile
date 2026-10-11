import * as ImagePicker from 'expo-image-picker'
import { ImagePlus, X } from 'lucide-react-native'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import { TICKET_STATUS_LABEL, useCloseTicket, useMyTicket, useMyTickets, useOpenTicket, useReplyTicket, type PickedImage } from '@/entities/support-ticket'
import { problemMessage } from '@/shared/api'
import { formatAgo, formatDateTime } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Text, radius, spacing, useTheme } from '@/shared/ui'

const MAX_IMAGES = 3

/** The person's tickets, newest activity first, with a form to open a new one (support-tickets.md). */
export function TicketList({ onOpen }: { onOpen: (id: string) => void }) {
  const tickets = useMyTickets()
  const [writing, setWriting] = useState(false)
  const items = tickets.data?.items ?? []

  return (
    <View style={styles.list}>
      {writing ? (
        <NewTicket
          onDone={(id) => {
            setWriting(false)
            onOpen(id)
          }}
          onCancel={() => setWriting(false)}
        />
      ) : (
        <Button title="Gửi phiếu mới" onPress={() => setWriting(true)} />
      )}
      {tickets.isError ? <Notice tone="error" message={problemMessage(tickets.error, 'Không tải được phiếu lúc này.')} /> : null}
      {tickets.data && items.length === 0 ? (
        <Card>
          <Text muted>Bạn chưa gửi phiếu nào.</Text>
        </Card>
      ) : null}
      {items.map((t) => (
        <Pressable key={t.id} accessibilityRole="button" onPress={() => t.id && onOpen(t.id)}>
          <Card>
            <Text variant="titleSm">{t.subject}</Text>
            <Text variant="bodySm" muted>
              {TICKET_STATUS_LABEL[t.status ?? ''] ?? t.status}
              {t.orderNumber ? ` · đơn #${t.orderNumber}` : ''} · {formatAgo(t.updatedAt)}
            </Text>
          </Card>
        </Pressable>
      ))}
    </View>
  )
}

function NewTicket({ onDone, onCancel, orderId }: { onDone: (id: string) => void; onCancel: () => void; orderId?: string }) {
  const open = useOpenTicket()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [images, setImages] = useState<PickedImage[]>([])
  const [error, setError] = useState<string | null>(null)

  return (
    <Card>
      <Text variant="titleSm">Gửi phiếu hỗ trợ</Text>
      <Text variant="bodySm" muted>
        Vấn đề về một đơn đã giao hãy báo ngay trên đơn đó để được xử lý nhanh hơn.
      </Text>
      <Input label="Tiêu đề" value={subject} onChangeText={setSubject} maxLength={150} />
      <Input label="Nội dung" value={message} onChangeText={setMessage} maxLength={2000} multiline numberOfLines={5} style={styles.multiline} />
      <ImageStrip images={images} onChange={setImages} />
      <Notice tone="error" message={error} />
      <View style={styles.buttons}>
        <Button
          title="Gửi phiếu"
          loading={open.isPending}
          disabled={!subject.trim() || !message.trim()}
          onPress={() => {
            setError(null)
            open.mutate(
              { subject, message, orderId, images },
              { onSuccess: (t) => onDone(t.id ?? ''), onError: (e) => setError(problemMessage(e, 'Không gửi được phiếu lúc này.')) },
            )
          }}
        />
        <Button title="Huỷ" variant="ghost" onPress={onCancel} />
      </View>
    </Card>
  )
}

/** One ticket: the whole thread, then a box to write again and a way to close it. */
export function TicketThread({ id }: { id: string }) {
  const theme = useTheme()
  const ticket = useMyTicket(id)
  const reply = useReplyTicket(id)
  const close = useCloseTicket(id)
  const [body, setBody] = useState('')
  const [images, setImages] = useState<PickedImage[]>([])
  const t = ticket.data

  return (
    <View style={styles.list}>
      {ticket.isError ? <Notice tone="error" message={problemMessage(ticket.error, 'Không tải được phiếu lúc này.')} /> : null}
      {t ? (
        <>
          <Text variant="headline">{t.subject}</Text>
          <Text variant="bodySm" muted>
            {TICKET_STATUS_LABEL[t.status ?? ''] ?? t.status}
            {t.orderNumber ? ` · đơn #${t.orderNumber}` : ''}
            {t.closedBy === 'SYSTEM' ? ' · tự đóng vì không có tin nhắn mới' : ''}
          </Text>
          {(t.messages ?? []).map((m) => {
            const support = m.author === 'SUPPORT'
            return (
              <View key={m.id} style={[styles.messageRow, { alignItems: support ? 'flex-start' : 'flex-end' }]}>
                <View style={[styles.message, { backgroundColor: support ? theme.primarySubtle : theme.surfaceMuted }]}>
                  <Text variant="caption" muted>
                    {support ? 'Hỗ trợ Bonbon' : 'Bạn'}
                  </Text>
                  <Text>{m.body}</Text>
                  {(m.attachments ?? []).map((a) => (
                    <Image key={a.key} source={{ uri: a.url }} style={styles.photo} accessibilityLabel="Ảnh đính kèm" />
                  ))}
                </View>
                <Text variant="caption" muted>
                  {formatDateTime(m.createdAt)}
                </Text>
              </View>
            )
          })}
          {t.status !== 'CLOSED' ? (
            <Card>
              <Input label="Nhắn thêm" value={body} onChangeText={setBody} maxLength={2000} multiline numberOfLines={4} style={styles.multiline} />
              <ImageStrip images={images} onChange={setImages} />
              <View style={styles.buttons}>
                <Button
                  title="Gửi"
                  loading={reply.isPending}
                  disabled={!body.trim()}
                  onPress={() =>
                    reply.mutate(
                      { body, images },
                      {
                        onSuccess: () => {
                          setBody('')
                          setImages([])
                        },
                      },
                    )
                  }
                />
                <Button title="Đóng phiếu" variant="outline" loading={close.isPending} onPress={() => close.mutate()} />
              </View>
            </Card>
          ) : (
            <Card>
              <Text muted>Phiếu đã đóng. Cần hỗ trợ thêm thì gửi phiếu mới.</Text>
            </Card>
          )}
        </>
      ) : null}
    </View>
  )
}

function ImageStrip({ images, onChange }: { images: PickedImage[]; onChange: (images: PickedImage[]) => void }) {
  const theme = useTheme()
  const add = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_IMAGES - images.length, quality: 0.7 })
    if (picked.canceled) return
    onChange([...images, ...picked.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName }))].slice(0, MAX_IMAGES))
  }
  return (
    <View style={styles.strip}>
      {images.map((image, i) => (
        <View key={`${image.uri}-${i}`}>
          <Image source={{ uri: image.uri }} style={styles.thumb} accessibilityLabel="Ảnh sẽ gửi" />
          <Pressable accessibilityRole="button" accessibilityLabel="Bỏ ảnh" hitSlop={8} style={[styles.remove, { backgroundColor: theme.surface }]} onPress={() => onChange(images.filter((_, j) => j !== i))}>
            <X size={14} color={theme.text} />
          </Pressable>
        </View>
      ))}
      {images.length < MAX_IMAGES ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Đính kèm ảnh" style={[styles.add, { borderColor: theme.borderInput }]} onPress={() => void add()}>
          <ImagePlus size={22} color={theme.primary} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  buttons: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  messageRow: { gap: 2 },
  message: { maxWidth: '90%', borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  photo: { width: 200, height: 150, borderRadius: radius.sm },
  strip: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  remove: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  add: { width: 64, height: 64, borderRadius: radius.sm, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
})
