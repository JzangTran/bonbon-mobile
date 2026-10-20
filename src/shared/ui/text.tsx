import { Text as RNText, type TextProps } from 'react-native'
import { useTheme } from './theme'
import { useTextScale } from './text-scale'
import { typography, type TypographyVariant } from './tokens'

type Props = TextProps & { variant?: TypographyVariant; muted?: boolean; color?: string }

export function Text({ variant = 'body', muted, color, style, ...props }: Props) {
  const theme = useTheme()
  const { factor } = useTextScale()
  const base = typography[variant]
  const scaled = factor === 1 ? base : { ...base, fontSize: base.fontSize * factor, lineHeight: base.lineHeight * factor }
  return (
    <RNText
      // The phone's font size setting is followed up to 200 % (WCAG 1.4.4); the in-app size comes on top.
      maxFontSizeMultiplier={2}
      style={[scaled, { color: color ?? (muted ? theme.textMuted : theme.text) }, style]}
      {...props}
    />
  )
}
