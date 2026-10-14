import { useEffect } from 'react'

/** Expo web: every page needs a title for screen readers and browser tabs (WCAG 2.4.2). */
export function DocumentTitle() {
  useEffect(() => {
    if (!document.title) document.title = 'bonbon'
  }, [])
  return null
}
