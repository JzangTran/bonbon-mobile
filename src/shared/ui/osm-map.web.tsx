import { createElement } from 'react'
import { osmMapHtml, type OsmMapProps } from './osm-map-html'
import { radius } from './tokens'

/** The same map in the browser, where there is no web view. */
export function OsmMap(props: OsmMapProps) {
  return createElement('iframe', {
    title: 'Bản đồ',
    srcDoc: osmMapHtml(props),
    style: { width: '100%', height: props.height, border: 0, borderRadius: radius.md, display: 'block' },
  })
}
