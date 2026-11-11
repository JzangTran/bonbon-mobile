import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ArrowLeft, History, Search, Star, Store, TrendingUp, type LucideIcon } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDeliveryPoint } from '@/entities/address'
import { useDisplayCategories, useFavoriteShops, useHomeFeed, type FeedCard } from '@/entities/feed'
import { PAST_STATUSES, useMyOrders } from '@/entities/order'
import { useSession } from '@/entities/session'
import { useShopsInArea } from '@/entities/vendor'
import { problemMessage } from '@/shared/api'
import { Button, Card, Notice, Skeleton, SkeletonGroup, Text, fonts, radius, spacing, touchTarget, typography, useTheme } from '@/shared/ui'

const RECENT_KEY = 'search.recent'
const CHIPS = 5
const RECOMMENDED = 9
const GRID_GAP = spacing.md

/** The last searches of whoever is signed in on this phone, newest first. */
function useRecentSearches(userId: string | undefined) {
  const queryClient = useQueryClient()
  const storageKey = `${RECENT_KEY}.${userId ?? 'guest'}`
  const queryKey = ['search-recent', userId ?? 'guest']
  const recent = useQuery({
    queryKey,
    staleTime: Infinity,
    queryFn: async () => {
      const raw = await AsyncStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as string[]) : []
    },
  })
  const list = recent.data ?? []
  const remember = (term: string) => {
    const clean = term.trim()
    if (!clean) return
    const next = [clean, ...list.filter((t) => t.toLocaleLowerCase('vi') !== clean.toLocaleLowerCase('vi'))].slice(0, CHIPS)
    queryClient.setQueryData(queryKey, next)
    void AsyncStorage.setItem(storageKey, JSON.stringify(next))
  }
  return { list, remember }
}

/** Lower case without accents, one character for one, so a place in it is the same place in the original. */
function fold(text: string) {
  return Array.from({ length: text.length }, (_, i) => {
    const plain = text[i].normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
    return plain.length === 1 ? plain : text[i]
  }).join('')
}

/** The text with every part that matches what was typed in bold, accents or not ("com" finds "Cơm"). */
function Highlighted({ text, typed }: { text: string; typed: string }) {
  const name = text.normalize('NFC')
  const haystack = fold(name)
  const needle = fold(typed.normalize('NFC'))
  const parts: { text: string; match: boolean }[] = []
  let from = 0
  for (let at = needle ? haystack.indexOf(needle) : -1; at !== -1; at = haystack.indexOf(needle, from)) {
    if (at > from) parts.push({ text: name.slice(from, at), match: false })
    parts.push({ text: name.slice(at, at + needle.length), match: true })
    from = at + needle.length
  }
  if (from < name.length) parts.push({ text: name.slice(from), match: false })
  return (
    <Text numberOfLines={1} style={styles.flex}>
      {parts.map((part, i) => (
        <Text key={i} style={part.match ? styles.bold : undefined}>
          {part.text}
        </Text>
      ))}
    </Text>
  )
}

/**
 * Searching (owner design 2026-11-09). With nothing typed: recent searches, suggested searches and recommended shops. While typing: the
 * matching shops, the typed part in bold.
 */
