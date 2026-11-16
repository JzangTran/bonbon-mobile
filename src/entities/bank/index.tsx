import { useQuery } from '@tanstack/react-query'
import { Check, ChevronDown } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View } from 'react-native'
import { api, type components } from '@/shared/api'
import { Input, Sheet, Text, fonts, radius, spacing, touchTarget, typography, useTheme } from '@/shared/ui'

export type Bank = components['schemas']['BankView']

/** The Napas banks VietQR knows; the backend accepts only these for a refund or payout account. */
export function useBanks() {
  return useQuery({
    queryKey: ['banks'],
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/public/banks')
      if (error || !data) throw error
      return data
    },
  })
}

/** No accents, spaces or case, as the backend compares bank names. */
export function fold(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]/g, '').toLowerCase()
}

/**
 * A field that opens the bank list in a sheet with search (short name, code or full name, accents ignored), instead of typing the name.
 * The value is the short name the backend stores.
 */
export function BankPicker({ value, onChange, error }: { value: string; onChange: (shortName: string) => void; error?: string }) {
  const theme = useTheme()
  const { data: banks, isError } = useBanks()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const chosen = banks?.find((b) => fold(b.shortName ?? '') === fold(value))
  const shown = useMemo(() => {
    const key = fold(query)
    if (!banks) return []
    return key ? banks.filter((b) => [b.shortName, b.code, b.name].some((x) => x && fold(x).includes(key))) : banks
  }, [banks, query])

  return (
    <View style={styles.field}>
      <Text variant="bodySm" style={styles.label}>
        Ngân hàng
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={chosen ? `Ngân hàng: ${chosen.shortName}. Bấm để đổi` : 'Chọn ngân hàng'}
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: error ? theme.danger : theme.borderInput, backgroundColor: theme.surface, borderWidth: error ? 2 : 1 }]}
      >
        <Text variant="body" color={chosen ? theme.text : theme.textMuted} numberOfLines={1} style={styles.flex}>
          {chosen ? `${chosen.shortName} · ${chosen.name}` : 'Chọn ngân hàng'}
        </Text>
        <ChevronDown size={18} color={theme.textMuted} />
      </Pressable>
      {error ? (
        <Text variant="bodySm" color={theme.danger}>
          {error}
        </Text>
      ) : null}
      <Sheet visible={open} onClose={() => { setOpen(false); setQuery('') }} title="Chọn ngân hàng" fullScreen>
        <Input label="Tìm ngân hàng" placeholder="Tên hoặc mã, ví dụ VCB" value={query} onChangeText={setQuery} maxLength={60} autoCorrect={false} />
        {isError ? <Text color={theme.danger}>Không tải được danh sách ngân hàng.</Text> : null}
        <FlatList
          data={shown}
          keyExtractor={(b) => b.bin ?? b.code ?? ''}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={banks ? <Text muted>Không có ngân hàng phù hợp.</Text> : undefined}
          renderItem={({ item }) => {
            const selected = chosen?.bin === item.bin
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(item.shortName ?? '')
                  setOpen(false)
                  setQuery('')
                }}
                style={styles.row}
              >
                <View style={styles.flex}>
                  <Text variant="body" style={{ fontFamily: fonts.medium }}>
                    {item.shortName} <Text variant="bodySm" muted>({item.code})</Text>
                  </Text>
                  <Text variant="bodySm" muted>
                    {item.name}
                  </Text>
                </View>
                {selected ? <Check size={18} color={theme.primary} /> : null}
              </Pressable>
            )
          }}
        />
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontFamily: fonts.medium },
  trigger: {
    minHeight: touchTarget.min,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...typography.body,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, minHeight: touchTarget.min },
  flex: { flex: 1 },
})
