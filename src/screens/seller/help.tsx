import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PageHeader, useTheme } from '@/shared/ui'
import { HelpCenter } from '@/widgets/help-center'

export default function SellerHelpScreen() {
  const router = useRouter()
  const theme = useTheme()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <PageHeader title="Trung tâm trợ giúp" onBack={() => router.replace('/seller/shop')} inset={false} />
      <View style={{ flex: 1 }}>
        <HelpCenter onContact={() => router.push('/seller/support')} />
      </View>
    </SafeAreaView>
  )
}
