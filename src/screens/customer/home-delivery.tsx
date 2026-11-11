import { ArrowLeft, ArrowRight, Clock, MapPin, type LucideIcon } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated'
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
const SETTLE_MS = 140

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

/** A column turned like a wheel: rows lean and fade away from the centre, and it always comes to rest on one. */
function Wheel({ items, initial, onPick }: { items: string[]; initial: number; onPick: (index: number) => void }) {
  const list = useRef<Animated.ScrollView>(null)
  const y = useSharedValue(initial * ROW)
  const [start] = useState(initial)
  const [selected, setSelected] = useState(initial)
  const [moving, setMoving] = useState(false)
  const top = useRef(initial * ROW)
  const held = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    list.current?.scrollTo({ y: start * ROW, animated: false })
    return () => clearTimeout(timer.current)
  }, [start])

  const settle = () => {
    // a finger resting on the wheel has not let go of it
    if (held.current) return
    const index = Math.min(items.length - 1, Math.max(0, Math.round(top.current / ROW)))
    setSelected(index)
    setMoving(false)
    onPick(index)
    if (Math.abs(top.current - index * ROW) > 0.5) list.current?.scrollTo({ y: index * ROW, animated: true })
  }
  const arm = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(settle, SETTLE_MS)
  }
  const moved = (offset: number) => {
    top.current = offset
    setMoving(true)
    arm()
  }
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      y.value = event.contentOffset.y
      runOnJS(moved)(event.contentOffset.y)
    },
  })

  return (
    <Animated.ScrollView
      ref={list}
      style={styles.wheel}
      contentContainerStyle={styles.wheelContent}
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={onScroll}
      onScrollBeginDrag={() => {
        held.current = true
        setMoving(true)
      }}
      onScrollEndDrag={() => {
        held.current = false
        arm()
      }}
    >
      {items.map((label, index) => (
        <WheelRow key={label} label={label} index={index} y={y} on={index === selected} moving={moving} />
      ))}
    </Animated.ScrollView>
  )
}

function WheelRow({ label, index, y, on, moving }: { label: string; index: number; y: SharedValue<number>; on: boolean; moving: boolean }) {
  const theme = useTheme()
  const turn = useAnimatedStyle(() => {
    const away = y.value / ROW - index
    return {
      opacity: interpolate(Math.abs(away), [0, 1, 2], [1, 0.55, 0.2], Extrapolation.CLAMP),
      transform: [{ perspective: 400 }, { rotateX: `${interpolate(away, [-2, 0, 2], [-44, 0, 44], Extrapolation.CLAMP)}deg` }],
    }
  })
  return (
    <Animated.View style={[styles.row, turn]}>
      <Text numberOfLines={1} color={moving ? theme.textMuted : theme.text} style={on && !moving ? styles.bold : undefined}>
        {label}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  flexShrink: { flexShrink: 1 },
  bold: { fontFamily: fonts.bold },
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
  wheelContent: { paddingVertical: WHEEL_PAD },
  row: { height: ROW, alignItems: 'center', justifyContent: 'center' },
})
