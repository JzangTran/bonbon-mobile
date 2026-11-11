import { Link, type Href } from 'expo-router'
import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTx } from '@/shared/i18n'
import { LanguageSwitch, Text, fonts, spacing, useTheme } from '@/shared/ui'

/**
 * The frame of the sign-in sheet's screens: the title with the language switch beside it, clear of the sheet's rounded corners; the
 * form at full width; `footer` at the very bottom of the screen, however short the form is.
 */
export function AuthSheet({ title, intro, children, footer }: { title: string; intro?: string; children: ReactNode; footer?: ReactNode }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.head}>
        <Text variant="headline" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <LanguageSwitch />
      </View>
      {intro ? (
        <Text muted style={styles.intro}>
          {intro}
        </Text>
      ) : null}
      <View style={styles.form}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </ScrollView>
  )
}

/** A line of plain text with only its end as a link: "Bạn chưa có tài khoản? Tạo tài khoản ngay". */
export function AuthLink({ text, action, href, dismiss = false }: { text?: string; action: string; href: Href; dismiss?: boolean }) {
  const theme = useTheme()
  return (
    <View style={styles.link}>
      {text ? (
        <Text variant="bodySm" muted>
          {text}
        </Text>
      ) : null}
      <Link href={href} dismissTo={dismiss} accessibilityRole="link">
        <Text variant="bodySm" color={theme.primary} style={styles.action}>
          {action}
        </Text>
      </Link>
    </View>
  )
}

/** The line between the form and the other ways in: "hoặc" / "or". */
export function OrDivider() {
  const theme = useTheme()
  const tx = useTx()
  return (
    <View style={styles.divider}>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
      <Text variant="bodySm" muted>
        {tx('hoặc', 'or')}
      </Text>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 44 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1 },
  intro: { marginTop: spacing.sm },
  form: { marginTop: spacing.xxxl, gap: spacing.lg },
  footer: { marginTop: 'auto', paddingTop: spacing.xxl, alignItems: 'center' },
  link: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  action: { fontFamily: fonts.semibold },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
})
