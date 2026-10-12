import { useState } from 'react'
import { useSession } from '@/entities/session'
import { Button, Input, Notice, Sheet, Text } from '@/shared/ui'
import { useReauthenticate } from './use-reauthenticate'

/**
 * Sensitive actions need a sign-in from the last 10 minutes. When the server answers REAUTH_REQUIRED the screen opens this, the person
 * types their password again, the session gets fresh tokens and {@code onDone} retries what they were doing.
 */
export function ReauthSheet({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: () => void }) {
  const { session } = useSession()
  const reauthenticate = useReauthenticate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setPassword('')
    setError(null)
    onClose()
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    const problem = await reauthenticate(password)
    setBusy(false)
    if (problem) {
      setError(problem)
      return
    }
    setPassword('')
    onClose()
    onDone()
  }

  return (
    <Sheet visible={visible} onClose={close} title="Nhập lại mật khẩu">
      <Text variant="bodySm" muted>
        Việc này cần bạn đăng nhập trong 10 phút gần nhất. Nhập lại mật khẩu của {session?.email} để tiếp tục.
      </Text>
      <Input label="Mật khẩu" secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} />
      <Text variant="caption" muted>
        Đăng nhập bằng Google, không có mật khẩu? Hãy đăng xuất rồi đăng nhập lại.
      </Text>
      <Notice tone="error" message={error} />
      <Button title="Xác nhận" loading={busy} disabled={password.length === 0} onPress={submit} />
      <Button title="Huỷ" variant="ghost" onPress={close} />
    </Sheet>
  )
}
