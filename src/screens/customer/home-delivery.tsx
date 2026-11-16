import { ArrowLeft, ArrowRight, Clock, MapPin, type LucideIcon } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Button, Sheet, Text, fonts, radius, spacing, useTheme } from '@/shared/ui'

/** A chosen window; null is "as soon as possible". */
export type DeliveryTime = { day: string; start: number } | null

const SLOT_MINUTES = 30
const DAY_MINUTES = 24 * 60
const DAYS_AHEAD = 2
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const ROW = 44
// the centre row, one clear row each side, and half of one more each side: at most five in sight
const WHEEL_HEIGHT = ROW * 4
const WHEEL_PAD = (WHEEL_HEIGHT - ROW) / 2

/** "#RRGGBB" with an alpha, for the gradients that fade to the sheet's own colour (a transparent black would grey the edge). */
const withAlpha = (hex: string, alpha: number) => `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
const pad = (n: number) => String(n).padStart(2, '0')
const clock = (minutes: number) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`
const slotLabel = (start: number) => `${clock(start)} - ${clock(start + SLOT_MINUTES)}`
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

function daysFrom(now: Date) {
  return Array.from({ length: DAYS_AHEAD + 1 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    return { key: dayKey(date), label: offset === 0 ? 'Hôm nay' : `${WEEKDAYS[date.getDay()]}, ${date.getDate()} thg ${date.getMonth() + 1}` }
  })
}

/** Today from the window we are in, other days from midnight, always up to 23:30 - 00:00. */
function slotsOf(dayIndex: number, now: Date) {
  const first = dayIndex === 0 ? Math.floor((now.getHours() * 60 + now.getMinutes()) / SLOT_MINUTES) * SLOT_MINUTES : 0
  return Array.from({ length: (DAY_MINUTES - first) / SLOT_MINUTES }, (_, i) => first + i * SLOT_MINUTES)
}

/** "Ngay bây giờ", "Hôm nay lúc 21:30 - 22:00" or "T3, 10 thg 11 lúc 21:30 - 22:00". */
export function deliveryTimeText(time: DeliveryTime, now: Date) {
  if (!time) return 'Ngay bây giờ'
  const day = daysFrom(now).find((d) => d.key === time.day)
  return day ? `${day.label} lúc ${slotLabel(time.start)}` : 'Ngay bây giờ'
}

type Props = {
  visible: boolean
  address: string | null | undefined
  time: DeliveryTime
  timeText: string
  onChangeTime: (time: DeliveryTime) => void
  onChooseAddress: () => void
  onClose: () => void
}

/** Pressing the address on the home page: where and when to deliver. The time picker rises from this sheet, which fades out behind it. */
export function DeliverySheet({ visible, address, time, timeText, onChangeTime, onChooseAddress, onClose }: Props) {
  const [pickingAt, setPickingAt] = useState<Date | null>(null)
  const picking = pickingAt !== null
  // kept while the picker sinks away, so it does not empty as it closes
  const [lastNow, setLastNow] = useState<Date | null>(null)
  return (
    <Sheet visible={visible} onClose={onClose} hidden={picking}>
      <Option title="Địa chỉ giao hàng" icon={MapPin} detail={address ?? undefined} onPress={onChooseAddress} />
      <Option
        title="Thời gian giao"
        icon={Clock}
        detail={timeText}
        onPress={() => {
          const now = new Date()
          setLastNow(now)
          setPickingAt(now)
        }}
      />
      {lastNow ? (
        // Inside this sheet: iOS will not present a second modal beside one that is already showing.
        <Sheet visible={picking} onClose={() => setPickingAt(null)} title="Chọn ngày và khung giờ giao hàng" clearBackdrop above={<BackCircle onPress={() => setPickingAt(null)} />}>
          <TimePicker
            key={lastNow.getTime()}
            now={lastNow}
            time={time}
            onDone={(next) => {
              onChangeTime(next)
              setPickingAt(null)
            }}
          />
        </Sheet>
      ) : null}
    </Sheet>
  )
}

function BackCircle({ onPress }: { onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={onPress} style={[styles.backCircle, { backgroundColor: theme.surface }]}>
      <ArrowLeft size={22} color={theme.text} />
    </Pressable>
  )
}

function Option({ title, icon: Icon, detail, onPress }: { title: string; icon: LucideIcon; detail?: string; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={detail ? `${title}: ${detail}` : title} onPress={onPress} style={styles.option}>
      <View style={styles.optionText}>
        <Text variant="titleSm">{title}</Text>
        {detail ? (
          <View style={styles.detail}>
            <Icon size={15} color={theme.textMuted} />
            <Text variant="bodySm" muted numberOfLines={1} style={styles.flexShrink}>
              {detail}
            </Text>
          </View>
        ) : null}
      </View>
      <ArrowRight size={22} color={theme.text} />
    </Pressable>
  )
}

