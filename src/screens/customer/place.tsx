import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ChevronDown, Heart, Navigation } from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg'
import { chooseDeliveryPlace, distanceKm, useDeliveryPoint, useLocatedPlace, useRecentPlaces, type RecentPlace } from '@/entities/address'
import { useFavoriteShops, useFavoriteToggle } from '@/entities/feed'
import { useSession } from '@/entities/session'
import { useShopsInArea } from '@/entities/vendor'
import { api } from '@/shared/api'
import { Sheet, Skeleton, SkeletonGroup, Text, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'
import { FooterButton } from './place-parts'

type Period = 'weekday' | 'weekend'
const PERIODS: { value: Period; label: string }[] = [
  { value: 'weekday', label: 'Ngày làm việc' },
  { value: 'weekend', label: 'Cuối tuần' },
]
const DAY_NAMES = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật']
const HOUR_LABELS: Record<number, string> = { 6: '6AM', 12: '12PM', 18: '6PM' }
const BAR_WIDTH = 18
const BAR_GAP = 6
const CHART_HEIGHT = 120
const SAME_PLACE_KM = 0.2

const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** "22:00" as "10:00 PM". */
function twelveHour(clock: string) {
  const [hours, minutes] = clock.split(':').map(Number)
  return `${hours % 12 === 0 ? 12 : hours % 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`
}

/** One place from the recent list: what and where it is, how far, and, when it is a shop on bonbon, its hours and busy times. */
export default function PlaceScreen() {
  const theme = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ place: string }>()
  const [place] = useState(() => JSON.parse(params.place) as RecentPlace)
  const { session } = useSession()
  const here = useLocatedPlace()
  const point = useDeliveryPoint(!!session)
  const { add } = useRecentPlaces(session?.userId)
  const position = { lat: place.lat, lng: place.lng }
  const nearby = useShopsInArea(position, place.name, null)
  const shop = (nearby.data?.items ?? []).find((s) => (s.distanceKm ?? 1) <= SAME_PLACE_KM && fold(s.name ?? '') === fold(place.name))
  const favorites = useFavoriteShops(null, !!session)
  const toggle = useFavoriteToggle()
  const favorite = (favorites.data ?? []).some((c) => c.shop.id === shop?.id)
  const from = here?.position ?? point.position
  // along the roads; a straight line until that answers, or if it cannot
  const route = useQuery({
    queryKey: ['geo', 'route', from?.lat, from?.lng, place.lat, place.lng],
    enabled: !!from,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/geo/route', { params: { query: { fromLat: from!.lat, fromLng: from!.lng, toLat: place.lat, toLng: place.lng } } })
      if (error || !data) throw error
      return data
    },
  })
  const awayKm = route.data?.[0]?.distanceKm ?? (from ? distanceKm(from, position) : null)
  const away = awayKm !== null ? `${awayKm.toFixed(1)} km` : null

  const info = useQuery({
    queryKey: ['vendors', shop?.id, 'place-info'],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/vendors/{id}/place-info', { params: { path: { id: shop!.id! } } })
      if (error || !data) throw error
      return data
    },
  })

  const onHeart = () => {
    if (!session) router.push('/login')
    else if (shop?.id) toggle.mutate({ shopId: shop.id, favorite: !favorite })
    else router.push({ pathname: '/customer/save-place', params: { place: JSON.stringify(place) } })
  }
  const schedule = info.data?.schedule
  const status = !schedule
    ? null
    : schedule.open
      ? { state: 'Đang mở cửa', next: schedule.closesAt ? `Đóng cửa lúc ${twelveHour(schedule.closesAt)}` : null }
      : { state: 'Đã đóng cửa', next: schedule.opensAt && schedule.opensDay ? `Mở cửa lúc ${DAY_NAMES[schedule.opensDay - 1]} ${twelveHour(schedule.opensAt)}` : null }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Circle label="Quay lại" onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.onPrimary} />
        </Circle>
        <Circle label="Lưu địa điểm" onPress={onHeart}>
          <Heart size={20} color={theme.onPrimary} fill={favorite ? theme.onPrimary : 'transparent'} />
        </Circle>
      </View>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.summary}>
          <View style={styles.flex}>
            <Text variant="title" style={styles.bold}>
              {place.name}
            </Text>
            <Text variant="bodySm">{place.detail}</Text>
            {status ? (
              <Text variant="bodySm" style={styles.status}>
                <Text variant="bodySm" color={schedule?.open ? theme.onSuccessSubtle : theme.danger} style={styles.semi}>
                  {status.state}
                </Text>
                {status.next ? ` • ${status.next}` : ''}
              </Text>
            ) : null}
          </View>
          {away ? (
            <View style={styles.mapCell}>
              <FadedMap />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Chỉ đường, cách ${away}`}
                onPress={() => void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`)}
                style={[styles.go, { backgroundColor: theme.surface }]}
              >
                <Navigation size={16} color={theme.text} fill={theme.text} />
                <Text variant="bodySm" style={styles.semi}>
                  {away}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        {shop ? <BusyHours weekday={info.data?.weekday} weekend={info.data?.weekend} /> : null}
      </ScrollView>
      <FooterButton
        title="Chọn vị trí"
        onPress={() => {
          add(place)
          chooseDeliveryPlace(place)
          router.dismissTo('/customer')
        }}
      />
    </View>
  )
}

