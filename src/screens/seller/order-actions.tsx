import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useOrderAction, type OrderStatus } from '@/entities/order'
import { Button, Input, Sheet, spacing } from '@/shared/ui'

/** The one button that moves an order forward, by its current status. */
const NEXT_STEP: Partial<Record<OrderStatus, { to: 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED'; label: string }>> = {
  CONFIRMED: { to: 'PREPARING', label: 'Bắt đầu chuẩn bị' },
  PREPARING: { to: 'OUT_FOR_DELIVERY', label: 'Giao đi' },
  OUT_FOR_DELIVERY: { to: 'DELIVERED', label: 'Đã giao xong' },
}

type Asking = 'reject' | 'cancel' | null

/**
 * The actions an order allows right now (confirm-order.md, update-order-status.md): the big "Nhận đơn" or a
 * reject with a reason for a new order, one full-width next-step button after that, cancel with a reason until it
 * leaves the kitchen.
 */
export function OrderActions({ id, status }: { id: string; status: OrderStatus }) {
  const action = useOrderAction(id)
  const [asking, setAsking] = useState<Asking>(null)
  const [reason, setReason] = useState('')
  const next = NEXT_STEP[status]

  const submitReason = () => {
    if (!asking) return
    action.mutate(
      { kind: asking, reason: reason.trim() },
      {
        onSuccess: () => {
          setAsking(null)
          setReason('')
        },
      },
    )
  }

  if (status !== 'PLACED' && !next) return null
  return (
    <View style={styles.actions}>
      {status === 'PLACED' ? (
        <>
          <Button title="Nhận đơn" size="lg" fullWidth loading={action.isPending} onPress={() => action.mutate({ kind: 'confirm' })} />
          <Button title="Từ chối" variant="outline" fullWidth disabled={action.isPending} onPress={() => setAsking('reject')} />
        </>
      ) : null}
      {next ? (
        <>
          <Button
            title={next.label}
            size="lg"
            fullWidth
            loading={action.isPending}
            onPress={() => action.mutate({ kind: 'advance', to: next.to })}
          />
          {status === 'CONFIRMED' || status === 'PREPARING' ? (
            <Button title="Huỷ đơn" variant="outline" fullWidth disabled={action.isPending} onPress={() => setAsking('cancel')} />
          ) : null}
        </>
      ) : null}
      <Sheet
        visible={asking !== null}
        onClose={() => setAsking(null)}
        title={asking === 'reject' ? 'Từ chối đơn này?' : 'Huỷ đơn này?'}
      >
        <Input label="Lý do (khách sẽ thấy)" value={reason} onChangeText={setReason} maxLength={300} multiline />
        <Button
          title={asking === 'reject' ? 'Từ chối đơn' : 'Huỷ đơn'}
          variant="destructive"
          size="lg"
          fullWidth
          disabled={reason.trim() === ''}
          loading={action.isPending}
          onPress={submitReason}
        />
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
})
