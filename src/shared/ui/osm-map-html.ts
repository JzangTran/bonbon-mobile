const STYLE = process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty'
const MAPLIBRE = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl'

export type OsmMapProps = {
  lat: number
  lng: number
  height: number
  /** The phone's position, drawn as a blue dot. */
  me?: { lat: number; lng: number } | null
  pinColor: string
}

/** A page with a MapLibre map of OpenStreetMap data: streets, water and buildings, pinch to zoom, a pin, the GPS dot and the credit. */
export function osmMapHtml({ lat, lng, me, pinColor }: OsmMapProps) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${MAPLIBRE}.css"><style>html,body,#map{margin:0;height:100%;width:100%}.me{width:14px;height:14px;border-radius:50%;background:#2F7BF6;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.4)}</style></head>
<body><div id="map"></div><script src="${MAPLIBRE}.js"></script><script>
const map=new maplibregl.Map({container:'map',style:${JSON.stringify(STYLE)},center:[${lng},${lat}],zoom:15.5,attributionControl:{compact:true}});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
new maplibregl.Marker({color:${JSON.stringify(pinColor)}}).setLngLat([${lng},${lat}]).addTo(map);
${me ? `const dot=document.createElement('div');dot.className='me';new maplibregl.Marker({element:dot}).setLngLat([${me.lng},${me.lat}]).addTo(map);` : ''}
</script></body></html>`
}
