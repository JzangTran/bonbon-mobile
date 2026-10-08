/** What each kind and state of an order case is called on screen. */
export const CASE_TYPE_LABEL: Record<string, string> = {
  NOT_RECEIVED: 'Chưa nhận được hàng',
  MISSING_ITEM: 'Thiếu món',
  WRONG_ITEM: 'Sai món',
  QUALITY: 'Chất lượng',
  CUSTOMER_NO_SHOW: 'Khách vắng mặt',
}

/** The same state seen by the customer and by the shop. */
export const CASE_STATUS_LABEL: Record<string, { customer: string; shop: string }> = {
  AWAITING_SHOP: { customer: 'Đang chờ quán trả lời', shop: 'Chờ quán trả lời' },
  AWAITING_CUSTOMER: { customer: 'Chờ bạn trả lời', shop: 'Chờ khách trả lời' },
  OPEN: { customer: 'Quản trị viên đang xem xét', shop: 'Chờ quản trị viên quyết' },
  UPHELD: { customer: 'Được chấp nhận, bạn sẽ được hoàn tiền', shop: 'Đã chấp nhận' },
  DISMISSED: { customer: 'Không được chấp nhận', shop: 'Đã bác bỏ' },
}
