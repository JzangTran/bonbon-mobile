import type { ImageSource } from 'expo-image'

/**
 * Temporary stand-in photos (Unsplash, see assets/mock/CREDITS.md) for shops and dishes that have no photo yet, so the screens look
 * like the finished app. Set EXPO_PUBLIC_MOCK_PHOTOS=false to show the empty slot instead; replace the files in assets/mock later.
 */
const COM = require('../../../assets/mock/com.jpg')
const BUN = require('../../../assets/mock/bun.jpg')
const PHO = require('../../../assets/mock/pho-bowl.jpg')
const BANH_MI = require('../../../assets/mock/banh-mi.jpg')
const DRINK = require('../../../assets/mock/tra-chanh.jpg')
const OTHER: ImageSource[] = [COM, BUN, PHO, BANH_MI, DRINK, require('../../../assets/mock/pho.jpg'), require('../../../assets/mock/banh-mi-tray.jpg')]

const ENABLED = process.env.EXPO_PUBLIC_MOCK_PHOTOS !== 'false'

/** What the name says it is: bánh mì, phở, bún, cơm, a drink or dessert. Unaccented, lower case. */
function byName(name: string): ImageSource | undefined {
  const n = name.normalize('NFD').replace(/\p{M}+/gu, '').replace(/đ/g, 'd').toLowerCase()
  if (/banh mi/.test(n)) return BANH_MI
  if (/pho/.test(n)) return PHO
  if (/bun|mien|mi /.test(n)) return BUN
  if (/com|xoi/.test(n)) return COM
  if (/tra|che|sua chua|nuoc|cafe|ca phe/.test(n)) return DRINK
  return undefined
}

/** A picture that suits the name when it names a known dish, else the same one for the same id, so a shop keeps its picture between visits. */
export function mockPhoto(id: string, name = ''): ImageSource | undefined {
  if (!ENABLED) return undefined
  const named = byName(name)
  if (named) return named
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return OTHER[hash % OTHER.length]
}
