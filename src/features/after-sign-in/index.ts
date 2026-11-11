import type { Href } from 'expo-router'

let pending: Href | null = null

/** Remembers where a guest was going when the sign-in sheet opened (a tab that needs an account); null forgets it. */
export function afterSignIn(href: Href | null) {
  pending = href
}

/** Where to go now that the customer is signed in, once. */
export function takeAfterSignIn(): Href | null {
  const href = pending
  pending = null
  return href
}
