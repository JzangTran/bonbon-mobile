import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { useSession } from '@/entities/session'
import { api, clearLegalRequired, problemMessage } from '@/shared/api'
import { env } from '@/shared/config/env'
import { formatDateTime } from '@/shared/lib/format'
import { Button, Card, Checkbox, Notice, Text, useToast } from '@/shared/ui'
import { BlockingScreen } from './blocking-screen'

/**
 * A legal document changed in a way that needs a fresh yes (accept-legal-documents.md). The server refuses every call with
 * LEGAL_ACCEPTANCE_REQUIRED until the person reads the summary and accepts; signing out is the only other way out.
 */
export function LegalAcceptanceScreen() {
  const { signOut } = useSession()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = useQuery({
    queryKey: ['legal', 'pending'],
    staleTime: 0,
    queryFn: async () => {
      const { data, error: problem } = await api.GET('/api/legal/pending')
      if (problem || !data) throw problem
      return data
    },
  })
  const items = pending.data?.items ?? []
  const accept = useMutation({
    mutationFn: async (documentIds: string[]) => {
      const { error: problem } = await api.POST('/api/legal/accept', { body: { documentIds } })
      if (problem) throw problem
    },
    onSuccess: async () => {
      clearLegalRequired()
      toast.show('Cảm ơn bạn đã đồng ý.')
      await queryClient.invalidateQueries()
    },
    onError: (e) => setError(problemMessage(e)),
  })

  // Nothing waits any more (accepted on another device): let the person through.
  const nothingWaits = pending.isSuccess && items.length === 0
  useEffect(() => {
    if (!nothingWaits) return
    clearLegalRequired()
    void queryClient.invalidateQueries()
  }, [nothingWaits, queryClient])

  return (
    <BlockingScreen>
      <Text variant="headline">Điều khoản đã được cập nhật</Text>
      <Text muted>Hãy đọc những thay đổi dưới đây và đồng ý để tiếp tục dùng bonbon.</Text>
      {pending.isError ? <Notice tone="error" message={problemMessage(pending.error)} /> : null}
      {items.map((d) => (
        <Card key={d.id}>
          <Text variant="titleSm">
            {d.title} · phiên bản {d.version}
          </Text>
          <Text variant="caption" muted>
            Có hiệu lực từ {formatDateTime(d.effectiveAt)}
          </Text>
          <Text variant="bodySm">{d.summary || 'Không có tóm tắt thay đổi.'}</Text>
          <Button title="Đọc toàn văn" variant="outline" onPress={() => Linking.openURL(`${env.webUrl}/legal/${d.type}`)} />
        </Card>
      ))}
      <Checkbox checked={agreed} onChange={setAgreed}>
        Tôi đã đọc và đồng ý với {items.length > 1 ? 'các văn bản' : 'văn bản'} trên.
      </Checkbox>
      <Notice tone="error" message={error} />
      <Button
        title="Đồng ý và tiếp tục"
        size="lg"
        fullWidth
        loading={accept.isPending}
        disabled={!agreed || items.length === 0}
        onPress={() => {
          setError(null)
          accept.mutate(items.map((d) => d.id ?? ''))
        }}
      />
      <Button title="Đăng xuất" variant="ghost" onPress={() => void signOut()} />
    </BlockingScreen>
  )
}
