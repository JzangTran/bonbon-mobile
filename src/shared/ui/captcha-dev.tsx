import { useTx } from '@/shared/i18n'
import { Checkbox } from './checkbox'

/** Without a site key (development): the dev backend runs with CAPTCHA off and accepts any token. */
export function DevCaptcha({ token, onToken }: { token: string | null; onToken: (token: string | null) => void }) {
  const tx = useTx()
  return (
    <Checkbox checked={token !== null} onChange={(checked) => onToken(checked ? 'dev-captcha' : null)} muted>
      {tx('Tôi không phải robot (bản dev, chưa cấu hình reCAPTCHA)', 'I am not a robot (dev build, reCAPTCHA not set up)')}
    </Checkbox>
  )
}
