/** What each way of failing an order, and each consequence of penalty points, is called on screen. */
export const FAULT_LABEL: Record<string, string> = {
  SHOP_REJECTED: 'Quán từ chối đơn',
  NO_RESPONSE: 'Quán không trả lời kịp',
  HANDOVER_TIMEOUT: 'Không giao đi kịp sau khi nhận',
  SHOP_CANCELLED: 'Quán huỷ sau khi nhận',
  INCIDENT_FULL_REFUND: 'Khiếu nại được hoàn cả đơn',
  NO_SHOW_SHOP_AT_FAULT: 'Quán không đến khi giao',
}

export const CONSEQUENCE_LABEL: Record<string, string> = {
  NONE: 'Bình thường',
  WARNING: 'Cảnh báo',
  RESTRICTION_SCHEDULED: 'Sắp bị hạn chế hiển thị',
  RESTRICTED: 'Đang bị hạn chế hiển thị',
}

export const APPEAL_LABEL: Record<string, string> = {
  PENDING: 'Kháng nghị đang chờ',
  ACCEPTED: 'Kháng nghị được chấp nhận',
  REJECTED: 'Kháng nghị không được chấp nhận',
}
