import { CAMPUS_CENTER } from './campusData.js'

/**
 * Real ITM Gwalior satellite (Esri World Imagery).
 * This campus only has sharp tiles up to ~z17; higher zoom returns
 * Esri's "Map data not yet available" placeholder — so source maxzoom is 17
 * and MapLibre overscales those tiles instead of fetching blank ones.
 */
export const CAMPUS_MAX_ZOOM = 18
export const CAMPUS_TILE_MAX_ZOOM = 17

export const CAMPUS_SATELLITE_STYLE = {
  version: 8,
  name: 'ITM Campus Satellite',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles © Esri — World Imagery',
      maxzoom: CAMPUS_TILE_MAX_ZOOM,
    },
    labels: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Labels © Esri',
      maxzoom: CAMPUS_TILE_MAX_ZOOM,
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
    {
      id: 'labels',
      type: 'raster',
      source: 'labels',
      minzoom: 0,
      maxzoom: 22,
      paint: { 'raster-opacity': 0.8 },
    },
  ],
}

/** Overview framing: track + university + highway (like Google campus view). */
export const CAMPUS_OVERVIEW_CAMERA = {
  longitude: CAMPUS_CENTER.lng,
  latitude: 26.1376,
  zoom: 15.7,
  pitch: 0,
  bearing: 0,
}
