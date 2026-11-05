import { StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { radius, touchTarget } from '@/shared/ui'

/** The Google "G" in its own four colours (Google's sign-in branding asks for them unchanged). */
export function GoogleMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <Path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.600-.2-2.300H12v4.400h6.500c-.3 1.500-1.100 2.700-2.400 3.600v3h3.800c2.300-2.100 3.600-5.200 3.600-8.700z" />
      <Path fill="#34A853" d="M12 24c3.200 0 6-1.100 8-2.900l-3.800-3c-1.100.7-2.500 1.200-4.200 1.200-3.200 0-5.800-2.100-6.800-5H1.300v3.100C3.300 21.300 7.300 24 12 24z" />
      <Path fill="#FBBC05" d="M5.200 14.300c-.2-.7-.4-1.500-.4-2.300s.1-1.600.4-2.300V6.600H1.300C.5 8.200 0 10 0 12s.5 3.800 1.300 5.400l3.900-3.100z" />
      <Path fill="#EA4335" d="M12 4.800c1.800 0 3.300.6 4.600 1.800l3.400-3.400C17.900 1.200 15.200 0 12 0 7.300 0 3.300 2.700 1.300 6.600l3.900 3.100c1-2.900 3.600-4.900 6.800-4.900z" />
    </Svg>
  )
}

/** The round outlined button the mark sits in. */
export const googleIconStyle = StyleSheet.create({
  button: {
    alignSelf: 'center',
    width: touchTarget.min + 8,
    height: touchTarget.min + 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
}).button
