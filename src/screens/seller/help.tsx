import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { Button, Screen, Text } from '@/shared/ui'
import { HelpCenter } from '@/widgets/help-center'

export default function SellerHelpScreen() {
  const router = useRouter()
  return (
    <Screen>
      <View>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller/shop')} />
      </View>
      <Text variant="headline">Trợ giúp</Text>
      <HelpCenter onContact={() => router.push('/seller/support')} />
    </Screen>
  )
}
