import { CircleAlert, CircleCheck, Clock, Info, TriangleAlert, X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from './text'
import { useTheme } from './theme'
import { radius, spacing } from './tokens'

export type MessageTone = 'info' | 'success' | 'warning' | 'danger'

type Props = {
  tone?: MessageTone
  /** one line: the state or the problem, with the user's own data */
  title: string
  /** what it means, and what happens next */
  children?: string
  /** the one action that resolves it */
  action?: ReactNode
  /** only for messages the user may put away */
  onDismiss?: () => void
}

function Message({ tone = 'info', title, children, action, onDismiss }: Props) {
  const theme = useTheme()
  const map = {
    info: { bg: theme.infoSubtle, fg: theme.onInfoSubtle, Icon: Info },
    success: { bg: theme.successSubtle, fg: theme.onSuccessSubtle, Icon: CircleCheck },
    warning: { bg: theme.warningSubtle, fg: theme.onWarningSubtle, Icon: TriangleAlert },
    danger: { bg: theme.dangerSubtle, fg: theme.onDangerSubtle, Icon: CircleAlert },
  }[tone]
  return (
    <View
      // read as one message when it holds nothing to press; with an action or a close button the parts stay reachable
      accessible={!action && !onDismiss}
      accessibilityRole={tone === 'danger' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: map.bg }]}
    >
      <map.Icon size={20} color={map.fg} />
      <View style={styles.flex}>
        <Text variant="label" color={map.fg}>
          {title}
        </Text>
        {children ? (
          <Text variant="bodySm" color={map.fg}>
            {children}
          </Text>
        ) : null}
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
      {onDismiss ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng" hitSlop={10} onPress={onDismiss}>
          <X size={18} color={map.fg} />
        </Pressable>
      ) : null}
    </View>
  )
}

/** Rung 2 of the feedback ladder: a message inside the section it talks about. Write it as what happened · what it means · what next. */
export function InlineMessage(props: Props) {
  return <Message {...props} />
}

/** Rung 3: a condition that affects the whole screen (shop paused, debt, offline, under review); stays until it ends, with the action that resolves it. */
export function Banner(props: Props) {
  return <Message {...props} />
}

/**
 * Rung 5: the screen at the end of a flow (order placed, shop submitted, payment failed): what happened, what it means, what happens
 * next in order, and the way forward. Never a bare "Thành công".
 */
export function ResultPage({
  status = 'success',
  title,
  description,
  next,
  primary,
  secondary,
}: {
  status?: 'success' | 'pending' | 'danger'
  title: string
  description?: string
  next?: string[]
  primary?: ReactNode
  secondary?: ReactNode
}) {
  const theme = useTheme()
  const map = {
    success: { bg: theme.successSubtle, fg: theme.onSuccessSubtle, Icon: CircleCheck },
    pending: { bg: theme.infoSubtle, fg: theme.onInfoSubtle, Icon: Clock },
    danger: { bg: theme.dangerSubtle, fg: theme.onDangerSubtle, Icon: CircleAlert },
  }[status]
  return (
    <View style={styles.result}>
      <View style={[styles.resultIcon, { backgroundColor: map.bg }]}>
        <map.Icon size={32} color={map.fg} />
      </View>
      <Text variant="title1" style={styles.center}>
        {title}
      </Text>
      {description ? (
        <Text tone="secondary" style={styles.center}>
          {description}
        </Text>
      ) : null}
      {next?.length ? (
        <View style={[styles.steps, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          {next.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNo, { backgroundColor: theme.accentSubtle }]}>
                <Text variant="caption" color={theme.onAccentSubtle}>
                  {i + 1}
                </Text>
              </View>
              <Text style={styles.flex}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.buttons}>
        {primary}
        {secondary}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, borderRadius: radius.card, padding: spacing.md },
  flex: { flex: 1, gap: 2 },
  action: { marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm },
  result: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxxl },
  resultIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  steps: { alignSelf: 'stretch', gap: spacing.md, borderWidth: 1, borderRadius: radius.card, padding: spacing.lg },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepNo: { width: 24, height: 24, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  buttons: { alignSelf: 'stretch', gap: spacing.sm },
})
