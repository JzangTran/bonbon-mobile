import { View } from 'react-native'

/** Expo web: the web help center in an iframe. */
export function HelpView({ url }: { url: string }) {
  return (
    <View style={{ flex: 1 }}>
      <iframe src={url} title="Trung tâm trợ giúp" style={{ border: 0, width: '100%', height: '100%' }} />
    </View>
  )
}
