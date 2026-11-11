import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { osmMapHtml, type OsmMapProps } from './osm-map-html'
import { radius } from './tokens'

/** An OpenStreetMap map. In a web view so that it also runs in Expo Go, which cannot load a native map library. */
export function OsmMap(props: OsmMapProps) {
  return (
    <View style={[styles.frame, { height: props.height }]}>
      <WebView originWhitelist={['*']} source={{ html: osmMapHtml(props), baseUrl: 'https://bonbon.app' }} nestedScrollEnabled scrollEnabled={false} javaScriptEnabled />
    </View>
  )
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: radius.md },
})
