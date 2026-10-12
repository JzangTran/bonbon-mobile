import { Button, Text } from '@/shared/ui'
import { formatDateTime } from '@/shared/lib/format'
import { BlockingScreen } from './blocking-screen'

/** The system is in full maintenance (maintenance-mode.md): the message and the expected end; the gate checks again by itself and lets the person back in. */
export function MaintenanceScreen({ message, endsAt, checking, onRetry }: { message?: string; endsAt?: string; checking: boolean; onRetry: () => void }) {
  return (
    <BlockingScreen>
      <Text variant="headline">Bonbon đang bảo trì</Text>
      <Text muted>{message || 'Hệ thống đang được bảo trì. Bạn vui lòng quay lại sau ít phút.'}</Text>
      {endsAt ? <Text>Dự kiến xong lúc {formatDateTime(endsAt)}.</Text> : null}
      <Text variant="caption" muted>
        Ứng dụng tự kiểm tra lại và mở khi bảo trì xong.
      </Text>
      <Button title="Thử lại ngay" variant="outline" loading={checking} onPress={onRetry} />
    </BlockingScreen>
  )
}
