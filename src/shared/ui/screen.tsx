import type { ReactNode } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FeedbackRegion } from './feedback'
import { PageHeader } from './page-header'
import { useTheme } from './theme'
import { spacing } from './tokens'
import { WaveBackdrop } from './wave-backdrop'

/**
 * Page container: safe area, app background, 16pt padding, scrollable. `backdrop` adds the soft waves of the sign-in screens.
 * `title` (or `onBack`) puts the back arrow and the title above the scrolling content, as on every page that is not a tab.
 */
export function Screen({ children, backdrop, title, onBack }: { children: ReactNode; backdrop?: boolean; title?: string; onBack?: () => void }) {
  const theme = useTheme()
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {backdrop ? <WaveBackdrop /> : null}
      {title !== undefined || onBack ? <PageHeader title={title} onBack={onBack} inset={false} /> : null}
      {/* results and errors of this screen show here, under the header and outside the scroll, so they are always in view */}
      <FeedbackRegion>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </FeedbackRegion>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
})
