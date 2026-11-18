/// <reference types="jest" />
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { Avatar, ListItem, Price, QuantityStepper, Rating } from '../display'
import { Badge, Chip, IconButton, Switch } from '../controls'
import { Input as TextField } from '../input'
import { Banner, InlineMessage, ResultPage } from '../message'
import { Text } from '../text'
import { colors } from '../tokens'
import { FeedbackHost, FeedbackRegion, splitMessage, useFeedback } from '../feedback'
import { ToastProvider, useSnackbar } from '../toast'

const light = colors.light

describe('tokens', () => {
  it('the v4 names point at the v5 roles', async () => {
    expect(light.primary).toBe(light.accent)
    expect(light.accent).toBe('#CF430D')
    expect(light.textMuted).toBe(light.textSecondary)
    expect(light.borderInput).toBe(light.borderStrong)
  })
})

describe('Text', () => {
  it('maps tones to roles and announces titles as headings', async () => {
    await render(
      <>
        <Text variant="title1">Đơn hàng</Text>
        <Text tone="secondary">2× Cơm gà</Text>
      </>,
    )
    expect(screen.getByRole('header', { name: 'Đơn hàng' })).toBeTruthy()
    expect(screen.getByText('2× Cơm gà')).toHaveStyle({ color: light.textSecondary })
  })
})

