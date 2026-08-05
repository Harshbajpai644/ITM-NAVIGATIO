import { CAMPUS_CENTER } from './campusData.js'

/**
 * Campus map tiles:
 * - OSM streets always load (never blank)
 * - Esri satellite on top, capped at z16 — beyond that MapLibre
 *   overscales real imagery instead of Esri's
 *   "Map data not yet available" placeholders (common on this campus).
 */
export const CAMPUS_MAX_ZOOM = 17.5
export const CAMPUS_TILE_MAX_ZOOM = 16

export const CAMPUS_SATELLITE_STYLE = {
  version: 8,
  name: 'ITM Campus Map',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
      maxzoom: 19,
    },
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles © Esri',
      maxzoom: CAMPUS_TILE_MAX_ZOOM,
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      minzoom: 0,
      maxzoom: 22,
      paint: { 'raster-opacity': 1 },
    },
  ],
}

export const CAMPUS_OVERVIEW_CAMERA = {
  longitude: CAMPUS_CENTER.lng,
  latitude: 26.1376,
  zoom: 15.5,
  pitch: 0,
  bearing: 0,
}
