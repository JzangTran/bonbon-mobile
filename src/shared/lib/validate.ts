import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import type { Tx } from '@/shared/i18n'

/**
 * The backend's input rules (common/validation), so a mistake is shown under the field before anything is sent. The server checks
 * again; these only save a round trip. Kept the same as bonbon-web's src/shared/lib/validate.ts.
 */

const EMAIL = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]{1,64}(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/
const PHONE_SHAPE = /^(0|\+84)\d{8,10}$/
const NAME = /^[\p{L}\p{M}]+(?:[ .'-]{1,2}[\p{L}\p{M}]+)*\.?$/u
const vi: Tx = (text) => text

/** An address mail can be sent to: a dot and a top-level domain after the @, no spaces or double dots. */
export const isEmail = (value: string) => value.trim().length <= 254 && EMAIL.test(value.trim())

/** The phone without the spaces, dots and dashes people type to read it. */
export const compactPhone = (value: string) => value.replace(/[\s.()-]/g, '')

/** A Vietnamese number that exists, by Google's numbering data; `any` also allows a landline with its area code. */
export function isVnPhone(value: string, kind: 'mobile' | 'any' = 'mobile') {
  const v = compactPhone(value)
  if (!PHONE_SHAPE.test(v)) return false
  const phone = parsePhoneNumberFromString(v, 'VN')
  if (!phone || phone.countryCallingCode !== '84' || !phone.isValid()) return false
  const type = phone.getType()
  return kind === 'mobile' ? type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE' : type === 'MOBILE' || type === 'FIXED_LINE' || type === 'FIXED_LINE_OR_MOBILE'
}

/** A person's name: letters of any language with single spaces, dots, apostrophes or hyphens between, at least two letters. */
export function isPersonName(value: string) {
  const v = value.trim()
  if (v === '') return true
  const letters = [...v].filter((c) => /\p{L}/u.test(c)).length
  return letters >= 2 && NAME.test(v)
}

const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '123123123', '11111111', '00000000', '88888888', '66666666', '99999999', '87654321',
  '12341234', '11223344', '123456789a', '1234567a', 'password', 'password1', 'password123', 'passw0rd', 'iloveyou', 'qwertyui',
  'qwerty123', 'qwertyuiop', '1qaz2wsx', 'abc12345', 'abcd1234', 'a1234567', 'aa123456', 'asdfghjk', 'zxcvbnm1', 'admin123',
  'welcome1', 'letmein1', 'sunshine', 'princess', 'football', 'baseball', 'matkhau', 'matkhau1', 'matkhau123', 'anhyeuem',
  'emyeuanh', 'yeuemmaimai', 'vietnam1', 'vietnam123', 'hanoi123', 'saigon123', 'bonbon123', 'bonbon2026', 'bonbon2027',
])

/** Why a new password would be refused by the server, or null. */
export function passwordProblem(password: string, email?: string, name?: string, tx: Tx = vi): string | null {
  if (password.length < 8) return tx('Mật khẩu cần ít nhất 8 ký tự.', 'Use at least 8 characters.')
  if (password.length > 100) return tx('Mật khẩu tối đa 100 ký tự.', 'Use at most 100 characters.')
  const lower = password.toLowerCase()
  if (COMMON_PASSWORDS.has(lower)) return tx('Mật khẩu này quá phổ biến và dễ bị đoán. Hãy chọn mật khẩu khác.', 'This password is too common and easy to guess.')
  if (new Set(password).size <= 2) return tx('Mật khẩu không được chỉ lặp lại một vài ký tự.', 'Do not just repeat one or two characters.')
  if (isRun(lower)) return tx('Mật khẩu không được là dãy ký tự liên tiếp như 12345678 hay abcdefgh.', 'Do not use a run such as 12345678 or abcdefgh.')
  const local = (email ?? '').trim().toLowerCase().split('@')[0]
  if (local.length >= 4 && lower.includes(local)) return tx('Mật khẩu không được chứa email của bạn.', 'Do not use your email in the password.')
  const compactName = (name ?? '').toLowerCase().replace(/\s+/g, '')
  if (compactName.length >= 4 && lower.replace(/\s+/g, '').includes(compactName)) return tx('Mật khẩu không được chứa họ tên của bạn.', 'Do not use your name in the password.')
  return null
}

function isRun(s: string) {
  const step = s.charCodeAt(1) - s.charCodeAt(0)
  if (Math.abs(step) !== 1) return false
  for (let i = 2; i < s.length; i++) if (s.charCodeAt(i) - s.charCodeAt(i - 1) !== step) return false
  return true
}

/** 0 to 4 for the strength bar, after the hard rules above pass. */
export function passwordStrength(password: string, email?: string, name?: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0
  if (passwordProblem(password, email, name)) return 1
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length
  const score = (password.length >= 12 ? 2 : 1) + (kinds >= 3 ? 1 : 0) + (password.length >= 16 ? 1 : 0)
  return Math.min(4, score + 1) as 2 | 3 | 4
}

export const BANK_ACCOUNT = /^\d{6,19}$/
