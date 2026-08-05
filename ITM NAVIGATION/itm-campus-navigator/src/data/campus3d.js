import { CAMPUS_CENTER } from './campusData.js'

/**
 * Campus map tiles:
 * - Carto streets underlay (OSM official tiles often block apps → blank map)
 * - Esri satellite on top, capped at z16
 */
export const CAMPUS_MAX_ZOOM = 16
export const CAMPUS_MIN_ZOOM = 14.5
export const CAMPUS_TILE_MAX_ZOOM = 16

export const CAMPUS_SATELLITE_STYLE = {
  version: 8,
  name: 'ITM Campus Map',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap © CARTO',
      maxzoom: 20,
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
  zoom: 15.8,
  pitch: 0,
  bearing: 0,
}
