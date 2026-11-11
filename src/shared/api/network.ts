import * as Network from 'expo-network'
import { Platform } from 'react-native'

/**
 * Whether the phone itself has a connection, kept up to date in the background, so an error can say whose problem it is: no
 * network on the phone, or a bonbon server that does not answer. Unknown counts as online (the error then blames the server).
 * The watch starts on first use, and never while the web build renders pages on the server (no window there).
 */
let offline = false
let watching = false

function update(state: Network.NetworkState) {
  offline = state.isConnected === false || state.isInternetReachable === false
}

function watch() {
  if (watching || (Platform.OS === 'web' && typeof window === 'undefined')) return
  watching = true
  void Network.getNetworkStateAsync().then(update).catch(() => undefined)
  Network.addNetworkStateListener(update)
}

watch()

export function isOffline(): boolean {
  watch()
  return offline
}
