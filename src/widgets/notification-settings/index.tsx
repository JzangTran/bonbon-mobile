import { Lock } from 'lucide-react-native'
import { useState } from 'react'
import { StyleSheet, Switch, View } from 'react-native'
import { useNotificationPreferences, usePushDevices, useRemoveDevice, useSetQuietHours, useUpdatePreference } from '@/entities/notification-settings'
import { problemMessage } from '@/shared/api'
import { formatAgo } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Text, spacing, useTheme } from '@/shared/ui'

const CHANNEL_LABEL: Record<string, string> = { PUSH: 'Thông báo đẩy', EMAIL: 'Email' }

/** What reaches the person where (manage-notification-preferences.md). Order alerts and security notices are locked on. */
export function NotificationSettings() {
  const theme = useTheme()
  const prefs = useNotificationPreferences()
  const update = useUpdatePreference()
  const settings = prefs.data

  return (
    <View style={styles.list}>
      <Text variant="bodySm" muted>
        Tắt một kênh chỉ ngăn thông báo đến máy bạn; mọi thông báo vẫn nằm trong danh sách trong ứng dụng.
      </Text>
      {prefs.isError ? <Notice tone="error" message={problemMessage(prefs.error, 'Không tải được cài đặt lúc này.')} /> : null}
      {(settings?.categories ?? []).map((c) => (
        <Card key={c.category}>
          <View style={styles.row}>
            <Text variant="titleSm" style={styles.flex}>
              {c.title}
            </Text>
            {c.locked ? <Lock size={16} color={theme.textMuted} accessibilityLabel="Không tắt được" /> : null}
          </View>
          <Text variant="bodySm" muted>
            {c.description}
          </Text>
          {(c.channels ?? []).map((ch) => (
            <View key={ch.channel} style={styles.row}>
              <Text style={styles.flex}>{CHANNEL_LABEL[ch.channel ?? ''] ?? ch.channel}</Text>
              <Switch
                accessibilityLabel={`${c.title}: ${CHANNEL_LABEL[ch.channel ?? ''] ?? ch.channel}`}
                value={!!ch.enabled}
                disabled={c.locked || update.isPending}
                onValueChange={(enabled) => update.mutate({ category: c.category ?? '', channel: ch.channel as 'PUSH' | 'EMAIL', enabled })}
                trackColor={{ true: theme.primary }}
              />
            </View>
          ))}
        </Card>
      ))}
      {settings ? <QuietHours key={`${settings.quietHours?.start}-${settings.quietHours?.end}`} start={settings.quietHours?.start} end={settings.quietHours?.end} /> : null}
      <Devices />
    </View>
  )
}

function QuietHours({ start, end }: { start?: string; end?: string }) {
  const set = useSetQuietHours()
  const [from, setFrom] = useState(start ?? '22:00')
  const [to, setTo] = useState(end ?? '06:00')
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(from) && /^([01]\d|2[0-3]):[0-5]\d$/.test(to) && from !== to

  return (
    <Card>
      <Text variant="titleSm">Giờ yên lặng</Text>
      <Text variant="bodySm" muted>
        Trong khung giờ này thông báo đẩy của các nhóm tắt được được giữ lại. Đơn mới và thông báo bảo mật vẫn đến ngay. Nhập dạng HH:mm, giờ Việt Nam.
      </Text>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Input label="Từ" value={from} onChangeText={setFrom} placeholder="22:00" maxLength={5} keyboardType="numbers-and-punctuation" />
        </View>
        <View style={styles.flex}>
          <Input label="Đến" value={to} onChangeText={setTo} placeholder="06:00" maxLength={5} keyboardType="numbers-and-punctuation" />
        </View>
      </View>
      <View style={styles.row}>
        <Button title="Lưu" disabled={!valid} loading={set.isPending} onPress={() => set.mutate({ start: from, end: to })} />
        {start ? <Button title="Bỏ giờ yên lặng" variant="outline" disabled={set.isPending} onPress={() => set.mutate({})} /> : null}
      </View>
    </Card>
  )
}

function Devices() {
  const devices = usePushDevices()
  const remove = useRemoveDevice()
  const items = devices.data?.items ?? []
  return (
    <Card>
      <Text variant="titleSm">Thiết bị nhận thông báo đẩy</Text>
      <Text variant="bodySm" muted>
        Gỡ máy đã mất hoặc không còn dùng. Máy bị gỡ nhận lại thông báo khi bạn đăng nhập lại trên đó.
      </Text>
      {devices.data && items.length === 0 ? <Text muted>Chưa có thiết bị nào.</Text> : null}
      {items.map((d) => (
        <View key={d.id} style={styles.row}>
          <Text variant="bodySm" style={styles.flex}>
            {d.platform === 'IOS' ? 'iPhone' : d.platform === 'ANDROID' ? 'Android' : 'Trình duyệt'} · dùng {formatAgo(d.lastSeenAt)}
          </Text>
          <Button title="Gỡ" variant="outline" disabled={remove.isPending} onPress={() => d.id && remove.mutate(d.id)} />
        </View>
      ))}
    </Card>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
})