function Circle({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.circle, { backgroundColor: theme.textMuted }]}>
      {children}
    </Pressable>
  )
}

/** A grey street plan behind the distance button, fading to the page all round so it stays on this row. */
function FadedMap() {
  const theme = useTheme()
  return (
    <Svg width={170} height={96} viewBox="0 0 170 96" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="fade" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0.25" stopColor={theme.background} stopOpacity={0} />
          <Stop offset="1" stopColor={theme.background} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      {[
        [0, 20, 170, 34],
        [0, 62, 170, 50],
        [0, 88, 170, 78],
        [34, 0, 48, 96],
        [92, 0, 84, 96],
        [140, 0, 128, 96],
      ].map(([x1, y1, x2, y2]) => (
        <Line key={`${x1}${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.border} strokeWidth={4} />
      ))}
      <Rect x={0} y={0} width={170} height={96} fill="url(#fade)" />
    </Svg>
  )
}

function BusyHours({ weekday, weekend }: { weekday?: number[]; weekend?: number[] }) {
  const theme = useTheme()
  const [period, setPeriod] = useState<Period>('weekday')
  const [choosing, setChoosing] = useState(false)
  const [hourNow] = useState(() => new Date().getHours())
  const values = period === 'weekday' ? weekday : weekend
  const top = Math.max(...(values ?? [0]), 0.01)
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="titleSm" style={[styles.flex, styles.bold]}>
          Giờ đông khách
        </Text>
        <Pressable accessibilityRole="button" onPress={() => setChoosing(true)} style={[styles.select, { backgroundColor: theme.surfaceMuted }]}>
          <Text variant="bodySm">{PERIODS.find((p) => p.value === period)?.label}</Text>
          <ChevronDown size={16} color={theme.text} />
        </Pressable>
      </View>
      {values ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
          {values.map((value, hour) => (
            <View key={hour} style={styles.column}>
              <View style={styles.barArea}>
                <View style={[styles.bar, { height: Math.max(4, (value / top) * CHART_HEIGHT), backgroundColor: hour === hourNow ? theme.primary : theme.border }]} />
              </View>
              <View style={styles.hourLabel}>
                {HOUR_LABELS[hour] ? (
                  <Text variant="caption" muted numberOfLines={1} style={styles.hourText}>
                    {HOUR_LABELS[hour]}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <SkeletonGroup style={styles.chart}>
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} width={BAR_WIDTH} height={40 + ((i * 37) % 70)} style={styles.barSkeleton} />
          ))}
        </SkeletonGroup>
      )}
      <Sheet visible={choosing} onClose={() => setChoosing(false)} title="Giờ đông khách">
        {PERIODS.map((p) => (
          <Pressable
            key={p.value}
            accessibilityRole="radio"
            aria-checked={p.value === period}
            onPress={() => {
              setPeriod(p.value)
              setChoosing(false)
            }}
            style={styles.period}
          >
            <Text style={p.value === period ? styles.bold : undefined}>{p.label}</Text>
          </Pressable>
        ))}
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontFamily: fonts.bold },
  semi: { fontFamily: fonts.semibold },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  circle: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  page: { padding: spacing.lg, gap: spacing.xl },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  status: { marginTop: spacing.xs },
  mapCell: { width: 170, height: 96, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.lg },
  go: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  section: { gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  select: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: BAR_GAP },
  column: { width: BAR_WIDTH, alignItems: 'center' },
  barArea: { height: CHART_HEIGHT, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  barSkeleton: { marginBottom: 20 },
  hourLabel: { height: 20, justifyContent: 'center', alignItems: 'center', overflow: 'visible' },
  hourText: { width: 44, textAlign: 'center' },
  period: { minHeight: touchTarget.min, justifyContent: 'center' },
})
