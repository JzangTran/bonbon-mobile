import { Checkbox } from './checkbox'

/**
 * Stand-in for reCAPTCHA v2 until the WebView integration is built: the development backend runs with
 * captcha disabled and accepts any token. Production needs the real widget (follow-up issue).
 */
export function Captcha({ token, onToken }: { token: string | null; onToken: (token: string | null) => void }) {
  return (
    <Checkbox checked={token !== null} onChange={(checked) => onToken(checked ? 'dev-captcha' : null)} muted>
      Tôi không phải robot (bản dev)
    </Checkbox>
  )
}
