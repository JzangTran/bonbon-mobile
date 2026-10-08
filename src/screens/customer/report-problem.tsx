import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useMyOrder } from '@/entities/order'
import { CASE_TYPE_LABEL, useIncidentQuote, useReportIncident, type IncidentType, type PickedPhoto } from '@/entities/order-case'
import { problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Screen, Text, radius, spacing, touchTarget, useTheme, useToast } from '@/shared/ui'

const TYPES: IncidentType[] = ['MISSING_ITEM', 'WRONG_ITEM', 'QUALITY']
const MAX_PHOTOS = 3

/** Report a missing item, a wrong item or a quality problem (report-order-incident.md): pick the lines, add photos, see the refund. */
export default function ReportProblemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const theme = useTheme()
  const toast = useToast()
  const order = useMyOrder(id, false)
  const report = useReportIncident(id)
  const [type, setType] = useState<IncidentType>('MISSING_ITEM')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [photos, setPhotos] = useState<PickedPhoto[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const items = order.data?.items ?? []
  const lines = items.flatMap((item) => (item.id && (quantities[item.id] ?? 0) > 0 ? [{ orderItemId: item.id, quantity: quantities[item.id] }] : []))
  const quote = useIncidentQuote(id, lines)
  const needsPhoto = type !== 'MISSING_ITEM'
  const ready = lines.length > 0 && (!needsPhoto || photos.length > 0)

  const change = (itemId: string, max: number, delta: number) =>
    setQuantities((q) => ({ ...q, [itemId]: Math.min(max, Math.max(0, (q[itemId] ?? 0) + delta)) }))

  const addPhotos = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    })
    if (picked.canceled) return
    setPhotos((current) => [...current, ...picked.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName }))].slice(0, MAX_PHOTOS))
  }

  const submit = () => {
    setError(null)
    report.mutate(
      { type, lines, photos, note },
      {
        onSuccess: () => {
          toast.show('Đã gửi báo cáo. Quán sẽ trả lời sớm.')
          router.back()
        },
        onError: (e) => setError(problemMessage(e, 'Không gửi được báo cáo lúc này. Hãy thử lại.')),
      },
    )
  }

  return (
    <Screen>
      <Text variant="headline">Báo vấn đề với đơn #{order.data?.number}</Text>
      <Text variant="bodySm" muted>
        Chọn loại vấn đề, các món bị ảnh hưởng và gửi kèm ảnh để quán và quản trị viên xem.
      </Text>

      <View style={styles.chips} accessibilityRole="tablist">
        {TYPES.map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: type === t }}
            onPress={() => setType(t)}
            style={[styles.chip, { borderColor: type === t ? theme.primary : theme.borderInput, backgroundColor: type === t ? theme.primarySubtle : theme.surface }]}
          >
            <Text variant="bodySm" color={type === t ? theme.onPrimarySubtle : theme.text}>
              {CASE_TYPE_LABEL[t]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <Text variant="titleSm">Món bị ảnh hưởng</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.flex}>
              <Text>{item.name}</Text>
              <Text variant="caption" muted>
                Đã đặt {item.quantity}
              </Text>
            </View>
            <View style={styles.stepper}>
              <Button title="−" variant="outline" accessibilityLabel={`Bớt ${item.name}`} onPress={() => change(item.id ?? '', item.quantity ?? 0, -1)} />
              <Text style={styles.count}>{quantities[item.id ?? ''] ?? 0}</Text>
              <Button title="+" variant="outline" accessibilityLabel={`Thêm ${item.name}`} onPress={() => change(item.id ?? '', item.quantity ?? 0, 1)} />
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text variant="titleSm">Ảnh {needsPhoto ? '(bắt buộc)' : '(nên có)'}</Text>
        <View style={styles.photos}>
          {photos.map((photo, index) => (
            <Pressable key={photo.uri} accessibilityLabel="Bỏ ảnh này" onPress={() => setPhotos(photos.filter((_, i) => i !== index))}>
              <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
            </Pressable>
          ))}
        </View>
        {photos.length < MAX_PHOTOS ? <Button title="Thêm ảnh" variant="outline" onPress={() => void addPhotos()} /> : null}
        <Text variant="caption" muted>
          Tối đa {MAX_PHOTOS} ảnh. Chạm vào ảnh để bỏ.
        </Text>
      </Card>

      <Input label="Ghi chú (không bắt buộc)" value={note} onChangeText={setNote} multiline maxLength={500} style={styles.note} />

      {lines.length > 0 ? (
        <Card>
          <Text variant="bodySm" muted>
            Nếu được chấp nhận, bạn được hoàn
          </Text>
          <Text variant="title">{quote.data ? formatVnd(quote.data.refundAmount) : '…'}</Text>
          <Text variant="caption" muted>
            Phí giao hàng không được hoàn trong trường hợp này.
          </Text>
        </Card>
      ) : null}
      {quote.isError ? <Notice tone="error" message={problemMessage(quote.error, 'Không tính được số tiền hoàn.')} /> : null}
      <Notice tone="error" message={error} />
      <Button title="Gửi báo cáo" size="lg" fullWidth disabled={!ready} loading={report.isPending} onPress={submit} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: touchTarget.min, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  count: { minWidth: 24, textAlign: 'center' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 88, height: 88, borderRadius: radius.sm },
  note: { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.sm },
})
