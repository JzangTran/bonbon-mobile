import { Text as RNText, type TextProps } from 'react-native'
import { useTheme } from './theme'
import { typography, type TypographyVariant } from './tokens'

type Props = TextProps & { variant?: TypographyVariant; muted?: boolean; color?: string }

export function Text({ variant = 'body', muted, color, style, ...props }: Props) {
  const theme = useTheme()
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      style={[typography[variant], { color: color ?? (muted ? theme.textMuted : theme.text) }, style]}
      {...props}
    />
  )
}
