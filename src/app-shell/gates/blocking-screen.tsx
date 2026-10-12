import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Screen, useTheme } from '@/shared/ui'

/** A full-screen layer over the whole app: it keeps the app mounted underneath, so nothing is lost when it goes away again. */
export function BlockingScreen({ children }: { children: ReactNode }) {
  const theme = useTheme()
  return (
    <View style={[StyleSheet.absoluteFill, styles.layer, { backgroundColor: theme.background }]} accessibilityViewIsModal>
      <Screen>{children}</Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  layer: { zIndex: 1000, elevation: 1000 },
})
