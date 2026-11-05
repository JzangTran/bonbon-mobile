import { Globe } from 'lucide-react-native'
import { Pressable, StyleSheet } from 'react-native'
import { setLocale, useLocale } from '@/shared/i18n'
import { Text } from './text'
import { useTheme } from './theme'
import { fonts, radius, spacing, touchTarget } from './tokens'

/** A globe with the language it switches to, as on the website; the change is immediate and remembered on this device. */
export function LanguageSwitch() {
  const theme = useTheme()
  const locale = useLocale()
  const next = locale === 'vi' ? 'en' : 'vi'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={next === 'en' ? 'English' : 'Tiếng Việt'}
      hitSlop={6}
      onPress={() => setLocale(next)}
      style={[styles.button, { backgroundColor: theme.surfaceMuted }]}
    >
      <Globe size={16} color={theme.text} strokeWidth={1.75} />
      <Text variant="bodySm" style={styles.label}>
        {next.toUpperCase()}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: touchTarget.min - 8, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  label: { fontFamily: fonts.semibold },
})