describe('IconButton', () => {
  it('has an accessible name', async () => {
    const onPress = jest.fn()
    await render(<IconButton label="Đóng" icon={null} onPress={onPress} />)
    await fireEvent.press(screen.getByRole('button', { name: 'Đóng' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})

describe('Chip', () => {
  it('announces its selected state', async () => {
    function Demo() {
      const [on, setOn] = useState(false)
      return <Chip label="Gần nhất" selected={on} onPress={() => setOn((v) => !v)} />
    }
    await render(<Demo />)
    const chip = screen.getByRole('button', { name: 'Gần nhất' })
    expect(chip).not.toBeSelected()
    await fireEvent.press(chip)
    expect(screen.getByRole('button', { name: 'Gần nhất' })).toBeSelected()
  })
})

describe('Switch', () => {
  it('the whole row is one switch', async () => {
    const onChange = jest.fn()
    await render(<Switch label="Nhận đơn" value={false} onValueChange={onChange} />)
    const sw = screen.getByRole('switch', { name: 'Nhận đơn' })
    expect(sw).not.toBeChecked()
    await fireEvent.press(sw)
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('Badge', () => {
  it('uses the status tone', async () => {
    await render(<Badge label="Đã thanh toán" tone="success" />)
    expect(screen.getByText('Đã thanh toán')).toHaveStyle({ color: light.onSuccessSubtle })
  })
})

describe('TextField', () => {
  it('shows help, then the error, and marks required', async () => {
    const { rerender } = await render(<TextField label="Số điện thoại" required help="Quán gọi số này." value="0912" />)
    expect(screen.getByLabelText('Số điện thoại, bắt buộc')).toHaveProp('accessibilityHint', 'Quán gọi số này.')
    expect(screen.getByText('Quán gọi số này.')).toBeTruthy()
    await rerender(<TextField label="Số điện thoại" required help="Quán gọi số này." error="Số điện thoại cần 10 chữ số." value="0912" />)
    expect(screen.queryByText('Quán gọi số này.')).toBeNull()
    expect(screen.getByText('Số điện thoại cần 10 chữ số.')).toBeTruthy()
    expect(screen.getByLabelText('Số điện thoại, bắt buộc')).toHaveDisplayValue('0912')
  })
})

describe('display', () => {
  it('Avatar falls back to the initial', async () => {
    await render(<Avatar name="hoàng minh anh" />)
    expect(screen.getByLabelText('hoàng minh anh')).toBeTruthy()
    expect(screen.getByText('H')).toBeTruthy()
  })
  it('ListItem is one button with its value in the name', async () => {
    const onPress = jest.fn()
    await render(<ListItem title="Địa chỉ giao hàng" trailing="Nhà" onPress={onPress} />)
    await fireEvent.press(screen.getByRole('button', { name: 'Địa chỉ giao hàng, Nhà' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
  it('Price reads both prices on sale', async () => {
    await render(<Price amount={38000} original={45000} />)
    expect(screen.getByLabelText(/38\.000.*giá cũ.*45\.000/)).toBeTruthy()
  })
  it('Rating says when there are no reviews', async () => {
    await render(<Rating score={null} count={0} />)
    expect(screen.getByText('Chưa có đánh giá')).toBeTruthy()
  })
  it('QuantityStepper stays within its limits and is adjustable', async () => {
    function Demo() {
      const [n, setN] = useState(1)
      return <QuantityStepper value={n} onChange={setN} min={1} max={2} label="Cơm gà" />
    }
    await render(<Demo />)
    expect(screen.getByRole('button', { name: 'Bớt một Cơm gà' })).toBeDisabled()
    await fireEvent.press(screen.getByRole('button', { name: 'Thêm một Cơm gà' }))
    expect(screen.getByRole('adjustable', { name: 'Số lượng Cơm gà' })).toHaveAccessibilityValue({ now: 2 })
    expect(screen.getByRole('button', { name: 'Thêm một Cơm gà' })).toBeDisabled()
  })
})

describe('feedback', () => {
  it('a danger message is an alert; the close button only when it may be put away', async () => {
    const onDismiss = jest.fn()
    await render(
      <>
        <InlineMessage tone="danger" title="Chưa lưu được món">
          Máy chủ không phản hồi.
        </InlineMessage>
        <Banner tone="warning" title="Quán đang tạm ngưng" />
      </>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Đóng' })).toBeNull()
    await render(<Banner tone="info" title="Có bản cập nhật" onDismiss={onDismiss} />)
    await fireEvent.press(screen.getByRole('button', { name: 'Đóng' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
  it('ResultPage lists what happens next', async () => {
    await render(<ResultPage title="Đã gửi đơn #1025" next={['Quán nhận đơn', 'Bạn thấy giờ giao']} />)
    expect(screen.getByRole('header', { name: 'Đã gửi đơn #1025' })).toBeTruthy()
    expect(screen.getByText('Quán nhận đơn')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })
  it('the snackbar offers Hoàn tác and disappears after 6 s', async () => {
    jest.useFakeTimers()
    const onUndo = jest.fn()
    function Trigger() {
      const { snackbar } = useSnackbar()
      return <Pressable accessibilityRole="button" accessibilityLabel="Xoá" onPress={() => snackbar({ message: 'Đã xoá món Trà đá', onUndo })} />
    }
    await render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    await fireEvent.press(screen.getByRole('button', { name: 'Xoá' }))
    expect(screen.getByText('Đã xoá món Trà đá')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Hoàn tác' }))
    expect(onUndo).toHaveBeenCalledTimes(1)
    await fireEvent.press(screen.getByRole('button', { name: 'Xoá' }))
    await act(async () => {
      jest.advanceTimersByTime(6100)
    })
    expect(screen.queryByText('Đã xoá món Trà đá')).toBeNull()
    jest.useRealTimers()
  })
})

describe('feedback ladder', () => {
  it('splits one message into a title and what it means', () => {
    expect(splitMessage('Đã lưu địa chỉ. Địa chỉ dùng được ngay.')).toEqual({ title: 'Đã lưu địa chỉ', body: 'Địa chỉ dùng được ngay.' })
  })
  it('a sheet keeps errors by its buttons and sends successes up to the screen', async () => {
    function Actions() {
      const feedback = useFeedback()
      return (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="ok" onPress={() => feedback.success('Đã lưu địa chỉ. Địa chỉ dùng được ngay.')} />
          <Pressable accessibilityRole="button" accessibilityLabel="fail" onPress={() => feedback.error('Chưa lưu được địa chỉ')} />
        </>
      )
    }
    await render(
      <ToastProvider>
        <FeedbackRegion>
          <Text>screen</Text>
          <FeedbackRegion errorsOnly placement="bottom">
            <Actions />
          </FeedbackRegion>
        </FeedbackRegion>
      </ToastProvider>,
    )
    await fireEvent.press(screen.getByRole('button', { name: 'ok' }))
    expect(screen.getByText('Đã lưu địa chỉ')).toBeTruthy()
    expect(screen.getByText('Địa chỉ dùng được ngay.')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'fail' }))
    // the error stays inside the sheet's region, next to its buttons; the success is still shown above
    expect(screen.getByText('Chưa lưu được địa chỉ')).toBeTruthy()
    expect(screen.getByText('Đã lưu địa chỉ')).toBeTruthy()
  })
})

describe('feedback carry-over', () => {
  it('a message from a screen that closes right after saving moves to the screen underneath', async () => {
    function Form({ onDone }: { onDone: () => void }) {
      const feedback = useFeedback()
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="save"
          onPress={() => {
            feedback.success('Đã lưu địa chỉ. Địa chỉ dùng được ngay.')
            onDone()
          }}
        />
      )
    }
    function Stack() {
      const [formOpen, setFormOpen] = useState(true)
      return (
        <FeedbackRegion>
          <Text>list</Text>
          {formOpen ? (
            <FeedbackRegion>
              <Form onDone={() => setFormOpen(false)} />
            </FeedbackRegion>
          ) : null}
        </FeedbackRegion>
      )
    }
    await render(
      <ToastProvider>
        <FeedbackHost>
          <Stack />
        </FeedbackHost>
      </ToastProvider>,
    )
    await fireEvent.press(screen.getByRole('button', { name: 'save' }))
    expect(screen.queryByRole('button', { name: 'save' })).toBeNull()
    expect(screen.getByText('Đã lưu địa chỉ')).toBeTruthy()
  })
})
