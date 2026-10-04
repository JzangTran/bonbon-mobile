import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import {
  useMenu,
  useMenuMutation,
  useOptionGroups,
  useOptionMutation,
  type MenuItem,
  type MenuSection,
  type OptionGroups,
} from '@/entities/menu'
import { api, problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Screen, Sheet, Text, fonts, spacing, touchTarget, useTheme } from '@/shared/ui'

/** The seller's menu on the phone: what is on sale, one-tap sold-out switches, and quick dish editing. */
export default function SellerMenuScreen() {
  const menu = useMenu()
  const groups = useOptionGroups()
  const [adding, setAdding] = useState(false)
  const sections = menu.data?.sections ?? []

  return (
    <Screen>
      <Text variant="headline">Thực đơn</Text>
      {menu.isError ? <Notice tone="error" message={problemMessage(menu.error)} /> : null}
      {menu.data && sections.length === 0 ? (
        <Card>
          <Text variant="titleSm">Thực đơn đang trống</Text>
          <Text muted>Bắt đầu bằng một mục như “Cơm” hoặc “Nước uống”, rồi thêm món vào đó.</Text>
        </Card>
      ) : null}
      {sections.map((section) => (
        <SectionCard key={section.id} section={section} />
      ))}
      <Button title="+ Thêm mục thực đơn" variant="outline" size="lg" fullWidth onPress={() => setAdding(true)} />
      {groups.data ? <OptionSwitches groups={groups.data} /> : null}
      <AddSectionSheet visible={adding} onClose={() => setAdding(false)} />
    </Screen>
  )
}

function SectionCard({ section }: { section: MenuSection }) {
  const router = useRouter()
  const items = section.items ?? []
  return (
    <Card>
      <View style={styles.row}>
        <Text variant="titleSm" style={styles.flex}>
          {section.name}
        </Text>
        <Button title="+ Thêm món" variant="ghost" onPress={() => router.push({ pathname: '/seller/dish-form', params: { sectionId: section.id } })} />
      </View>
      {items.length === 0 ? (
        <Text variant="bodySm" muted>
          Chưa có món nào trong mục này.
        </Text>
      ) : (
        items.map((item) => <DishRow key={item.id} item={item} />)
      )}
    </Card>
  )
}

function DishRow({ item }: { item: MenuItem }) {
  const theme = useTheme()
  const router = useRouter()
  const switchedOff = item.status === 'SOLD_OUT'
  const outOfStock = item.stockQuantity === 0
  const blockedByOptions = Boolean(item.soldOut) && !switchedOff && !outOfStock
  const toggle = useMenuMutation((status: 'AVAILABLE' | 'SOLD_OUT') =>
    api.PATCH('/api/merchant/menu-items/{id}/status', { params: { path: { id: item.id! } }, body: { status } }),
  )

  return (
    <View style={[styles.dish, { borderTopColor: theme.divider }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sửa ${item.name}`}
        style={styles.dishMain}
        onPress={() => router.push({ pathname: '/seller/dish-form', params: { id: item.id } })}
      >
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.thumb} contentFit="cover" accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.thumb, { backgroundColor: theme.imageSlot }]} />
        )}
        <View style={styles.flex}>
          <Text variant="body" muted={Boolean(item.soldOut)}>
            {item.name}
          </Text>
          <Text variant="bodySm" muted style={styles.money}>
            {formatVnd(item.price)}
          </Text>
          {outOfStock ? (
            <Text variant="caption" color={theme.onWarningSubtle}>
              Hết tồn kho
            </Text>
          ) : blockedByOptions ? (
            <Text variant="caption" color={theme.onWarningSubtle}>
              Thiếu lựa chọn bắt buộc
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Button
        title={switchedOff ? 'Hết món' : 'Đang bán'}
        variant={switchedOff ? 'outline' : 'primary'}
        loading={toggle.isPending}
        accessibilityState={{ selected: !switchedOff }}
        onPress={() => toggle.mutate(switchedOff ? 'AVAILABLE' : 'SOLD_OUT')}
      />
    </View>
  )
}

/** The "out of pearls" switch: each option of each group, without opening the group. */
function OptionSwitches({ groups }: { groups: OptionGroups }) {
  const theme = useTheme()
  const list = groups.groups ?? []
  const setStatus = useOptionMutation(({ id, status }: { id: string; status: 'AVAILABLE' | 'SOLD_OUT' }) =>
    api.PATCH('/api/merchant/options/{id}/status', { params: { path: { id } }, body: { status } }),
  )
  if (list.length === 0) return null
  return (
    <Card>
      <Text variant="titleSm">Lựa chọn thêm</Text>
      <Text variant="bodySm" muted>
        Cỡ ly, topping… Bấm để báo hết hoặc còn. Chỉnh sửa đầy đủ trên web.
      </Text>
      {list.map((group) => (
        <View key={group.id} style={styles.optionGroup}>
          <Text variant="bodySm" style={styles.groupName}>
            {group.name}
          </Text>
          {(group.options ?? []).map((option) => {
            const soldOut = option.status === 'SOLD_OUT'
            return (
              <View key={option.id} style={[styles.optionRow, { borderTopColor: theme.divider }]}>
                <Text variant="body" muted={soldOut} style={styles.flex}>
                  {option.name}
                  {option.priceDelta ? ` (+${formatVnd(option.priceDelta)})` : ''}
                </Text>
                <Button
                  title={soldOut ? 'Hết' : 'Còn'}
                  variant={soldOut ? 'outline' : 'primary'}
                  loading={setStatus.isPending && setStatus.variables?.id === option.id}
                  onPress={() => setStatus.mutate({ id: option.id!, status: soldOut ? 'AVAILABLE' : 'SOLD_OUT' })}
                />
              </View>
            )
          })}
        </View>
      ))}
    </Card>
  )
}

function AddSectionSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const create = useMenuMutation(
    (value: string) => api.POST('/api/merchant/menu-sections', { body: { name: value } }),
    'Đã thêm mục thực đơn.',
  )
  return (
    <Sheet visible={visible} onClose={onClose} title="Thêm mục thực đơn">
      <Input label="Tên mục" placeholder="Ví dụ: Cơm" value={name} onChangeText={setName} maxLength={60} autoFocus />
      <Button
        title="Thêm mục"
        size="lg"
        fullWidth
        disabled={name.trim() === ''}
        loading={create.isPending}
        onPress={() =>
          create.mutate(name.trim(), {
            onSuccess: () => {
              setName('')
              onClose()
            },
          })
        }
      />
    </Sheet>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  dish: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, paddingTop: spacing.sm },
  dishMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min },
  thumb: { width: 48, height: 48 },
  money: { fontVariant: ['tabular-nums'] },
  optionGroup: { gap: spacing.xs, marginTop: spacing.sm },
  groupName: { fontFamily: fonts.semibold },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, paddingTop: spacing.xs },
})

