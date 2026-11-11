import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'
import { Platform } from 'react-native'

export type Locale = 'vi' | 'en'
/** A text in both languages, picked by the language in use: `tx('Đăng nhập', 'Sign in')`. */
export type Tx = (vi: string, en: string) => string

const KEY = 'bonbon.locale'
let locale: Locale = 'vi'
const listeners = new Set<() => void>()

function publish(next: Locale) {
  locale = next
  listeners.forEach((listener) => listener())
}

// the web build also renders on the server, where there is no storage to read
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  void AsyncStorage.getItem(KEY)
    .then((saved) => {
      if (saved === 'vi' || saved === 'en') publish(saved)
    })
    .catch(() => undefined)
}

/** Changes the language at once for every screen that reads it, and remembers it on this device. */
export function setLocale(next: Locale) {
  publish(next)
  void AsyncStorage.setItem(KEY, next).catch(() => undefined)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, () => locale, () => 'vi' as Locale)
}

export function useTx(): Tx {
  const current = useLocale()
  return (vi, en) => (current === 'en' ? en : vi)
}
