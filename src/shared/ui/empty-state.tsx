import { StyleSheet, View } from 'react-native'
import { Illustration, type IllustrationName } from './illustrations'
import { Text } from './text'
import { spacing } from './tokens'

/** What a list shows when it has nothing: a picture, a line saying why, and optionally what to do about it. */
export function EmptyState({ illustration = 'empty', title, hint }: { illustration?: IllustrationName; title: string; hint?: string }) {
  return (
    <View style={styles.box}>
      <Illustration name={illustration} width={140} />
      <Text variant="titleSm" style={styles.center}>
        {title}
      </Text>
      {hint ? (
        <Text variant="bodySm" muted style={styles.center}>
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  center: { textAlign: 'center' },
})
