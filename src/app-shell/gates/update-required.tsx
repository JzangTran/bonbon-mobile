import { Linking } from 'react-native'
import { Button, Text } from '@/shared/ui'
import { BlockingScreen } from './blocking-screen'

/** This build is older than the minimum the server serves (force-update.md): nothing works until the store version is installed. */
export function UpdateRequiredScreen({ storeUrl, message }: { storeUrl?: string; message?: string }) {
  return (
    <BlockingScreen>
      <Text variant="headline">Cần cập nhật ứng dụng</Text>
      <Text muted>{message || 'Phiên bản bonbon bạn đang dùng đã cũ và không còn được hỗ trợ. Hãy cập nhật để tiếp tục.'}</Text>
      {storeUrl ? <Button title="Cập nhật trên cửa hàng ứng dụng" size="lg" fullWidth onPress={() => Linking.openURL(storeUrl)} /> : null}
      {!storeUrl ? <Text variant="bodySm" muted>Hãy mở cửa hàng ứng dụng trên điện thoại và tìm “bonbon” để cập nhật.</Text> : null}
    </BlockingScreen>
  )
}
