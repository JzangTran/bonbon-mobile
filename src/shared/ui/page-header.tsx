import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { useTheme } from './theme'
import { fonts, spacing, touchTarget } from './tokens'

/**
 * The top of every page that is not a tab: a back arrow and the page title, the same everywhere. `inset` adds the status bar
 * height (off when the page already sits in a safe area).
 */
export function PageHeader({ title, onBack, inset = true }: { title?: string; onBack?: () => void; inset?: boolean }) {
  const theme = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: (inset ? insets.top : 0) + spacing.sm, backgroundColor: theme.background }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={8} onPress={onBack ?? (() => router.back())} style={styles.back}>
        <ChevronLeft size={24} color={theme.text} />
      </Pressable>
      {title ? (
        <Text variant="titleSm" style={[styles.title, { fontFamily: fonts.semibold }]} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  back: { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
})
