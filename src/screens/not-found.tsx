import { Link } from 'expo-router'
import { View } from 'react-native'
import { EmptyState, Screen, Text, useTheme } from '@/shared/ui'

/** A link or a tapped notification that points at nothing (Expo Router's catch-all). */
export default function NotFoundScreen() {
  const theme = useTheme()
  return (
    <Screen>
      <EmptyState illustration="no-result" title="Không tìm thấy trang" hint="Đường dẫn này không có gì, hoặc đã được chuyển đi nơi khác." />
      <View style={{ alignItems: 'center' }}>
        <Link href="/">
          <Text color={theme.primary}>Về trang chủ</Text>
        </Link>
      </View>
    </Screen>
  )
}
