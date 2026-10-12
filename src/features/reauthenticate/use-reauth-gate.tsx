import { useRef, useState, type ReactNode } from 'react'
import { ReauthSheet } from './reauth-sheet'
import { isReauthRequired } from './use-reauthenticate'

/**
 * For a screen whose action may answer "sign in again": {@code handle(error, retry)} opens the password sheet when that is the
 * problem (returns true, so the caller shows no error) and runs {@code retry} once the person has signed in again.
 */
export function useReauthGate(): { handle: (error: unknown, retry: () => void) => boolean; sheet: ReactNode } {
  const [open, setOpen] = useState(false)
  const retryRef = useRef<(() => void) | null>(null)
  return {
    handle: (error, retry) => {
      if (!isReauthRequired(error)) return false
      retryRef.current = retry
      setOpen(true)
      return true
    },
    sheet: (
      <ReauthSheet
        visible={open}
        onClose={() => setOpen(false)}
        onDone={() => {
          const retry = retryRef.current
          retryRef.current = null
          retry?.()
        }}
      />
    ),
  }
}
