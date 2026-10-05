const vnd = new Intl.NumberFormat('vi-VN')

/** Money is always shown as `12.000 ₫` (ui-design-and-tech.md, common patterns). */
export function formatVnd(amount: number | null | undefined): string {
  return amount === null || amount === undefined ? '—' : `${vnd.format(amount)} ₫`
}

/** "45.000" or "45000" to 45000; empty or unreadable to undefined. */
export function parseInteger(text: string): number | undefined {
  const cleaned = text.trim().replace(/[.\s]/g, '')
  return /^\d+$/.test(cleaned) ? Number(cleaned) : undefined
}

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

/** "05/10 18:35" in Vietnam time. */
export function formatDateTime(iso: string | null | undefined): string {
  return iso ? dateTime.format(new Date(iso)) : '—'
}

/** "3 phút trước" for the last day, the date after that. */
export function formatAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—'
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'vừa xong'
  if (seconds < 3600) return `${Math.round(seconds / 60)} phút trước`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} giờ trước`
  return formatDateTime(iso)
}
