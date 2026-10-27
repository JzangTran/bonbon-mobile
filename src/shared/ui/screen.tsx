import type { ReactNode } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from './theme'
import { spacing } from './tokens'
import { WaveBackdrop } from './wave-backdrop'

/** Page container: safe area, app background, 16pt padding, scrollable. `backdrop` adds the soft waves of the sign-in screens. */
export function Screen({ children, backdrop }: { children: ReactNode; backdrop?: boolean }) {
  const theme = useTheme()
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {backdrop ? <WaveBackdrop /> : null}
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
})
