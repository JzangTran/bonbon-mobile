import { StyleSheet, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from './theme'

/** Two soft waves along the bottom of a sign-in screen, in light tints of the brand green. Decorative. */
export function WaveBackdrop() {
  const theme = useTheme()
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox="0 0 390 180" preserveAspectRatio="none">
        <Path fill={theme.primarySubtle} fillOpacity={0.7} d="M0 70C50 30 110 20 170 45s120 50 170 28c20-9 37-22 50-30V180H0Z" />
        <Path fill={theme.primarySubtle} d="M0 120c60-30 120-20 180 0s130 25 210-10v70H0Z" />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({ wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 } })
