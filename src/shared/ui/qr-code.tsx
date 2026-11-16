import qrcode from 'qrcode-generator'
import { useMemo } from 'react'
import Svg, { Path, Rect } from 'react-native-svg'

/** A QR code drawn as one SVG path, black on white whatever the theme (scanners need the contrast), with a quiet zone of 4 modules. */
export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const { path, count } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(value)
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`
      }
    }
    return { path: d, count: n + 8 }
  }, [value])

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${count} ${count}`} accessibilityLabel="Mã QR chuyển khoản">
      <Rect width={count} height={count} fill="#FFFFFF" />
      <Path d={path} fill="#000000" />
    </Svg>
  )
}
