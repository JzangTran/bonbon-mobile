import { StyleSheet, View } from 'react-native'
import { Illustration, MascotArt, type IllustrationName, type MascotPose } from './illustrations'
import { Text } from './text'
import { spacing } from './tokens'

/**
 * What a list shows when it has nothing: a picture, a line saying why, and optionally what to do about it. `mascot` picks the bear
 * that fits the list (waiting for orders, no messages, all quiet…); without it the line drawing `illustration` is shown.
 */
export function EmptyState({ illustration = 'empty', mascot, title, hint }: { illustration?: IllustrationName; mascot?: MascotPose; title: string; hint?: string }) {
  return (
    <View style={styles.box}>
      {mascot ? <MascotArt pose={mascot} width={150} /> : <Illustration name={illustration} width={140} />}
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
