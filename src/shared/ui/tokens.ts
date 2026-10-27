/**
 * bonbon design tokens v2 (deep green) — values from docs/reference/design-tokens.md (contrast checked there).
 * Screens never use raw colors; they read these through shared/ui components or useTheme().
 */

export const palette = {
  green50: '#E8F5EE',
  green100: '#CDEBDA',
  green500: '#00A44A',
  green600: '#007F3A',
  green700: '#006C35',
  green800: '#005C2E',
  green900: '#0B3B24',
  amber50: '#FFF6E0',
  amber400: '#FFB020',
  amber800: '#8A5100',
  white: '#FFFFFF',
  ink: '#14201A',
} as const

const light = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F6F4',
  divider: '#E3E8E5',
  borderInput: '#7C8A83',
  /** hairline around cards and bars (decorative) */
  border: '#E6E9E7',
  text: palette.ink,
  textMuted: '#4B5A52',
  primary: palette.green600,
  primaryPressed: palette.green700,
  onPrimary: palette.white,
  primarySubtle: palette.green50,
  onPrimarySubtle: palette.green700,
  success: '#006C35',
  successSubtle: palette.green50,
  onSuccessSubtle: '#006C35',
  warning: '#A15C00',
  warningSubtle: '#FFF4E0',
  onWarningSubtle: '#8A4B00',
  danger: '#C42B1C',
  onDanger: palette.white,
  dangerSubtle: '#FDECEA',
  onDangerSubtle: '#B3261E',
  info: '#1D5BD8',
  infoSubtle: '#EAF1FF',
  onInfoSubtle: '#1D4FB8',
  highlightSubtle: palette.amber50,
  onHighlightSubtle: palette.amber800,
  imageSlot: '#E9EEEB',
  /** v3: the floating tab bar, the round filter button and two-tone headlines */
  ink: palette.ink,
  headlineSoft: '#7C8A83',
  pillPale: '#EDF1EF',
} as const

export type ColorScheme = { [K in keyof typeof light]: string }

const dark: ColorScheme = {
  background: '#0E1512',
  surface: '#16201B',
  surfaceMuted: '#1E2A24',
  divider: 'rgba(255,255,255,0.1)',
  borderInput: '#5E7066',
  border: 'rgba(255,255,255,0.10)',
  text: '#E6EDE9',
  textMuted: '#9DB0A5',
  primary: '#3CC77A',
  primaryPressed: '#5FD493',
  onPrimary: '#0E1512',
  primarySubtle: '#12301F',
  onPrimarySubtle: '#7FD9A6',
  success: '#3CC77A',
  successSubtle: '#12301F',
  onSuccessSubtle: '#7FD9A6',
  warning: '#F5C26B',
  warningSubtle: '#33240A',
  onWarningSubtle: '#F5C26B',
  danger: '#F07B6E',
  onDanger: '#0E1512',
  dangerSubtle: '#3A1714',
  onDangerSubtle: '#F4A39A',
  info: '#9EBCFF',
  infoSubtle: '#14223F',
  onInfoSubtle: '#9EBCFF',
  highlightSubtle: '#2E2410',
  onHighlightSubtle: '#F2CB7A',
  imageSlot: '#1E2A24',
  ink: '#0E1512',
  headlineSoft: '#7C8A83',
  pillPale: '#1E2A24',
}

export const colors = { light: light as ColorScheme, dark }

/** Be Vietnam Pro (loaded in app-shell); 800 only for the wordmark and big headlines. */
export const fonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extrabold: 'BeVietnamPro_800ExtraBold',
} as const

export const typography = {
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
  bodySm: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular },
  titleSm: { fontSize: 18, lineHeight: 26, fontFamily: fonts.semibold },
  title: { fontSize: 20, lineHeight: 28, fontFamily: fonts.semibold },
  headline: { fontSize: 24, lineHeight: 32, fontFamily: fonts.bold },
  display: { fontSize: 30, lineHeight: 38, fontFamily: fonts.bold },
  /** the bonbon wordmark only */
  brand: { fontSize: 34, lineHeight: 40, fontFamily: fonts.extrabold, letterSpacing: -0.7 },
} as const

export type TypographyVariant = keyof typeof typography

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const

/**
 * One shape for the whole product, the same as the web (owner decisions 2026-10-20 and 2026-10-27, after gitbook.com): buttons, chips,
 * tabs, badges and search fields are pills (`pill`); fields and icon buttons `md` 8 (was: buttons, fields, chips,
 * tabs, badges, icon buttons); surfaces `lg` 12 (cards, notices, sheets, photos, the tab bar); `media` and `card` are 12 too.
 * `pill` (999) only for what is truly round: progress tracks, the sheet handle, count bubbles. `sm` is for tiny marks.
 */
export const radius = { sm: 4, md: 8, lg: 12, media: 12, card: 12, pill: 999 } as const

/** ≥44pt iOS / 48dp Android; the seller's "next status" button uses `large`. */
export const touchTarget = { min: 48, large: 56 } as const
