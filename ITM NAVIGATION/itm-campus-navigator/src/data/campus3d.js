import { BLOCKS, CAMPUS_CENTER } from './campusData.js'

/** meters → degrees at campus latitude */
function mToDegLat(m) {
  return m / 111320
}
function mToDegLng(m, lat) {
  return m / (111320 * Math.cos((lat * Math.PI) / 180))
}

/** Axis-aligned rectangle footprint around a pin (approx campus block). */
function rectRing(lat, lng, widthM, depthM, bearingDeg = 0) {
  const hw = widthM / 2
  const hd = depthM / 2
  const rad = (bearingDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const corners = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
    [-hw, -hd],
  ]
  return corners.map(([x, y]) => {
    const xr = x * cos - y * sin
    const yr = x * sin + y * cos
    return [lng + mToDegLng(xr, lat), lat + mToDegLat(yr)]
  })
}

/** Per-building footprint size / height tuned from satellite layout. */
const BUILDING_3D = {
  admission: { w: 38, d: 28, h: 14, bearing: 18, color: '#c4d4e4' },
  'mg-block': { w: 72, d: 42, h: 22, bearing: 15, color: '#d7e0ea' },
  'ldv-block': { w: 55, d: 36, h: 18, bearing: 18, color: '#c9d6e4' },
  'pc-block': { w: 48, d: 32, h: 16, bearing: 12, color: '#bccbd9' },
  library: { w: 45, d: 35, h: 12, bearing: 18, color: '#b8c8d8' },
  'kirloskar-block': { w: 60, d: 40, h: 20, bearing: 10, color: '#dfe6ee' },
  'jcb-block': { w: 50, d: 34, h: 16, bearing: 12, color: '#c5d2e0' },
  placement: { w: 32, d: 24, h: 10, bearing: 15, color: '#cad6e3' },
  hostel: { w: 70, d: 28, h: 24, bearing: 95, color: '#d2dbe6' },
  'sports-arena': { w: 55, d: 40, h: 10, bearing: 0, color: '#a8c4b0' },
  playground: { w: 80, d: 50, h: 2, bearing: 0, color: '#7cb342' },
  canteen: { w: 28, d: 22, h: 8, bearing: 20, color: '#e8d5b5' },
  'itm-gate': { w: 18, d: 12, h: 6, bearing: 90, color: '#9aa8b6' },
  'main-parking': { w: 90, d: 50, h: 1.5, bearing: 15, color: '#6b7280' },
  'itm-global-school': { w: 85, d: 55, h: 14, bearing: 5, color: '#cfd8e2' },
}

export function buildCampusBuildingsGeoJSON() {
  const features = BLOCKS.map((b) => {
    const cfg = BUILDING_3D[b.id] || { w: 40, d: 30, h: 12, bearing: 15, color: '#c5d0dc' }
    return {
      type: 'Feature',
      properties: {
        id: b.id,
        name: b.name,
        height: cfg.h,
        base: 0,
        color: cfg.color,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [rectRing(b.lat, b.lng, cfg.w, cfg.d, cfg.bearing)],
      },
    }
  })

  // Simple oval track / field hint near sports area (flat extrusion)
  features.push({
    type: 'Feature',
    properties: {
      id: 'athletic-track',
      name: 'Athletic Track',
      height: 0.8,
      base: 0,
      color: '#a67c52',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        rectRing(26.13655, 78.20635, 160, 95, 8),
      ],
    },
  })

  return { type: 'FeatureCollection', features }
}

/** MapLibre style: satellite basemap (Esri) + empty overlay for our layers */
export const CAMPUS_3D_STYLE = {
  version: 8,
  name: 'ITM Campus 3D',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles © Esri',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
}

export const CAMPUS_3D_CAMERA = {
  longitude: CAMPUS_CENTER.lng,
  latitude: CAMPUS_CENTER.lat,
  zoom: 16.6,
  pitch: 58,
  bearing: -28,
}
