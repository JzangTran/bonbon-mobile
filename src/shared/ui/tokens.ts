/**
 * bonbon design tokens v5 (owner decision 2026-11-19: direction A "Cam Bếp", 10 px controls, Be Vietnam Pro everywhere), the same
 * values as the web. They come from the bonbon-design repo (design/ in the umbrella), generated into ./generated/tokens.ts. This file
 * only adds the names the screens already use (v4) on top of the v5 roles, so no screen carries a colour, size or radius of its own.
 * To change a value, change bonbon-design/tokens and run `npm run sync` there.
 */
import { colors as v5, fonts as v5fonts, layout, motion, overlayShadow, palette as v5palette, radius as v5radius, space, type } from './generated/tokens'

/** The reference palettes (prefer the roles in `colors`); `amber400` stays for the rating stars. */
export const palette = { ...v5palette, amber400: v5palette.amber['400'] } as const

type V5 = typeof v5.light

/** v4 names, kept so screens keep working; new code uses the v5 role names. */
function withLegacy(c: V5) {
  return {
    ...c,
    surfaceMuted: c.surfaceSubtle,
    borderInput: c.borderStrong,
    textMuted: c.textSecondary,
    primary: c.accent,
    primaryPressed: c.accentPressed,
    onPrimary: c.onAccent,
    primarySubtle: c.accentSubtle,
    primaryBorder: c.accentBorder,
    onPrimarySubtle: c.onAccentSubtle,
    // the band at the top of the payments tab, under white text: the brand, not the success colour (status colours never decorate)
    payBand: c.accent,
    highlightSubtle: c.promoSubtle,
    onHighlightSubtle: c.promo,
    ink: c.text,
    headlineSoft: c.textTertiary,
    pillPale: c.surfaceSubtle,
  }
}

export type ColorScheme = { [K in keyof ReturnType<typeof withLegacy>]: string }

export const colors: { light: ColorScheme; dark: ColorScheme } = { light: withLegacy(v5.light), dark: withLegacy(v5.dark) }

export { layout, motion, overlayShadow }

/** Be Vietnam Pro, loaded in app-shell; extrabold is for the wordmark only. */
export const fonts = v5fonts

/**
 * The eight named styles (display, title1, title2, title3, body, bodySm, label, caption) plus the v4 names as aliases of the nearest
 * style: titleSm = title3, title = title2, headline = title1, display (mobile) = title1. `brand` is the wordmark only.
 */
export const typography = {
  ...type,
  titleSm: type.title3,
  title: type.title2,
  headline: type.title1,
  display: type.title1,
  brand: { fontSize: 34, lineHeight: 40, fontFamily: v5fonts.extrabold, letterSpacing: -0.7 },
} as const

export type TypographyVariant = keyof typeof typography

/** v4 spacing names on the 4 px grid (v5 numbered steps are in `space`). */
export const spacing = { xs: space['1'], sm: space['2'], md: space['3'], lg: space['4'], xl: space['5'], xxl: space['6'], xxxl: space['8'] } as const
export { space }

/**
 * Shape (v5): `control` 10 for buttons, fields, chips, tabs, icon buttons; `card` 12 for cards, images, notices, menus; `sheet` 20
 * for the top of a bottom sheet; `pill` / `full` only for what is truly round (avatars, switches, dots, count bubbles, progress).
 * `md` is the control radius and `lg`/`media`/`card` the card radius, as before.
 */
export const radius = {
  sm: v5radius.xs,
  md: v5radius.control,
  lg: v5radius.card,
  media: v5radius.card,
  card: v5radius.card,
  control: v5radius.control,
  sheet: v5radius.sheet,
  pill: v5radius.full,
  full: v5radius.full,
} as const

/** ≥44 pt iOS / 48 dp Android; `large` for the main action of a screen and the seller's "next status" button. */
export const touchTarget = { min: 48, large: 56 } as const
