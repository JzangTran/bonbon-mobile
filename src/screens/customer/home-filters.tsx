import { Image } from 'expo-image'
import { ArrowUpDown, BadgePercent, Check, ChevronDown, Flame, MapPin, SlidersHorizontal, Star, ThumbsUp, Utensils, X, type LucideIcon } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NO_FILTERS, sameFilters, useDisplayCategories, type HomeFilters } from '@/entities/feed'
import { Sheet, Text, fonts, radius, spacing, useTheme } from '@/shared/ui'

export type FilterPanel = 'all' | 'sort' | 'cuisine'

const SORTS: { value: HomeFilters['sort']; label: string; icon: LucideIcon }[] = [
  { value: 'RECOMMENDED', label: 'Được đề xuất', icon: ThumbsUp },
  { value: 'RATING', label: 'Đánh giá', icon: Star },
]
const BAR_HIDDEN = 140
const CUISINE_GAP = spacing.sm

/**
 * The row of filters on the home page, swiped sideways: the button for all of them (orange outline and a dot once anything differs
 * from the default), then the common ones. A pill with an arrow opens a sheet, the others apply at once. Last comes Đặt lại.
 */
export function FilterBar({ filters, onChange, onOpen }: { filters: HomeFilters; onChange: (next: HomeFilters) => void; onOpen: (panel: FilterPanel) => void }) {
  const theme = useTheme()
  const changed = !sameFilters(filters, NO_FILTERS)
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={changed ? 'Bộ lọc, đang áp dụng' : 'Bộ lọc'}
        onPress={() => onOpen('all')}
        style={[styles.pill, { borderColor: changed ? theme.primary : theme.borderInput }]}
      >
        <SlidersHorizontal size={18} color={changed ? theme.primary : theme.text} />
        {changed ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
      </Pressable>
      <Pill icon={ArrowUpDown} label="Lọc theo" on={filters.sort !== 'RECOMMENDED'} opens onPress={() => onOpen('sort')} />
      <Pill icon={Star} label="Từ 4.4" on={filters.highlyRated} onPress={() => onChange({ ...filters, highlyRated: !filters.highlyRated })} />
      <Pill icon={Utensils} label="Ẩm thực" on={filters.cuisines.length > 0} opens onPress={() => onOpen('cuisine')} />
      <Pill icon={BadgePercent} label="Khuyến mãi" on={filters.promotions} onPress={() => onChange({ ...filters, promotions: !filters.promotions })} />
      {changed ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Đặt lại bộ lọc" onPress={() => onChange(NO_FILTERS)} hitSlop={8} style={styles.resetLink}>
          <Text variant="bodySm" color={theme.info} style={styles.strong}>
            Đặt lại
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  )
}

function Pill({ icon: Icon, label, on, opens, onPress }: { icon: LucideIcon; label: string; on: boolean; opens?: boolean; onPress: () => void }) {
  const theme = useTheme()
  const color = on ? theme.primary : theme.text
  return (
    <Pressable
      accessibilityRole="button"
      aria-pressed={opens ? undefined : on}
      accessibilityLabel={on ? `${label}, đang áp dụng` : label}
      onPress={onPress}
      style={[styles.pill, { borderColor: on ? theme.primaryBorder : theme.borderInput }]}
    >
      <Icon size={16} color={color} />
      <Text variant="bodySm" color={color}>
        {label}
      </Text>
      {opens ? <ChevronDown size={16} color={color} /> : null}
    </Pressable>
  )
}

type SheetsProps = { panel: FilterPanel | null; filters: HomeFilters; canUseNearby: boolean; onApply: (next: HomeFilters) => void; onClose: () => void }

/** The three sheets the row opens. Only one shows at a time; each keeps its own draft until Áp dụng. */
export function FilterSheets({ panel, filters, canUseNearby, onApply, onClose }: SheetsProps) {
  const apply = (next: HomeFilters) => {
    onApply(next)
    onClose()
  }
  return (
    <>
      <AllFilters visible={panel === 'all'} applied={filters} canUseNearby={canUseNearby} onApply={apply} onClose={onClose} />
      <Sheet visible={panel === 'sort'} onClose={onClose} title="Lọc theo">
        <SortChoices value={filters.sort} onPick={(sort) => apply({ ...filters, sort })} />
      </Sheet>
      <Cuisines visible={panel === 'cuisine'} applied={filters} onApply={apply} onClose={onClose} />
    </>
  )
}

/** A draft of the filters that starts over from what is applied each time its sheet opens. */
function useDraft(visible: boolean, applied: HomeFilters) {
  const [draft, setDraft] = useState(applied)
  const [wasVisible, setWasVisible] = useState(visible)
  if (visible !== wasVisible) {
    setWasVisible(visible)
    if (visible) setDraft(applied)
  }
  return [draft, setDraft] as const
}

function AllFilters({ visible, applied, canUseNearby, onApply, onClose }: { visible: boolean; applied: HomeFilters; canUseNearby: boolean; onApply: (next: HomeFilters) => void; onClose: () => void }) {
  const theme = useTheme()
  const [draft, setDraft] = useDraft(visible, applied)
  const flip = (key: 'highlyRated' | 'promotions' | 'bestSellers' | 'nearby') => setDraft({ ...draft, [key]: !draft[key] })
  return (
    <Sheet visible={visible} onClose={onClose} fullScreen>
      <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} hitSlop={10} style={styles.close}>
        <X size={24} color={theme.text} />
      </Pressable>
      <ScrollView style={styles.flex} contentContainerStyle={styles.sections} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text variant="titleSm" style={styles.label}>Lọc theo</Text>
          <View style={styles.options}>
            <SortChoices value={draft.sort} onPick={(sort) => setDraft({ ...draft, sort })} />
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <View style={styles.section}>
          <Text variant="titleSm" style={styles.label}>Tùy chọn quán</Text>
          <View style={styles.options}>
            <Choice icon={Star} label="Từ 4.4" on={draft.highlyRated} onPress={() => flip('highlyRated')} />
            <Choice icon={BadgePercent} label="Khuyến mãi" on={draft.promotions} onPress={() => flip('promotions')} />
            <Choice icon={Flame} label="Bán chạy" on={draft.bestSellers} onPress={() => flip('bestSellers')} />
            {canUseNearby ? <Choice icon={MapPin} label="Gần đây" on={draft.nearby} onPress={() => flip('nearby')} /> : null}
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <View style={styles.section}>
          <Text variant="titleSm" style={styles.label}>Ẩm thực</Text>
          <View style={styles.options}>
            <CuisineChoices selected={draft.cuisines} onChange={(cuisines) => setDraft({ ...draft, cuisines })} />
          </View>
        </View>
      </ScrollView>
      <ApplyBar visible={visible && !sameFilters(draft, applied)} onReset={() => setDraft(applied)} onApply={() => onApply(draft)} />
    </Sheet>
  )
}