export default function SearchScreen() {
  const theme = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const point = useDeliveryPoint(!!session)
  const { list: recent, remember } = useRecentSearches(session?.userId)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])
  const typed = query.trim()
  const results = useShopsInArea(debounced ? point.position : null, debounced, null)
  const list = results.data?.items ?? []
  const waiting = Boolean(point.position) && (typed !== debounced || results.isLoading)

  const openShop = (id: string | undefined) => {
    if (id) router.push({ pathname: '/customer/vendor', params: { id } })
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/customer'))}
          style={styles.back}
        >
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <View style={[styles.search, { backgroundColor: theme.surfaceMuted }]}>
          <Search size={18} color={theme.textMuted} />
          <TextInput
            autoFocus
            accessibilityLabel="Tìm món hoặc quán"
            placeholder="Bạn đang thèm gì nào"
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => remember(query)}
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.input, typography.body, { color: theme.text }]}
          />
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        {typed ? (
          <>
            {!point.position && !point.loading ? (
              <Card>
                <Text variant="titleSm">Bạn muốn nhận món ở đâu?</Text>
                <Text muted>Nhập địa chỉ để tìm trong các quán giao tới bạn.</Text>
                <Button title="Nhập địa chỉ" fullWidth onPress={() => router.push(session ? '/customer/addresses' : '/customer/pick-location')} />
              </Card>
            ) : null}
            {results.isError ? <Notice tone="error" message={problemMessage(results.error)} /> : null}
            {waiting ? (
              <SkeletonGroup>
                {['62%', '48%', '70%', '40%', '55%'].map((width) => (
                  <View key={width} style={styles.result}>
                    <Skeleton width={18} height={18} radius={radius.pill} />
                    <Skeleton width={width as `${number}%`} height={16} />
                  </View>
                ))}
              </SkeletonGroup>
            ) : (
              <View>
                {results.data && list.length === 0 ? <Text muted>Không có quán hoặc món nào khớp “{debounced}”.</Text> : null}
                {list.map((shop) => (
                  <Pressable
                    key={shop.id}
                    accessibilityRole="button"
                    accessibilityLabel={shop.name}
                    onPress={() => {
                      remember(shop.name ?? '')
                      openShop(shop.id)
                    }}
                    style={({ pressed }) => [styles.result, pressed && { backgroundColor: theme.surfaceMuted }]}
                  >
                    <Search size={18} color={theme.textMuted} />
                    <Highlighted text={shop.name ?? ''} typed={typed} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Chips title="Đã tìm kiếm gần đây" icon={History} terms={recent} onPick={setQuery} />
            {session ? (
              <>
                <Suggested recent={recent} onPick={setQuery} />
                <Recommended position={point.position} recent={recent} onOpen={openShop} />
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function Chips({ title, icon: Icon, iconColor, terms, onPick }: { title: string; icon: LucideIcon; iconColor?: string; terms: string[]; onPick: (term: string) => void }) {
  const theme = useTheme()
  if (terms.length === 0) return null
  return (
    <View style={styles.section}>
      <Text variant="titleSm" style={styles.bold}>
        {title}
      </Text>
      <View style={styles.chips}>
        {terms.slice(0, CHIPS).map((term) => (
          <Pressable key={term} accessibilityRole="button" accessibilityLabel={term} onPress={() => onPick(term)} style={[styles.chip, { backgroundColor: theme.surfaceMuted }]}>
            <Icon size={16} color={iconColor ?? theme.textMuted} />
            <Text variant="bodySm" numberOfLines={1} style={styles.chipText}>
              {term}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

/** The dishes in "2× Cơm gà, 1× Trà đá": what this person actually orders. */
function dishesIn(preview: string | undefined) {
  return (preview ?? '')
    .split(',')
    .map((part) => part.trim().replace(/^\d+×\s*/, ''))
    .filter(Boolean)
}

/** Personal: what this customer has ordered and likes, then the kinds of food to fill the row. Not what they just searched. */
function Suggested({ recent, onPick }: { recent: string[]; onPick: (term: string) => void }) {
  const theme = useTheme()
  const categories = useDisplayCategories()
  const orders = useMyOrders(PAST_STATUSES, true)
  const favorites = useFavoriteShops(null, true)
  const past = orders.data?.items ?? []
  const seen = new Set(recent.map((t) => t.toLocaleLowerCase('vi')))
  const terms = [...past.flatMap((o) => dishesIn(o.itemsPreview)), ...past.flatMap((o) => (o.shopName ? [o.shopName] : [])), ...(favorites.data ?? []).map((c) => c.shop.name), ...(categories.data ?? []).map((c) => c.name)].filter((term) => {
    const key = term.toLocaleLowerCase('vi')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return <Chips title="Gợi ý tìm kiếm" icon={TrendingUp} iconColor={theme.primary} terms={terms} onPick={onPick} />
}

type Position = { lat: number; lng: number } | null

/** Near, well rated, in line with this person's last searches, and the shops they already like; best first. */
function rank(cards: FeedCard[], matched: Set<string>, liked: Set<string>) {
  const score = ({ shop }: FeedCard) => (shop.ratingAverage ?? 3.5) - (shop.distanceKm ?? 0) * 0.4 + (matched.has(shop.id) ? 1.5 : 0) + (liked.has(shop.id) || liked.has(shop.name) ? 1 : 0)
  return [...cards].sort((a, b) => score(b) - score(a)).slice(0, RECOMMENDED)
}

function Recommended({ position, recent, onOpen }: { position: Position; recent: string[]; onOpen: (id: string) => void }) {
  const { width } = useWindowDimensions()
  const feed = useHomeFeed({ position })
  const orders = useMyOrders(PAST_STATUSES, true)
  const favorites = useFavoriteShops(null, true)
  const liked = new Set([...(favorites.data ?? []).map((c) => c.shop.id), ...(orders.data?.items ?? []).flatMap((o) => (o.shopName ? [o.shopName] : []))])
  const first = useShopsInArea(recent[0] ? position : null, recent[0] ?? '', null)
  const second = useShopsInArea(recent[1] ? position : null, recent[1] ?? '', null)
  const third = useShopsInArea(recent[2] ? position : null, recent[2] ?? '', null)
  const matched = new Set([first, second, third].flatMap((q) => q.data?.items ?? []).flatMap((shop) => (shop.id ? [shop.id] : [])))
  const shops = rank(feed.data?.pages[0]?.items ?? [], matched, liked)
  const columns = width >= 900 ? 6 : width >= 600 ? 5 : 3
  const cell = { width: `${100 / columns}%` as const }
  if (!feed.isPending && shops.length === 0) return null
  return (
    <View style={styles.section}>
      <Text variant="titleSm" style={styles.bold}>
        Được đề xuất
      </Text>
      {feed.isPending ? (
        <SkeletonGroup style={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.cell, cell]}>
              <View style={styles.squareSkeleton}>
                <Skeleton height="100%" radius={radius.lg} />
              </View>
              <Skeleton width="85%" height={14} />
              <Skeleton width="60%" height={12} />
            </View>
          ))}
        </SkeletonGroup>
      ) : (
        <View style={styles.grid}>
          {shops.map((card) => (
            <View key={card.shop.id} style={[styles.cell, cell]}>
              <ShopTile card={card} onOpen={onOpen} />
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function ShopTile({ card: { shop }, onOpen }: { card: FeedCard; onOpen: (id: string) => void }) {
  const theme = useTheme()
  const distance = shop.distanceKm != null ? `${shop.distanceKm.toFixed(1)}km` : null
  const rating = shop.ratingAverage != null ? shop.ratingAverage.toFixed(1) : null
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={shop.name} onPress={() => onOpen(shop.id)} style={styles.tile}>
      <View style={[styles.avatar, { backgroundColor: theme.surfaceMuted }]}>
        {shop.logoUrl ? (
          <Image source={{ uri: shop.logoUrl }} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <Store size={28} color={theme.textMuted} strokeWidth={1.5} />
        )}
      </View>
      <Text variant="bodySm" numberOfLines={2}>
        {shop.name}
      </Text>
      <View style={styles.meta}>
        {distance ? (
          <Text variant="caption" muted>
            {distance}
          </Text>
        ) : null}
        {distance && rating ? <View style={[styles.dot, { backgroundColor: theme.textMuted }]} /> : null}
        {rating ? (
          <>
            <Star size={13} color="#F5A524" fill="#F5A524" />
            <Text variant="caption">{rating}</Text>
          </>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontFamily: fonts.bold },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  back: { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.pill, paddingHorizontal: spacing.lg, height: touchTarget.min, marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: 0 },
  page: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min, borderRadius: radius.md },
  section: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 36, maxWidth: '100%', paddingHorizontal: spacing.md, borderRadius: radius.pill },
  chipText: { flexShrink: 1 },
  // half a gap on each side of a cell, cancelled at the edges, so the outer columns line up with the titles
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -GRID_GAP / 2, rowGap: spacing.lg },
  cell: { paddingHorizontal: GRID_GAP / 2, gap: spacing.xs },
  tile: { gap: spacing.xs },
  avatar: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  squareSkeleton: { width: '100%', aspectRatio: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  dot: { width: 3, height: 3, borderRadius: radius.pill },
})
