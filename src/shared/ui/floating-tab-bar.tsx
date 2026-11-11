import type { ComponentProps } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { Tabs } from 'expo-router'
import Animated, { makeMutable, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { useTheme } from './theme'
import { fonts, radius } from './tokens'

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0]

const BAR_HEIGHT = 60
const ICON = 22
const SLIDE_MS = 220
/** Pixels of scroll in one direction before the bar reacts, so a resting finger does not make it flicker. */
const SCROLL_SLOP = 4

/** How far the bar has slid away (0 shown, 1 hidden) and its height: a screen that follows it, like the cart bar on Home, reads these. */
const wanted = makeMutable(0)
export const tabBarMotion = { hidden: makeMutable(0), height: makeMutable(0), wanted }
const lastY = makeMutable(0)

function slideTabBar(to: 0 | 1) {
  'worklet'
  if (wanted.value === to) return
  wanted.value = to
  tabBarMotion.hidden.value = withTiming(to, { duration: SLIDE_MS })
}

/** Call from a scroll handler (screen with `tabBarStyle: { position: 'absolute' }`): down hides the bar, up brings it back. */
export function tabBarFollowScroll(y: number, end: number) {
  'worklet'
  if (y <= 0) {
    lastY.value = 0
    slideTabBar(0)
    return
  }
  // the bounce at the bottom of the list scrolls backwards by itself
  if (y >= end) {
    lastY.value = end
    return
  }
  const delta = y - lastY.value
  if (Math.abs(delta) < SCROLL_SLOP) return
  lastY.value = y
  slideTabBar(delta > 0 ? 1 : 0)
}

/** The bar must never stay away when its screen is left. */
export function showTabBar() {
  slideTabBar(0)
}

/**
 * The tab bar: one item per tab, an icon with its name in small type under it (owner decision 2026-11-03); the current tab in
 * orange. It sits in the layout (not over the content), so screens need no extra bottom padding. A screen hides it the usual
 * way, with `tabBarStyle: { display: 'none' }`, and a tab with `href: null` is not a tab. With `tabBarStyle: { position: 'absolute' }`
 * it floats over the screen instead, which can then slide it away while scrolling (tabBarFollowScroll).
 */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const focusedStyle = StyleSheet.flatten(descriptors[state.routes[state.index].key]?.options.tabBarStyle) as ViewStyle | undefined
  const slide = useAnimatedStyle(() => ({ transform: [{ translateY: tabBarMotion.hidden.value * tabBarMotion.height.value }] }))
  if (focusedStyle?.display === 'none') return null

  return (
    <Animated.View
      onLayout={(e) => tabBarMotion.height.set(e.nativeEvent.layout.height)}
      style={[styles.wrap, focusedStyle?.position === 'absolute' ? styles.floating : undefined, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 12) + 4 }, slide]}
    >
      <View accessibilityRole="tablist" style={[styles.bar, { backgroundColor: theme.surface }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const href = (options as { href?: string | null }).href
          if (href === null || !options.tabBarIcon) return null
          const focused = state.index === index
          const title = typeof options.title === 'string' ? options.title : route.name
          const label = options.tabBarAccessibilityLabel ?? title
          const color = focused ? theme.primary : theme.textMuted
          const badge = options.tabBarBadge
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigateToTab(route.key)
          }
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [styles.item, pressed && !focused && styles.pressed]}
            >
              <View>
                {options.tabBarIcon({ focused, color, size: ICON })}
                {badge !== undefined && badge !== '' ? (
                  <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                    <Text variant="caption" color={theme.onDanger} style={styles.badgeText}>
                      {String(badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text variant="caption" color={color} numberOfLines={1} style={[styles.label, focused && styles.labelOn]}>
                {title}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 6 },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: radius.lg,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    // flat: no cast shadow, no border (owner 2026-11-09)
  },
  item: { flex: 1, height: BAR_HEIGHT - 8, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 11, lineHeight: 14 },
  labelOn: { fontFamily: fonts.semibold },
  pressed: { opacity: 0.7 },
  badge: { position: 'absolute', top: -6, right: -12, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
})
