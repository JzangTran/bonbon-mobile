/**
 * bonbon design tokens v4 (orange, quiet; owner decision 2026-10-27, after gitbook.com), the same values as the web.
 * White first, near-black text and two greys, hairlines only where needed, brand orange: #FE551B for large shapes and icons,
 * also for buttons, links and selected items, as GitBook does (3.22:1 on white: fine for large text and UI parts, below 4.5:1 for
 * small text; palette.orange600 #CC3D0B is the accessible shade). Screens never use raw colors; they read these through useTheme().
 */

export const palette = {
  orange50: '#FFF4EE',
  orange100: '#FFE3D4',
  orange500: '#FE551B',
  orange600: '#CC3D0B',
  orange700: '#A8320A',
  amber50: '#FFF6E0',
  amber400: '#FFB020',
  amber800: '#8A5100',
  white: '#FFFFFF',
  ink: '#1D1D1D',
} as const

const light = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F5',
  divider: '#F0F0F0',
  borderInput: '#E0E0E0',
  /** hairline, used sparingly */
  border: '#EDEDED',
  text: palette.ink,
  textMuted: '#6E6E6E',
  primary: palette.orange500,
  primaryPressed: '#EE4A12',
  onPrimary: palette.white,
  primarySubtle: palette.orange50,
  onPrimarySubtle: palette.orange500,
  success: '#1F7A3F',
  successSubtle: '#EBF6EF',
  onSuccessSubtle: '#1F6B38',
  warning: '#A15C00',
  warningSubtle: '#FFF4E0',
  onWarningSubtle: '#8A4B00',
  danger: '#C42B1C',
  onDanger: palette.white,
  dangerSubtle: '#FDECEA',
  onDangerSubtle: '#B3261E',
  info: '#1D5BD8',
  infoSubtle: '#EEF3FF',
  onInfoSubtle: '#1D4FB8',
  highlightSubtle: palette.amber50,
  onHighlightSubtle: palette.amber800,
  imageSlot: '#F2F2F2',
  ink: palette.ink,
  headlineSoft: '#A3A3A3',
  pillPale: '#F5F5F5',
} as const

export type ColorScheme = { [K in keyof typeof light]: string }

const dark: ColorScheme = {
  background: '#141414',
  surface: '#141414',
  surfaceMuted: '#222222',
  divider: 'rgba(255,255,255,0.08)',
  borderInput: 'rgba(255,255,255,0.18)',
  border: 'rgba(255,255,255,0.10)',
  text: '#ECECEC',
  textMuted: '#A3A3A3',
  primary: '#FF7A4A',
  primaryPressed: '#FF9670',
  onPrimary: '#141414',
  primarySubtle: '#2E1A10',
  onPrimarySubtle: '#FF9670',
  success: '#4FC27A',
  successSubtle: '#12301F',
  onSuccessSubtle: '#8FDCAA',
  warning: '#F5C26B',
  warningSubtle: '#33240A',
  onWarningSubtle: '#F5C26B',
  danger: '#F07B6E',
  onDanger: '#141414',
  dangerSubtle: '#3A1714',
  onDangerSubtle: '#F4A39A',
  info: '#9EBCFF',
  infoSubtle: '#14223F',
  onInfoSubtle: '#9EBCFF',
  highlightSubtle: '#2E2410',
  onHighlightSubtle: '#F2CB7A',
  imageSlot: '#262626',
  ink: '#141414',
  headlineSoft: '#6E6E6E',
  pillPale: '#222222',
}

export const colors = { light: light as ColorScheme, dark }

/** Inter, the font of app.gitbook.com (loaded in app-shell; it has the Vietnamese letters); 800 only for the wordmark and big headlines. */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const

export const typography = {
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
  bodySm: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular },
  titleSm: { fontSize: 18, lineHeight: 26, fontFamily: fonts.medium },
  title: { fontSize: 20, lineHeight: 28, fontFamily: fonts.medium },
  headline: { fontSize: 24, lineHeight: 32, fontFamily: fonts.semibold },
  display: { fontSize: 30, lineHeight: 38, fontFamily: fonts.semibold },
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
