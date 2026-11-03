import { LinearGradient } from 'expo-linear-gradient'
import { Image, type ImageSource } from 'expo-image'
import { ArrowRight, BadgePercent, ChevronDown, ClipboardList, Heart, ScanLine, Search } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { Text, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

/** The round picture of the Deal HOT strip; set it here once the artwork exists (null shows a percent badge). */
const DEAL_PICTURE: ImageSource | null = null

const WHITE = '#FFFFFF'
const motion = { reduceMotion: ReduceMotion.System }

type Props = {
  /** The street of the delivery address ("130 Điện Biên Phủ"); empty asks to pick one. */
  street?: string
  onAddress: () => void
  onFavorites: () => void
  onOrders: () => void
  onScan: () => void
  onSearch: () => void
  /** The biggest discount nearby, for "Giảm đến X%"; 0 hides the strip. */
  dealMaxPercent: number
  onDeals: () => void
}

/**
 * The top of the home page: orange, with a wavy lower edge and a soft light sweeping across it from time to time. The address
 * and the shortcuts (favourite shops, orders), the scan button and the search, then the Deal HOT strip.
 */
export function HomeHeader({ street, onAddress, onFavorites, onOrders, onScan, onSearch, dealMaxPercent, onDeals }: Props) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [width, setWidth] = useState(0)
  return (
    <View>
      <View style={[styles.orange, { backgroundColor: theme.primary, paddingTop: insets.top + spacing.sm }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Shine width={width} />
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Giao ngay tới ${street ?? 'địa chỉ chưa chọn'}. Đổi địa chỉ`} onPress={onAddress} style={styles.address}>
            <Text variant="caption" color="rgba(255,255,255,0.85)">
              Giao ngay
            </Text>
            <View style={styles.addressLine}>
              <Text variant="titleSm" color={WHITE} numberOfLines={1} style={styles.flexShrink}>
                {street ?? 'Chọn địa chỉ giao hàng'}
              </Text>
              <ChevronDown size={18} color={WHITE} strokeWidth={2.25} />
            </View>
          </Pressable>
          <RoundIcon label="Quán yêu thích" onPress={onFavorites}>
            <Heart size={20} color={WHITE} strokeWidth={2} />
          </RoundIcon>
          <RoundIcon label="Đơn hàng ăn uống" onPress={onOrders}>
            <ClipboardList size={20} color={WHITE} strokeWidth={2} />
          </RoundIcon>
        </View>

        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Quét mã QR của quán" onPress={onScan} style={[styles.scan, { backgroundColor: WHITE }]}>
            <ScanLine size={20} color={theme.primary} strokeWidth={2} />
          </Pressable>
          <Pressable accessibilityRole="search" accessibilityLabel="Tìm món: Bạn đang thèm gì nào" onPress={onSearch} style={[styles.search, { backgroundColor: WHITE }]}>
            <Search size={18} color={theme.textMuted} />
            <Text variant="bodySm" color={theme.textMuted}>
              Bạn đang thèm gì nào
            </Text>
          </Pressable>
        </View>

        {dealMaxPercent > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Deal HOT: các quán ăn giảm đến ${dealMaxPercent}%`}
            onPress={onDeals}
            style={[styles.deal, { backgroundColor: WHITE }]}
          >
            <View style={styles.flex}>
              <Text variant="caption" color={theme.primary} style={styles.hot}>
                Deal HOT
              </Text>
              <View style={styles.dealLine}>
                <Text variant="bodySm" style={styles.dealText}>
                  Các quán ăn Giảm đến {dealMaxPercent}%
                </Text>
                <Nudge>
                  <ArrowRight size={18} color={theme.primary} strokeWidth={2.25} />
                </Nudge>
              </View>
            </View>
            <View style={[styles.dealPicture, { backgroundColor: theme.primarySubtle }]}>
              {DEAL_PICTURE ? (
                <Image source={DEAL_PICTURE} alt="" contentFit="cover" style={StyleSheet.absoluteFill} />
              ) : (
                <BadgePercent size={28} color={theme.primary} strokeWidth={1.75} />
              )}
            </View>
          </Pressable>
        ) : null}
      </View>
      <Wave color={theme.primary} />
    </View>
  )
}

function RoundIcon({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={styles.round}>
      {children}
    </Pressable>
  )
}

/** A band of light crossing the orange diagonally, left to right, then a rest before the next pass. */
function Shine({ width }: { width: number }) {
  const x = useSharedValue(0)
  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0, ...motion }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad), ...motion }),
        withDelay(2600, withTiming(1, { duration: 0, ...motion })),
      ),
      -1,
    )
  }, [x])
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -160 + x.value * (width + 320) }, { skewX: '-20deg' }],
  }))
  if (!width) return null
  return (
    <Animated.View pointerEvents="none" style={[styles.shine, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )
}

/** Moves its child a little to the right and back, then rests: "this way". */
function Nudge({ children }: { children: React.ReactNode }) {
  const dx = useSharedValue(0)
  useEffect(() => {
    dx.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 280, easing: Easing.out(Easing.quad), ...motion }),
        withTiming(0, { duration: 280, easing: Easing.in(Easing.quad), ...motion }),
        withDelay(1500, withTiming(0, { duration: 0, ...motion })),
      ),
      -1,
    )
  }, [dx])
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }] }))
  return <Animated.View style={style}>{children}</Animated.View>
}

/** The wavy lower edge of the orange header. */
function Wave({ color }: { color: string }) {
  return (
    <Svg width="100%" height={22} viewBox="0 0 400 22" preserveAspectRatio="none" style={styles.wave}>
      <Path d="M0 0 H400 V8 C352 24 304 24 256 12 C208 0 160 0 112 12 C72 22 34 22 0 10 Z" fill={color} />
    </Svg>
  )
}

const styles = StyleSheet.create({
  orange: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md, overflow: 'hidden' },
  shine: { position: 'absolute', top: -40, bottom: -40, width: 120 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  address: { flex: 1, minHeight: touchTarget.min, justifyContent: 'center' },
  addressLine: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  flexShrink: { flexShrink: 1 },
  flex: { flex: 1 },
  round: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  scan: { width: touchTarget.min, height: touchTarget.min, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, height: touchTarget.min, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  deal: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, paddingVertical: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.sm },
  hot: { fontFamily: fonts.bold, letterSpacing: 0.4, textTransform: 'uppercase' },
  dealLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dealText: { fontFamily: fonts.semibold },
  dealPicture: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  wave: { marginTop: -1 },
})