function Cuisines({ visible, applied, onApply, onClose }: { visible: boolean; applied: HomeFilters; onApply: (next: HomeFilters) => void; onClose: () => void }) {
  const [draft, setDraft] = useDraft(visible, applied)
  return (
    <Sheet visible={visible} onClose={onClose} title="Ẩm thực">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.sections} showsVerticalScrollIndicator={false}>
        <CuisineChoices selected={draft.cuisines} onChange={(cuisines) => setDraft({ ...draft, cuisines })} />
      </ScrollView>
      <ApplyBar visible={visible && !sameFilters(draft, applied)} onReset={() => setDraft(applied)} onApply={() => onApply(draft)} />
    </Sheet>
  )
}

function SortChoices({ value, onPick }: { value: HomeFilters['sort']; onPick: (value: HomeFilters['sort']) => void }) {
  const theme = useTheme()
  return (
    <View accessibilityRole="radiogroup">
      {SORTS.map((s) => {
        const on = s.value === value
        return (
          <Pressable key={s.value} accessibilityRole="radio" aria-checked={on} onPress={() => onPick(s.value)} style={styles.radioRow}>
            <s.icon size={20} color={theme.text} />
            <Text style={styles.flex}>{s.label}</Text>
            <View style={[styles.radio, { borderColor: on ? theme.primary : theme.borderInput }]}>
              {on ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

function CuisineChoices({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {
  const theme = useTheme()
  const categories = useDisplayCategories()
  const { width } = useWindowDimensions()
  // Equal columns edge to edge: four on a phone, more on a tablet.
  const columns = width >= 900 ? 8 : width >= 600 ? 6 : 4
  return (
    <View style={styles.cuisines}>
      {(categories.data ?? []).map((c) => {
        const on = selected.includes(c.id)
        return (
          <Pressable
            key={c.id}
            accessibilityRole="checkbox"
            aria-checked={on}
            accessibilityLabel={c.name}
            onPress={() => onChange(on ? selected.filter((id) => id !== c.id) : [...selected, c.id])}
            style={[styles.cuisine, { width: `${100 / columns}%` }]}
          >
            <View style={[styles.cuisinePicture, { backgroundColor: theme.surfaceMuted }]}>
              {c.imageUrl ? <Image source={{ uri: c.imageUrl }} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
            </View>
            <Text variant="caption" numberOfLines={2} color={on ? theme.primary : theme.text} style={[styles.cuisineName, on ? styles.strong : undefined]}>
              {c.name}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function Choice({ icon: Icon, label, on, onPress }: { icon: LucideIcon; label: string; on: boolean; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={on}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.radioRow}
    >
      <Icon size={20} color={theme.text} />
      <Text style={styles.flex}>{label}</Text>
      <CheckMark on={on} />
    </Pressable>
  )
}

/** The tick at the end of a row, drawn like the app's Checkbox; the row itself takes the press. */
function CheckMark({ on }: { on: boolean }) {
  const theme = useTheme()
  return (
    <View style={[styles.checkBox, { borderColor: on ? theme.primary : theme.borderInput, backgroundColor: on ? theme.primary : theme.surface }]}>
      {on ? <Check size={16} color={theme.onPrimary} /> : null}
    </View>
  )
}

/** Rises from the bottom of a sheet while the draft differs from what is applied, and sinks again once it does not. */
function ApplyBar({ visible, onReset, onApply }: { visible: boolean; onReset: () => void; onApply: () => void }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const shift = useSharedValue(BAR_HIDDEN)
  useEffect(() => {
    shift.value = withTiming(visible ? 0 : BAR_HIDDEN, { duration: 200, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System })
  }, [visible, shift])
  const rise = useAnimatedStyle(() => ({ transform: [{ translateY: shift.value }] }))
  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      aria-hidden={!visible}
      style={[styles.applyBar, { backgroundColor: theme.surface, borderTopColor: theme.divider, paddingBottom: Math.max(insets.bottom, spacing.md) }, rise]}
    >
      <Pressable accessibilityRole="button" onPress={onReset} style={[styles.applyButton, { backgroundColor: theme.surfaceMuted }]}>
        <Text color={theme.text} style={styles.strong}>
          Đặt lại
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onApply} style={[styles.applyButton, { backgroundColor: theme.text }]}>
        <Text color={theme.background} style={styles.strong}>
          Áp dụng
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strong: { fontFamily: fonts.semibold },
  bar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm, alignItems: 'center' },
  pill: { height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  // half a gap on each side of a cell, cancelled at the edges, so the outer columns line up with the sheet's title
  cuisines: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -CUISINE_GAP / 2, rowGap: spacing.md },
  cuisine: { paddingHorizontal: CUISINE_GAP / 2, alignItems: 'center', gap: spacing.xs },
  cuisinePicture: { width: '100%', aspectRatio: 1, overflow: 'hidden' },
  cuisineName: { textAlign: 'center' },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  resetLink: { height: 36, justifyContent: 'center', paddingHorizontal: spacing.xs },
  close: { alignSelf: 'flex-start' },
  scroll: { maxHeight: 520 },
  divider: { height: 1 },
  sections: { gap: spacing.xl, paddingBottom: 96 },
  section: { gap: spacing.lg },
  label: { fontFamily: fonts.bold },
  // the choices sit a little in from their label
  options: { paddingLeft: spacing.md },
  radioRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  radio: { width: 22, height: 22, borderRadius: radius.pill, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkBox: { width: 22, height: 22, borderRadius: radius.sm / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: radius.pill },
  applyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyButton: { flex: 1, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
})
