import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useCategoryLeaves } from '@/entities/category'
import { useMenu, useMenuMutation, type Menu, type MenuItem } from '@/entities/menu'
import { api, problemFieldErrors, problemMessage } from '@/shared/api'
import { confirm } from '@/shared/lib/confirm'
import { parseInteger } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Screen, Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

/** Add or edit a dish (manage-menu.md). Photos and option groups are edited on the web for now. */
export default function DishFormScreen() {
  const { id, sectionId } = useLocalSearchParams<{ id?: string; sectionId?: string }>()
  const router = useRouter()
  const menu = useMenu()
  if (menu.isPending) return <Screen>{null}</Screen>
  const item = id ? (menu.data?.sections ?? []).flatMap((s) => s.items ?? []).find((i) => i.id === id) : undefined
  if (!menu.data || (id && !item)) {
    return (
      <Screen>
        <Notice tone="error" message="Không tìm thấy món này." />
        <Button title="Quay lại" variant="outline" onPress={() => router.replace('/seller/menu')} />
      </Screen>
    )
  }
  return <DishForm key={item?.id ?? 'new'} menu={menu.data} item={item} defaultSectionId={sectionId} />
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? theme.primary : theme.borderInput, backgroundColor: selected ? theme.primarySubtle : theme.surface },
      ]}
    >
      <Text variant="bodySm" color={selected ? theme.onPrimarySubtle : theme.text}>
        {label}
      </Text>
    </Pressable>
  )
}

function DishForm({ menu, item, defaultSectionId }: { menu: Menu; item?: MenuItem; defaultSectionId?: string }) {
  const router = useRouter()
  const sections = menu.sections ?? []
  const leaves = useCategoryLeaves()
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [price, setPrice] = useState(item?.price === undefined ? '' : String(item.price))
  const [stock, setStock] = useState(item?.stockQuantity === undefined || item?.stockQuantity === null ? '' : String(item.stockQuantity))
  const [section, setSection] = useState(item?.sectionId ?? defaultSectionId ?? sections[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '')
  const [localError, setLocalError] = useState<string | null>(null)

  const save = useMenuMutation(async () => {
    const priceValue = parseInteger(price)
    const stockValue = parseInteger(stock)
    if (item) {
      return api.PATCH('/api/merchant/menu-items/{id}', {
        params: { path: { id: item.id! } },
        body: {
          name: name.trim(),
          price: priceValue,
          categoryId,
          ...(section !== item.sectionId ? { sectionId: section } : {}),
          ...(description.trim() ? { description: description.trim() } : { clearDescription: true }),
          ...(stockValue !== undefined ? { stockQuantity: stockValue } : { clearStock: true }),
        },
      })
    }
    return api.POST('/api/merchant/menu-items', {
      body: {
        sectionId: section,
        categoryId,
        name: name.trim(),
        price: priceValue!,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(stockValue !== undefined ? { stockQuantity: stockValue } : {}),
      },
    })
  }, item ? 'Đã lưu món.' : 'Đã thêm món.')
  // Read the id up front: the React Compiler would otherwise hoist `item!.id` and read it while adding a new dish.
  const itemId = item?.id
  const remove = useMenuMutation(
    () => api.DELETE('/api/merchant/menu-items/{id}', { params: { path: { id: itemId! } } }),
    'Đã xoá món.',
  )
  const fieldErrors = save.isError ? problemFieldErrors(save.error) : {}

  function submit() {
    if (parseInteger(price) === undefined) return setLocalError('Giá món phải là số nguyên, ví dụ 45000.')
    if (stock.trim() !== '' && parseInteger(stock) === undefined) return setLocalError('Số phần còn lại phải là số nguyên.')
    if (!categoryId) return setLocalError('Hãy chọn ngành hàng cho món.')
    setLocalError(null)
    save.mutate(undefined, { onSuccess: () => router.replace('/seller/menu') })
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller/menu')} />
      </View>
      <Text variant="headline">{item ? 'Sửa món' : 'Thêm món'}</Text>
      <Card>
        <Input label="Tên món" value={name} onChangeText={setName} maxLength={100} error={fieldErrors.name} />
        <Input label="Mô tả (không bắt buộc)" value={description} onChangeText={setDescription} maxLength={500} multiline />
        <Input label="Giá (₫)" keyboardType="number-pad" value={price} onChangeText={setPrice} error={fieldErrors.price} />
        <Input
          label="Số phần còn lại"
          placeholder="Để trống = không giới hạn"
          keyboardType="number-pad"
          value={stock}
          onChangeText={setStock}
        />
        <Text variant="bodySm">Mục thực đơn</Text>
        <View style={styles.chips}>
          {sections.map((s) => (
            <Choice key={s.id} label={s.name ?? ''} selected={section === s.id} onPress={() => setSection(s.id!)} />
          ))}
        </View>
        <Text variant="bodySm">Ngành hàng</Text>
        <View style={styles.chips}>
          {(leaves.data ?? []).map((leaf) => (
            <Choice key={leaf.id} label={leaf.name} selected={categoryId === leaf.id} onPress={() => setCategoryId(leaf.id)} />
          ))}
        </View>
        <Text variant="caption" muted>
          Chọn sai ngành có thể làm món bị ẩn khỏi tìm kiếm.
        </Text>
        <Notice tone="error" message={localError ?? (save.isError && Object.keys(fieldErrors).length === 0 ? problemMessage(save.error) : null)} />
        <Button
          title={item ? 'Lưu món' : 'Thêm món'}
          size="lg"
          fullWidth
          disabled={name.trim() === '' || !section}
          loading={save.isPending}
          onPress={submit}
        />
      </Card>
      {item ? (
        <Button
          title="Xoá món"
          variant="outline"
          fullWidth
          loading={remove.isPending}
          onPress={async () => {
            if (await confirm('Xoá món?', `${item.name}. Đơn cũ vẫn giữ nguyên thông tin món.`, 'Xoá')) {
              remove.mutate(undefined, { onSuccess: () => router.replace('/seller/menu') })
            }
          }}
        />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: touchTarget.min, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
})
