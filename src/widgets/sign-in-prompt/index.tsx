import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Button, MascotArt, Screen, Text, spacing, type MascotPose } from '@/shared/ui'

/**
 * What a tab that belongs to an account shows a guest (orders, messages, account): why to sign in, and the two ways in.
 * The guest keeps browsing shops on the home tab without it. The picture and the text have a fixed height, so the buttons stay
 * in the same place from tab to tab.
 */
export function SignInPrompt({ title, text, mascot }: { title: string; text: string; mascot: MascotPose }) {
  const router = useRouter()
  return (
    <Screen>
      <View style={styles.box}>
        <MascotArt pose={mascot} width={190} height={190} />
        <Text variant="headline" numberOfLines={1} style={styles.center}>
          {title}
        </Text>
        <Text muted style={[styles.center, styles.text]}>
          {text}
        </Text>
        <View style={styles.actions}>
          <Button title="Đăng nhập" size="lg" fullWidth onPress={() => router.push('/login')} />
          <Button title="Tạo tài khoản" variant="outline" size="lg" fullWidth onPress={() => router.push('/register')} />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxxl },
  center: { textAlign: 'center' },
  text: { minHeight: 72 },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
})
