import type { ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

type Props = { visible: boolean; onClose: () => void; title: string; children: ReactNode }

/** Bottom sheet for item options, filters and confirmations. */
export function Sheet({ visible, onClose, title, children }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng" />
      <View
        style={[
          styles.sheet,
          { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: theme.divider }]} />
        <Text variant="title">{title}</Text>
        {children}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill },
})
