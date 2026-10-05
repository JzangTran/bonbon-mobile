import { useEffect, useState } from 'react'

/** The current time, refreshed every second, for countdowns. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

/** "m:ss" until a deadline; "Quá hạn" once it has passed. Urgent in the last two minutes. */
export function countdown(deadline: string | undefined, now: number): { text: string; urgent: boolean } | null {
  if (!deadline) return null
  const seconds = Math.floor((new Date(deadline).getTime() - now) / 1000)
  if (seconds <= 0) return { text: 'Quá hạn', urgent: true }
  return { text: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, urgent: seconds <= 120 }
}
