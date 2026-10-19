import * as ImagePicker from 'expo-image-picker'

export type PickedAsset = { uri: string; mimeType?: string | null; fileName?: string | null }

const TYPES = ['image/jpeg', 'image/png', 'image/webp']
/** The server's limits (ImageSanitizer, per-use size): 5 MB, longest side 10000 px. */
const MAX_BYTES = 5 * 1024 * 1024
const MAX_SIDE = 10_000

/** Why a picked picture would be refused, in words for the person; null when it is fine. The server checks again. */
export function imageProblem(a: ImagePicker.ImagePickerAsset): string | null {
  if (a.mimeType && !TYPES.includes(a.mimeType)) return 'Chỉ nhận ảnh JPG, PNG hoặc WebP.'
  if (a.fileSize !== undefined && a.fileSize > MAX_BYTES) return 'Ảnh lớn hơn 5 MB. Hãy chọn ảnh nhỏ hơn.'
  if (a.width > MAX_SIDE || a.height > MAX_SIDE) return `Ảnh quá lớn (tối đa ${MAX_SIDE} px mỗi cạnh).`
  return null
}

/**
 * Opens the photo library and returns the pictures the server would accept; the rest come back as messages.
 * Quality 0.7 keeps phone photos well under the size limit.
 */
export async function pickImages(options: { limit: number }): Promise<{ images: PickedAsset[]; problems: string[] }> {
  const multiple = options.limit > 1
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    ...(multiple ? { allowsMultipleSelection: true, selectionLimit: options.limit } : {}),
  })
  if (picked.canceled) return { images: [], problems: [] }
  const images: PickedAsset[] = []
  const problems: string[] = []
  for (const a of picked.assets) {
    const problem = imageProblem(a)
    if (problem) problems.push(`${a.fileName ?? 'Ảnh'}: ${problem}`)
    else images.push({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName })
  }
  return { images, problems }
}
