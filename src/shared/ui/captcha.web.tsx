import { useEffect, useState } from 'react'
import { env } from '@/shared/config/env'
import { DevCaptcha } from './captcha-dev'

type Grecaptcha = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => number
}
type WindowWithRecaptcha = Window & { grecaptcha?: Grecaptcha; onBonbonRecaptchaLoad?: () => void }

const SCRIPT_ID = 'recaptcha-script'

/** Expo web: the reCAPTCHA v2 widget renders straight into the page, as on bonbon-web. */
export function Captcha({ token, onToken }: { token: string | null; onToken: (token: string | null) => void }) {
  const [box, setBox] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!env.recaptchaSiteKey || !box) return
    const target = box
    const w = window as WindowWithRecaptcha
    const render = () => {
      if (!w.grecaptcha || target.childElementCount > 0) return
      w.grecaptcha.render(target, {
        sitekey: env.recaptchaSiteKey,
        callback: (t) => onToken(t),
        'expired-callback': () => onToken(null),
      })
    }
    if (w.grecaptcha) {
      render()
      return
    }
    w.onBonbonRecaptchaLoad = render
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onBonbonRecaptchaLoad&render=explicit&hl=vi'
      script.async = true
      document.head.appendChild(script)
    }
  }, [box, onToken])

  if (!env.recaptchaSiteKey) return <DevCaptcha token={token} onToken={onToken} />
  return <div ref={setBox} />
}
