import { splitMessage } from './feedback'
import { InlineMessage } from './message'

/**
 * A form's result or problem under it (design v5, rung 2), kept under its v4 name for the screens that use it: an InlineMessage with
 * an icon, the first sentence as the title and the rest as what it means / what to do. Announced to screen readers.
 */
export function Notice({ tone, message }: { tone: 'error' | 'success' | 'warning'; message: string | null }) {
  if (!message) return null
  const { title, body } = splitMessage(message)
  return (
    <InlineMessage tone={tone === 'error' ? 'danger' : tone} title={title}>
      {body}
    </InlineMessage>
  )
}
