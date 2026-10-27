import type { ComponentProps } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './text'
import { useTheme } from './theme'
import { fonts, radius } from './tokens'

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0]

const BAR_HEIGHT = 64
const ICON = 22

/**
 * The v3 tab bar: a black pill floating above the screen, one round button per tab, the current one filled green.
 * It sits in the layout (not over the content), so screens need no extra bottom padding. A screen hides it the usual way,
 * with `tabBarStyle: { display: 'none' }`, and a tab with `href: null` is not a tab.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
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
          const label = options.tabBarAccessibilityLabel ?? (typeof options.title === 'string' ? options.title : route.name)
          const badge = options.tabBarBadge
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params)
          }
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [styles.item, pressed && !focused && styles.pressed]}
            >
              {options.tabBarIcon({ focused, color: focused ? theme.primary : theme.textMuted, size: ICON })}
              {badge !== undefined && badge !== '' ? (
                <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                  <Text variant="caption" color={theme.onDanger} style={styles.badgeText}>
                    {String(badge)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 8 },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: radius.lg,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    // flat: no cast shadow
    borderWidth: 1,

  },
  item: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
})
