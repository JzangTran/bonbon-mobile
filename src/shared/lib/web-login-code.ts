const PREFIX = 'bonbon://qr-login?s='
const SESSION = /^[A-Za-z0-9_-]{43}$/

/** The session id inside a seller web sign-in code (login-qr-code.md), or null when the scanned code is something else. */
export function webLoginSession(data: string): string | null {
  if (!data.startsWith(PREFIX)) return null
  const id = data.slice(PREFIX.length)
  return SESSION.test(id) ? id : null
}
