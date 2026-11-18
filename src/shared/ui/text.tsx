import { Text as RNText, type TextProps } from 'react-native'
import { useTheme } from './theme'
import { useTextScale } from './text-scale'
import { typography, type ColorScheme, type TypographyVariant } from './tokens'

/** Three levels of emphasis, the link colour and the status colours (design v5), the same names as the web <Text tone>. */
export type TextTone = 'default' | 'secondary' | 'tertiary' | 'disabled' | 'link' | 'success' | 'warning' | 'danger' | 'info'

const TONE: Record<TextTone, keyof ColorScheme> = {
  default: 'text',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  disabled: 'textDisabled',
  link: 'link',
  success: 'onSuccessSubtle',
  warning: 'onWarningSubtle',
  danger: 'onDangerSubtle',
  info: 'onInfoSubtle',
}

type Props = TextProps & {
  /** one of the eight named styles (title1, title2, title3, body, bodySm, label, caption; display = title1 on phones), or a v4 alias */
  variant?: TypographyVariant
  tone?: TextTone
  /** v4: same as tone="secondary" */
  muted?: boolean
  /** an explicit colour wins over the tone (for text on a coloured fill) */
  color?: string
}

/**
 * Text in one of the named styles and one tone. Titles are announced as headings. The phone's font size setting is followed up to
 * 200 % (WCAG 1.4.4); the in-app text size (100/120/140 %) comes on top.
 */
export function Text({ variant = 'body', tone, muted, color, style, accessibilityRole, ...props }: Props) {
  const theme = useTheme()
  const { factor } = useTextScale()
  const base = typography[variant]
  const scaled = factor === 1 ? base : { ...base, fontSize: base.fontSize * factor, lineHeight: base.lineHeight * factor }
  const resolved = color ?? theme[TONE[tone ?? (muted ? 'secondary' : 'default')]]
  const isTitle = variant === 'title1' || variant === 'headline' || variant === 'display'
  return (
    <RNText
      maxFontSizeMultiplier={2}
      accessibilityRole={accessibilityRole ?? (isTitle ? 'header' : undefined)}
      style={[scaled, { color: resolved }, style]}
      {...props}
    />
  )
}
