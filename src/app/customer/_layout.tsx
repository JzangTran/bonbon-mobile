import { Stack } from 'expo-router'
import { fonts, useTheme } from '@/shared/ui'

/** Customer tabs, plus screens that open on top of them (addresses). */
export default function CustomerLayout() {
  const theme = useTheme()
  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.text,
        headerStyle: { backgroundColor: theme.surface },
        headerTitleStyle: { fontFamily: fonts.semibold },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="addresses" options={{ title: 'Địa chỉ giao hàng' }} />
      <Stack.Screen name="address-form" options={{ title: 'Địa chỉ' }} />
      <Stack.Screen name="vendor" options={{ title: 'Quán' }} />
    </Stack>
  )
}
