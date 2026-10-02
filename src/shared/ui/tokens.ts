/**
 * bonbon design tokens — values from docs/reference/design-tokens.md (contrast checked there).
 * Screens never use raw colors; they read these through shared/ui components or useTheme().
 */

export const palette = {
  primary50: '#FFF1F3',
  primary400: '#FF7A93',
  primary500: '#F0476C',
  primary600: '#D9264F',
  primary700: '#B81E43',
  caramel400: '#F5B83D',
  caramel700: '#A15C07',
  pandan700: '#2E7D4F',
  white: '#FFFFFF',
  ink: '#1C1917',
} as const

const light = {
  background: '#FFFAF5',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F4',
  divider: '#E7E5E4',
  borderInput: '#8A837D',
  text: '#1C1917',
  textMuted: '#57534E',
  primary: palette.primary600,
  primaryPressed: palette.primary700,
  onPrimary: palette.white,
  primarySubtle: palette.primary50,
  onPrimarySubtle: palette.primary700,
  success: '#15803D',
  successSubtle: '#F0FDF4',
  onSuccessSubtle: '#15803D',
  warning: '#B45309',
  warningSubtle: '#FFFBEB',
  onWarningSubtle: '#92400E',
  danger: '#B91C1C',
  dangerSubtle: '#FEF2F2',
  onDangerSubtle: '#B91C1C',
  info: '#1D4ED8',
  infoSubtle: '#EFF6FF',
  onInfoSubtle: '#1D4ED8',
  caramel: palette.caramel400,
  onCaramel: palette.ink,
} as const

export type ColorScheme = { [K in keyof typeof light]: string }

const dark: ColorScheme = {
  ...light,
  background: '#1C1917',
  surface: '#292524',
  surfaceMuted: '#292524',
  divider: 'rgba(255,255,255,0.1)',
  borderInput: '#78716C',
  text: '#FAFAF9',
  textMuted: '#A8A29E',
  primary: palette.primary400,
  primaryPressed: palette.primary500,
  onPrimary: palette.ink,
  primarySubtle: '#3A2A2E',
  onPrimarySubtle: '#FFD6DE',
}

export const colors = { light: light as ColorScheme, dark }

export const fonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} as const

export const typography = {
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
  bodySm: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular },
  titleSm: { fontSize: 18, lineHeight: 26, fontFamily: fonts.semibold },
  title: { fontSize: 20, lineHeight: 28, fontFamily: fonts.semibold },
  headline: { fontSize: 24, lineHeight: 32, fontFamily: fonts.bold },
  display: { fontSize: 30, lineHeight: 38, fontFamily: fonts.bold },
} as const

export type TypographyVariant = keyof typeof typography

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const

export const radius = { sm: 8, md: 12, pill: 999 } as const

/** ≥44pt iOS / 48dp Android; the seller's "next status" button uses `large`. */
export const touchTarget = { min: 48, large: 56 } as const
