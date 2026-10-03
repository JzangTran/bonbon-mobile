import { Checkbox } from './checkbox'

/** Without a site key (development): the dev backend runs with CAPTCHA off and accepts any token. */
export function DevCaptcha({ token, onToken }: { token: string | null; onToken: (token: string | null) => void }) {
  return (
    <Checkbox checked={token !== null} onChange={(checked) => onToken(checked ? 'dev-captcha' : null)} muted>
      Tôi không phải robot (bản dev, chưa cấu hình reCAPTCHA)
    </Checkbox>
  )
}
