import { useSession } from '@/entities/session'
import { Button, Screen, Text } from '@/shared/ui'

/** Temporary body for tab screens until their sprint builds them. */
export function PlaceholderScreen({ title, sprint }: { title: string; sprint: number }) {
  const { signOut } = useSession()
  return (
    <Screen>
      <Text variant="headline">{title}</Text>
      <Text muted>Màn hình này làm ở Sprint {sprint}.</Text>
      {__DEV__ ? <Button title="Đăng xuất (dev)" variant="ghost" onPress={signOut} /> : null}
    </Screen>
  )
}
