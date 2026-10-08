import { formatVnd } from './format'

/** What each kind of ledger entry is called on screen. */
export const LEDGER_TYPE_LABEL: Record<string, string> = {
  ONLINE_EARNING: 'Đơn online đã giao',
  COD_COMMISSION: 'Hoa hồng đơn tiền mặt',
  PAYOUT: 'bonbon chuyển tiền cho quán',
  COLLECTION: 'Quán trả hoa hồng',
  ADJUSTMENT: 'Điều chỉnh',
  CASE_REFUND: 'Hoàn tiền theo khiếu nại',
  CASE_COMMISSION_REVERSAL: 'Hoàn hoa hồng theo khiếu nại',
  TAX_WITHHOLDING: 'Thuế khấu trừ',
}

/** "+46.000 ₫" or "−4.000 ₫": the sign is part of the meaning of a ledger amount. */
export function formatSigned(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—'
  if (amount === 0) return formatVnd(0)
  return `${amount > 0 ? '+' : '−'}${formatVnd(Math.abs(amount))}`
}

const vietnamDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' })

/** The calendar day in Vietnam as yyyy-mm-dd, whatever the phone's own time zone is. */
export function vietnamToday(now: number): string {
  return vietnamDay.format(new Date(now))
}

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "05/10" from "2026-10-05". */
export function shortDay(day: string): string {
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}
