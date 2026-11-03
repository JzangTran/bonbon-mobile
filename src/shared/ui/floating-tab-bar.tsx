import type { ComponentProps } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { useTheme } from './theme'
import { fonts, radius } from './tokens'

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0]

const BAR_HEIGHT = 60
const ICON = 22

/**
 * The tab bar: one item per tab, an icon with its name in small type under it (owner decision 2026-11-03); the current tab in
 * orange. It sits in the layout (not over the content), so screens need no extra bottom padding. A screen hides it the usual
 * way, with `tabBarStyle: { display: 'none' }`, and a tab with `href: null` is not a tab.
 */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const focusedStyle = StyleSheet.flatten(descriptors[state.routes[state.index].key]?.options.tabBarStyle) as ViewStyle | undefined
  if (focusedStyle?.display === 'none') return null

  return (
    <View style={[styles.wrap, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
      <View accessibilityRole="tablist" style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 6 },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: radius.lg,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    // flat: no cast shadow
    borderWidth: 1,

  },
  item: { flex: 1, height: BAR_HEIGHT - 8, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 11, lineHeight: 14 },
  labelOn: { fontFamily: fonts.semibold },
  pressed: { opacity: 0.7 },
  badge: { position: 'absolute', top: -6, right: -12, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
})
