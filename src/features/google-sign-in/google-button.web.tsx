import { useEffect, useRef, useState } from 'react'
import { env } from '@/shared/config/env'

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: 'popup' }) => void
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null
function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Google Identity Services failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/** Expo web: the official Google Identity Services button, as on bonbon-web. */
export function GoogleButton({ onIdToken, onError }: { onIdToken: (idToken: string) => void; onError: (message: string) => void }) {
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const handlers = useRef({ onIdToken, onError })
  useEffect(() => {
    handlers.current = { onIdToken, onError }
  }, [onIdToken, onError])

  useEffect(() => {
    if (!env.googleWebClientId || !box) return
    const target = box
    let cancelled = false
    loadScript()
      .then(() => {
        const google = (window as Window & { google?: GoogleIdentity }).google
        if (cancelled || !google) return
        google.accounts.id.initialize({
          client_id: env.googleWebClientId,
          ux_mode: 'popup',
          callback: (response) => handlers.current.onIdToken(response.credential),
        })
        target.replaceChildren()
        google.accounts.id.renderButton(target, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: Math.min(400, target.clientWidth || 320),
          locale: 'vi',
        })
      })
      .catch(() => handlers.current.onError('Không tải được nút đăng nhập Google.'))
    return () => {
      cancelled = true
    }
  }, [box])

  if (!env.googleWebClientId) return null
  return <div ref={setBox} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
}
