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
