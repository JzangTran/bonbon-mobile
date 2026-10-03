import { Check } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing, touchTarget } from './tokens'

type Props = { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; muted?: boolean }

/** Unticked by default; the whole row is the touch target (≥48dp). */
export function Checkbox({ checked, onChange, children, muted }: Props) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          { borderColor: checked ? theme.primary : theme.borderInput, backgroundColor: checked ? theme.primary : theme.surface },
        ]}
      >
        {checked ? <Check size={16} color={theme.onPrimary} /> : null}
      </View>
      <Text variant="bodySm" muted={muted} style={styles.label}>
        {children}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min },
  box: { width: 22, height: 22, borderRadius: radius.sm / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1 },
})
