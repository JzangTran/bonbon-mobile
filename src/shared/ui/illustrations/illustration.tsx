import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '../theme'
import { SHAPES, type IllustrationName } from './shapes'

/**
 * A small drawing for a screen that has nothing to show (empty list, no result, error, maintenance, success). Purely decorative, so
 * it is hidden from screen readers; drawn in the theme's primary colour, so light and dark both work.
 */
export function Illustration({ name, width = 160 }: { name: IllustrationName; width?: number }) {
  const theme = useTheme()
  return (
    <View aria-hidden>
    <Svg width={width} height={(width * 120) / 160} viewBox="0 0 160 120" fill="none">
      {SHAPES[name].map((s, i) =>
        s.tone === 'soft' ? (
          <Path key={i} d={s.d} fill={theme.primary} fillOpacity={0.14} />
        ) : (
          <Path key={i} d={s.d} stroke={theme.primary} strokeWidth={s.width ?? 3} strokeOpacity={s.faint ? 0.35 : 1} strokeLinecap="round" strokeLinejoin="round" />
        ),
      )}
    </Svg>
    </View>
  )
}
