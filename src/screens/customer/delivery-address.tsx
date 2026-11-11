import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Building2, Clock, Home, LocateFixed, MapPin, MoreVertical, Plus, type LucideIcon } from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import {
  ADDRESSES_QUERY_KEY,
  chooseDeliveryPlace,
  clearCurrentLocation,
  distanceKm,
  useDeliveryPoint,
  resolvePlace,
  useAddresses,
  deliverToHere,
  locateNow,
  useLocatedPlace,
  useRecentPlaces,
  type RecentPlace,
} from '@/entities/address'
import { useSession } from '@/entities/session'
import { afterSignIn } from '@/features/after-sign-in'
import { api, problemMessage } from '@/shared/api'
import { CardListSkeleton, Text, fonts, radius, spacing, touchTarget, useTheme, useToast } from '@/shared/ui'
import { PlaceSearchHeader, PlaceSuggestions, type Suggestion } from './place-parts'

type Tab = 'recent' | 'saved'

const km = (value: number) => `${value.toFixed(1)} km`

/** Where to deliver, full screen from the bottom: recently used places and saved ones, or type a new one. */
export default function DeliveryAddressScreen() {
  const theme = useTheme()
  const router = useRouter()
  const toast = useToast()
  const { session } = useSession()
  const here = useLocatedPlace()
  const point = useDeliveryPoint(!!session)
  const { list: recent, add } = useRecentPlaces(session?.userId)
  const [text, setText] = useState('')
  const [tab, setTab] = useState<Tab>('recent')
  const typed = text.trim().length > 0
  const home = () => router.dismissTo('/customer')

  const pick = useMutation({
    mutationFn: (place: Suggestion) => resolvePlace(place),
    onSuccess: (place) => {
      add(place)
      chooseDeliveryPlace(place)
      home()
    },
    onError: (e) => toast.show(problemMessage(e), 'error'),
  })

  const [locating, setLocating] = useState(false)
  // Pressing the row reads the position now when the app could not at opening (no permission yet, or no fix then).
  const pickHere = async () => {
    if (!here) {
      setLocating(true)
      const result = await locateNow()
      setLocating(false)
      if (!result.ok) {
        if (result.reason === 'unavailable') toast.show('Chưa lấy được vị trí. Hãy bật Dịch vụ định vị rồi thử lại.', 'error')
        else if (!result.canAskAgain) {
          toast.show('bonbon chưa được phép dùng vị trí. Hãy bật trong Cài đặt.', 'error')
          void Linking.openSettings()
        }
        return
      }
    }
    deliverToHere()
    home()
  }

  const openDetail = (place: RecentPlace) => router.push({ pathname: '/customer/place', params: { place: JSON.stringify(place) } })
  const from = here?.position ?? point.position

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <PlaceSearchHeader value={text} onChange={setText} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        {typed ? (
          <PlaceSuggestions text={text} onPick={(place) => pick.mutate(place)} />
        ) : (
          <>
            <View style={styles.tabs}>
              <TabButton label="Dùng gần đây" on={tab === 'recent'} onPress={() => setTab('recent')} />
              <TabButton label="Đã lưu" on={tab === 'saved'} onPress={() => setTab('saved')} />
            </View>
            {tab === 'recent' ? (
              <View>
                <PlaceRow
                  icon={LocateFixed}
                  title="Vị trí hiện tại"
                  detail={here?.text ?? (locating ? 'Đang xác định vị trí…' : 'Chạm để lấy vị trí của bạn')}
                  onPress={pickHere}
                  onMore={here ? () => openDetail({ name: 'Vị trí hiện tại', detail: here.text, placeId: here.placeId, lat: here.position.lat, lng: here.position.lng }) : undefined}
                />
                {recent.map((place) => (
                  <PlaceRow
                    key={`${place.lat},${place.lng}`}
                    icon={Clock}
                    title={place.name}
                    distance={from ? km(distanceKm(from, place)) : undefined}
                    detail={place.detail}
                    onPress={() => {
                      add(place)
                      chooseDeliveryPlace(place)
                      home()
                    }}
                    onMore={() => openDetail(place)}
                  />
                ))}
              </View>
            ) : (
              <SavedTab signedIn={!!session} onDone={home} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function TabButton({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.tab, on ? { backgroundColor: theme.text } : undefined]}>
      <Text variant="bodySm" color={on ? theme.background : theme.textMuted} style={on ? styles.strong : undefined}>
        {label}
      </Text>
    </Pressable>
  )
}

function PlaceRow({ icon: Icon, title, distance, detail, onPress, onMore }: { icon: LucideIcon; title: string; distance?: string; detail: string; onPress?: () => void; onMore?: () => void }) {
  const theme = useTheme()
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={styles.rowMain}>
        <Icon size={20} color={theme.textMuted} />
        <View style={styles.flex}>
          <Text numberOfLines={1}>{title}</Text>
          <Text variant="bodySm" numberOfLines={2} muted>
            {distance ? <Text variant="bodySm">{distance}</Text> : null}
            {distance ? ' • ' : ''}
            {detail}
          </Text>
        </View>
      </Pressable>
      {onMore ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Chi tiết ${title}`} hitSlop={8} onPress={onMore} style={styles.more}>
          <MoreVertical size={20} color={theme.textMuted} />
        </Pressable>
      ) : null}
    </View>
  )
}

function SavedTab({ signedIn, onDone }: { signedIn: boolean; onDone: () => void }) {
  const theme = useTheme()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const addresses = useAddresses({ enabled: signedIn })
  const add = (label?: string) => {
    if (!signedIn) {
      // after signing in, carry on to the form rather than landing on the home page
      afterSignIn({ pathname: '/customer/save-place', params: label ? { label } : {} })
      router.push('/login')
    }
    else router.push({ pathname: '/customer/save-place', params: label ? { label } : {} })
  }
  const select = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.PATCH('/api/account/addresses/{id}/default', { params: { path: { id } } })
      if (error) throw error
    },
    onSuccess: async () => {
      clearCurrentLocation()
      await queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY })
      onDone()
    },
    onError: (e) => toast.show(problemMessage(e), 'error'),
  })
  return (
    <View>
      <AddOption icon={Plus} label="Thêm mới" color={theme.info} onPress={() => add()} />
      <AddOption icon={Home} label="Thêm Nhà" color={theme.info} onPress={() => add('Nhà')} />
      <AddOption icon={Building2} label="Thêm Công ty" color={theme.info} onPress={() => add('Công ty')} />
      {addresses.isLoading ? <CardListSkeleton count={2} /> : null}
      {(addresses.data ?? []).map((a) => (
        <PlaceRow key={a.id} icon={a.label === 'Nhà' ? Home : a.label === 'Công ty' ? Building2 : MapPin} title={a.label ?? ''} detail={a.formattedAddress ?? ''} onPress={() => select.mutate(a.id!)} />
      ))}
    </View>
  )
}

function AddOption({ icon: Icon, label, color, onPress }: { icon: LucideIcon; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.add}>
      <Icon size={20} color={color} />
      <Text color={color} style={styles.strong}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strong: { fontFamily: fonts.semibold },
  page: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { height: 36, paddingHorizontal: spacing.lg, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touchTarget.min },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  more: { width: 36, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  add: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min },
})
