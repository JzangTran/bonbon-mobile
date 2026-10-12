/**
 * The illustrations as plain path data, so the web and the app draw the same pictures. Every picture is a bowl or a gear on a 160 x 120
 * canvas, in two tones: `line` (strokes, the brand colour) and `soft` (fills, the same colour faded). No faces and no bitmaps.
 *
 * Drawn for bonbon in the loose, hand-made line style of the Open Peeps library (https://www.openpeeps.com/, CC0); none of the
 * library's files are used.
 */
export type IllustrationName = 'empty' | 'no-result' | 'error' | 'maintenance' | 'success'

export type Shape = {
  d: string
  /** `line` draws a stroke, `soft` fills with the faded tone. */
  tone: 'line' | 'soft'
  /** Stroke width for `line`; default 3. */
  width?: number
  /** Fainter than the rest (steam, ground). */
  faint?: boolean
}

const ground: Shape = { d: 'M24 108 H136', tone: 'line', width: 3, faint: true }
const bowl = (shift = 0): Shape[] => [
  { d: `M${40 + shift} 64 H${120 + shift} C${120 + shift} 88 ${104 + shift} 102 ${80 + shift} 102 C${56 + shift} 102 ${40 + shift} 88 ${40 + shift} 64 Z`, tone: 'soft' },
  { d: `M${40 + shift} 64 H${120 + shift} C${120 + shift} 88 ${104 + shift} 102 ${80 + shift} 102 C${56 + shift} 102 ${40 + shift} 88 ${40 + shift} 64 Z`, tone: 'line' },
  { d: `M${34 + shift} 64 H${126 + shift}`, tone: 'line' },
  { d: `M${64 + shift} 106 H${96 + shift}`, tone: 'line' },
]

const GEAR_TEETH = [
  'M100 52 H107',
  'M60 52 H53',
  'M80 72 V79',
  'M80 32 V25',
  'M94.1 66.1 L99.1 71.1',
  'M65.9 66.1 L60.9 71.1',
  'M65.9 37.9 L60.9 32.9',
  'M94.1 37.9 L99.1 32.9',
]

export const SHAPES: Record<IllustrationName, Shape[]> = {
  // an empty bowl with the steam gone
  empty: [
    ground,
    ...bowl(),
    { d: 'M64 50 C58 42 70 36 64 28', tone: 'line', faint: true },
    { d: 'M80 50 C74 42 86 36 80 28', tone: 'line', faint: true },
    { d: 'M96 50 C90 42 102 36 96 28', tone: 'line', faint: true },
  ],
  // a small bowl and a magnifier that found nothing
  'no-result': [
    ground,
    { d: 'M22 76 H70 C70 94 60 104 46 104 C32 104 22 94 22 76 Z', tone: 'soft' },
    { d: 'M22 76 H70 C70 94 60 104 46 104 C32 104 22 94 22 76 Z', tone: 'line' },
    { d: 'M17 76 H75', tone: 'line' },
    { d: 'M78 52 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0', tone: 'soft' },
    { d: 'M78 52 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0', tone: 'line' },
    { d: 'M116 68 L136 90', tone: 'line', width: 6 },
    { d: 'M92 52 H108', tone: 'line', faint: true },
  ],
  // a cracked bowl under a warning sign
  error: [
    ground,
    ...bowl(),
    { d: 'M80 64 L73 76 L85 84 L77 102', tone: 'line', width: 4 },
    { d: 'M66 30 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0', tone: 'soft' },
    { d: 'M66 30 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0', tone: 'line' },
    { d: 'M80 23 V32', tone: 'line', width: 4 },
    { d: 'M80 37.5 V38', tone: 'line', width: 4 },
  ],
  // a gear on a workbench
  maintenance: [
    { d: 'M40 104 H120', tone: 'line', width: 3, faint: true },
    { d: 'M60 52 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0', tone: 'soft' },
    { d: 'M60 52 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0', tone: 'line' },
    { d: 'M72 52 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0', tone: 'line' },
    ...GEAR_TEETH.map((d): Shape => ({ d, tone: 'line', width: 5 })),
    { d: 'M60 104 L68 90 H92 L100 104', tone: 'line' },
  ],
  // a bowl with a tick
  success: [
    ground,
    ...bowl(),
    { d: 'M62 38 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0', tone: 'soft' },
    { d: 'M72 38 L81 47 L97 29', tone: 'line', width: 5 },
  ],
}
