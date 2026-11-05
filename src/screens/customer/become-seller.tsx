import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Linking } from 'react-native'
import { useSession } from '@/entities/session'
import { api, problemMessage } from '@/shared/api'
import { env } from '@/shared/config/env'
import { Button, Card, Checkbox, Notice, Screen, Text, useTheme } from '@/shared/ui'

function useDocument(type: 'SELLER_TERMS' | 'PRIVACY_POLICY') {
  return useQuery({
    queryKey: ['legal-document', type],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/legal/documents/{type}', { params: { path: { type } } })
      if (error || !data) throw error
      return data
    },
  })
}

/**
 * "Đăng ký trở thành người bán hàng": the signed-in customer adds the seller role to the same account, one email and password for
 * both; the app then moves to the seller side, where the shop application starts.
 */
export default function BecomeSellerScreen() {
  const theme = useTheme()
  const { session, signIn } = useSession()
  const terms = useDocument('SELLER_TERMS')
  const privacy = useDocument('PRIVACY_POLICY')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!session || !terms.data?.id || !privacy.data?.id) return
    setError(null)
    setBusy(true)
    const added = await api.POST('/api/auth/register', {
      body: { email: session.email, role: 'SELLER', acceptedDocumentIds: [terms.data.id, privacy.data.id] },
    })
    const tokens = added.data?.tokens
    if (!tokens?.accessToken || !tokens.refreshToken) {
      setBusy(false)
      setError(problemMessage(added.error))
      return
    }
    const roles = { availableRoles: [...session.availableRoles, 'SELLER' as const] }
    await signIn({ ...session, ...roles, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
    const switched = await api.POST('/api/auth/switch-role', { body: { role: 'SELLER' } })
    const seller = switched.data?.tokens
    setBusy(false)
    if (!seller?.accessToken || !seller.refreshToken) {
      setError(problemMessage(switched.error))
      return
    }
    // The seller route group replaces this one through the root layout's guards.
    await signIn({ ...session, ...roles, role: 'SELLER', accessToken: seller.accessToken, refreshToken: seller.refreshToken })
  }

  return (
    <Screen>
      <Text variant="headline" accessibilityRole="header">
        Trở thành người bán hàng
      </Text>
      <Text muted>Mở quán trên bonbon ngay bằng tài khoản này. Bạn dùng chung email và mật khẩu, và vẫn đặt món như bình thường.</Text>
      <Card>
        <Text variant="titleSm">Sau khi đăng ký</Text>
        <Text muted>1. Điền hồ sơ quán trên máy tính bằng tài khoản này.</Text>
        <Text muted>2. bonbon duyệt hồ sơ.</Text>
        <Text muted>3. Bạn nhận đơn ngay trong app này, ở chế độ người bán.</Text>
      </Card>
      <Checkbox checked={accepted} onChange={setAccepted}>
        Tôi đồng ý với{' '}
        <Text variant="bodySm" color={theme.primary} onPress={() => Linking.openURL(`${env.webUrl}/legal/SELLER_TERMS`)}>
          {terms.data?.title ?? 'Điều khoản dành cho người bán'}
        </Text>{' '}
        và đã đọc{' '}
        <Text variant="bodySm" color={theme.primary} onPress={() => Linking.openURL(`${env.webUrl}/legal/PRIVACY_POLICY`)}>
          {privacy.data?.title ?? 'Chính sách quyền riêng tư'}
        </Text>
        .
      </Checkbox>
      <Notice tone="error" message={error} />
      <Button title="Đăng ký trở thành người bán hàng" size="lg" fullWidth disabled={!accepted || !terms.data || !privacy.data} loading={busy} onPress={() => void submit()} />
    </Screen>
  )
}
