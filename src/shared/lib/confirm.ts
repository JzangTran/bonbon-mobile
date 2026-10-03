import { Alert, Platform } from 'react-native'

/** Asks before a destructive action; Alert buttons do not exist on the web target, so it uses confirm there. */
export function confirm(title: string, message: string, confirmLabel = 'Đồng ý'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false)
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Huỷ', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ])
  })
}
