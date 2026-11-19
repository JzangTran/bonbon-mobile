import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { helpCenterUrl } from '@/shared/config/env'
import { Button, useTheme } from '@/shared/ui'
import { HelpView } from './help-view'

/**
 * The help center (owner 2026-11-19): the web help center embedded, not separate native pages, so there is one help center to
 * keep up to date. Under it, the way to a person when the articles do not answer.
 */
export function HelpCenter({ onContact }: { onContact: () => void }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <HelpView url={helpCenterUrl()} />
      <View style={[styles.bar, { borderTopColor: theme.border, backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button title="Liên hệ hỗ trợ" variant="outline" fullWidth onPress={onContact} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
})
