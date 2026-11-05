import { Image } from 'expo-image'

/** The bonbon bear for a state screen; one picture per moment (see web/src/shared/assets/mascot/README.md for the briefs). */
const PICTURES = {
  'empty-orders': { source: require('../../../../assets/mascot/empty-orders.webp'), ratio: 1.093 },
  'all-clear': { source: require('../../../../assets/mascot/all-clear.webp'), ratio: 0.915 },
  'empty-chat': { source: require('../../../../assets/mascot/empty-chat.webp'), ratio: 0.915 },
  'empty-notifications': { source: require('../../../../assets/mascot/empty-notifications.webp'), ratio: 0.915 },
  maintenance: { source: require('../../../../assets/mascot/maintenance.webp'), ratio: 1.5 },
  search: { source: require('../../../../assets/mascot/search.webp'), ratio: 1.2 },
  update: { source: require('../../../../assets/mascot/update.webp'), ratio: 1.5 },
  error: { source: require('../../../../assets/mascot/error.webp'), ratio: 0.833 },
} as const

export type MascotPose = keyof typeof PICTURES

/**
 * The bear picture for `pose` (transparent background). Decorative, so it is hidden from screen readers; the text beside it speaks.
 * `height` fixes the box, so pictures of different shapes take the same room; without it the height follows the picture.
 */
export function MascotArt({ pose, width = 160, height }: { pose: MascotPose; width?: number; height?: number }) {
  const { source, ratio } = PICTURES[pose]
  return <Image source={source} alt="" aria-hidden accessible={false} contentFit="contain" style={height ? { width, height } : { width, aspectRatio: ratio }} />
}
