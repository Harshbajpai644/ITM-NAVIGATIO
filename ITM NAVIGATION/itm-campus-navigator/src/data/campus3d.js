import { CAMPUS_CENTER } from './campusData.js'

/**
 * Exact campus look = real satellite imagery of ITM Gwalior
 * (same ground truth as Google Maps satellite — track, field, buildings, NH-44).
 * Fake extruded boxes are intentionally not used; they never match real footprints.
 */
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
      maxzoom: 19,
    },
    // Light labels overlay so road names stay readable on dark satellite
    labels: {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Labels © Esri',
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
    {
      id: 'labels',
      type: 'raster',
      source: 'labels',
      minzoom: 0,
      maxzoom: 22,
      paint: { 'raster-opacity': 0.85 },
    },
  ],
}

/** Framed like the Google Maps campus screenshot (track + university + highway). */
export const CAMPUS_OVERVIEW_CAMERA = {
  longitude: CAMPUS_CENTER.lng,
  latitude: 26.1376,
  zoom: 15.7,
  pitch: 0,
  bearing: 0,
}

/** Closer nav view while walking — still real satellite, slight tilt optional. */
export const CAMPUS_NAV_CAMERA = {
  pitch: 0,
  bearing: 0,
  maxZoom: 19,
}
