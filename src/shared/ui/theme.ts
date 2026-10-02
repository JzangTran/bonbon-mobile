import { useColorScheme } from 'react-native'
import { colors, type ColorScheme } from './tokens'

export function useTheme(): ColorScheme {
  const scheme = useColorScheme()
  return scheme === 'dark' ? colors.dark : colors.light
}