function TimePicker({ now, time, onDone }: { now: Date; time: DeliveryTime; onDone: (time: DeliveryTime) => void }) {
  const theme = useTheme()
  const days = daysFrom(now)
  const [dayIndex, setDayIndex] = useState(() => Math.max(0, days.findIndex((d) => d.key === time?.day)))
  const slots = slotsOf(dayIndex, now)
  const [start, setStart] = useState(time?.start ?? slots[0])
  const slotIndex = Math.max(0, slots.indexOf(start))
  const confirm = () => {
    const chosen = slots[slotIndex]
    // the window we are in today is simply "now"
    onDone(dayIndex === 0 && slotIndex === 0 ? null : { day: days[dayIndex].key, start: chosen })
  }
  return (
    <>
      <View style={styles.wheels}>
        <View pointerEvents="none" style={[styles.band, { backgroundColor: theme.surfaceMuted }]} />
        <Wheel items={days.map((d) => d.label)} initial={dayIndex} onPick={setDayIndex} />
        {/* a new list for a new day, keeping the same window when that day has it */}
        <Wheel key={dayIndex} items={slots.map(slotLabel)} initial={slotIndex} onPick={(i) => setStart(slots[i])} />
      </View>
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <Button title="Giao ngay" variant="outline" size="lg" fullWidth onPress={() => onDone(null)} />
        </View>
        <View style={styles.footerButton}>
          <Button title="Xác nhận" size="lg" fullWidth onPress={confirm} />
        </View>
      </View>
    </>
  )
}

/**
 * A column turned like a wheel. While it moves nothing leaves the UI thread: each row reads the scroll offset and bends along a
 * cylinder (it leans back, shrinks, fades and is pulled in towards the centre), so there is no state to change per frame and nothing
 * to flicker. The scroll position is handed to React once, when the wheel has come to rest on a row.
 */
function Wheel({ items, initial, onPick }: { items: string[]; initial: number; onPick: (index: number) => void }) {
  const theme = useTheme()
  const list = useRef<Animated.ScrollView>(null)
  const y = useSharedValue(initial * ROW)
  const last = items.length - 1

  useEffect(() => {
    list.current?.scrollTo({ y: initial * ROW, animated: false })
    // only where the wheel starts: a new list is a new wheel (it has its own key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rest = (offset: number) => onPick(Math.min(last, Math.max(0, Math.round(offset / ROW))))
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      y.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      // let go without a flick: it comes to rest here, no momentum follows
      if (Math.abs(event.velocity?.y ?? 0) < 0.05) runOnJS(rest)(event.contentOffset.y)
    },
    onMomentumEnd: (event) => {
      runOnJS(rest)(event.contentOffset.y)
    },
  })

  return (
    <View style={styles.wheel}>
      <Animated.ScrollView
        ref={list}
        style={styles.wheelScroll}
        contentContainerStyle={styles.wheelContent}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        {items.map((label, index) => (
          <WheelRow key={label} label={label} index={index} y={y} />
        ))}
      </Animated.ScrollView>
      {/* the rows melt into the sheet above and below, which is what makes the wheel look round */}
      <LinearGradient pointerEvents="none" colors={[theme.surface, withAlpha(theme.surface, 0)]} style={[styles.fade, styles.fadeTop]} />
      <LinearGradient pointerEvents="none" colors={[withAlpha(theme.surface, 0), theme.surface]} style={[styles.fade, styles.fadeBottom]} />
    </View>
  )
}

/** The angle between two neighbouring rows on the cylinder, and its radius so that the rows keep their spacing at the centre. */
const STEP = 0.5
const RADIUS = ROW / STEP

function WheelRow({ label, index, y }: { label: string; index: number; y: SharedValue<number> }) {
  const theme = useTheme()
  const turn = useAnimatedStyle(() => {
    // positive: the row is above the centre
    const away = y.value / ROW - index
    const clamped = Math.max(-2.4, Math.min(2.4, away))
    const angle = clamped * STEP
    const near = Math.abs(clamped)
    return {
      opacity: interpolate(near, [0, 1, 2, 2.4], [1, 0.62, 0.26, 0.08], Extrapolation.CLAMP),
      transform: [
        { perspective: 600 },
        // pulled in along the curve instead of keeping the flat spacing
        // a row's flat place is -away * ROW from the centre; on the cylinder it is -RADIUS * sin(angle), so it moves by the difference
        { translateY: away * ROW - RADIUS * Math.sin(angle) },
        { rotateX: `${(angle * 180) / Math.PI}deg` },
        { scale: interpolate(near, [0, 1, 2], [1, 0.92, 0.82], Extrapolation.CLAMP) },
      ],
    }
  })
  return (
    <Animated.View style={[styles.row, turn]}>
      <Text numberOfLines={1} color={theme.text} style={styles.rowText}>
        {label}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  flexShrink: { flexShrink: 1 },
  rowText: { fontFamily: fonts.semibold },
  backCircle: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', gap: spacing.md },
  footerButton: { flex: 1 },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  optionText: { flex: 1, gap: spacing.xs },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  wheels: { height: WHEEL_HEIGHT, flexDirection: 'row', gap: spacing.xl, marginVertical: spacing.sm },
  // one band across both wheels, behind them
  band: { position: 'absolute', left: 0, right: 0, top: WHEEL_PAD, height: ROW, borderRadius: radius.md },
  wheel: { flex: 1 },
  wheelScroll: { flex: 1 },
  wheelContent: { paddingVertical: WHEEL_PAD },
  fade: { position: 'absolute', left: 0, right: 0, height: ROW * 1.3 },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
  row: { height: ROW, alignItems: 'center', justifyContent: 'center' },
})
