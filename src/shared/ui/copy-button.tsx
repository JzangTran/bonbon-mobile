import * as Clipboard from 'expo-clipboard'
import { Check, Copy } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { AccessibilityInfo, Platform, Pressable } from 'react-native'
import { useTheme } from './theme'

/**
 * Copies a value and says so on the button itself (design v5 feedback, rung 1), the same as the web: the icon turns into a tick for
 * 2 s and the change is announced. No message elsewhere on the screen.
 */
export function CopyButton({ value, label, size = 16 }: { value: string; /** what is copied: "số tài khoản" */ label: string; size?: number }) {
  const theme = useTheme()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setDone(false), 2000)
    return () => clearTimeout(id)
  }, [done])
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={done ? `Đã chép ${label}` : `Chép ${label}`}
      accessibilityLiveRegion="polite"
      hitSlop={12}
      onPress={async () => {
        await Clipboard.setStringAsync(value)
        setDone(true)
        if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(`Đã chép ${label}`)
      }}
    >
      {done ? <Check size={size} color={theme.success} /> : <Copy size={size} color={theme.textSecondary} />}
    </Pressable>
  )
}
