/** Haversine distance in meters between two {lat,lng} points */
export function haversine(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/** Approximate meters → lat/lng offsets at a given latitude */
function offsetLatLng(lat, lng, eastM, northM) {
  const dLat = northM / 111320
  const dLng = eastM / (111320 * Math.cos((lat * Math.PI) / 180))
  return [lng + dLng, lat + dLat]
}

/** GeoJSON Polygon circle around campus center */
export function circlePolygon(center, radiusM, points = 64) {
  const ring = []
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI
    ring.push(offsetLatLng(center.lat, center.lng, radiusM * Math.cos(angle), radiusM * Math.sin(angle)))
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [ring] },
  }
}

/** Small square footprint for 3D extrusion at a building point */
export function buildingFootprint(lat, lng, sizeM = 16) {
  const half = sizeM / 2
  const sw = offsetLatLng(lat, lng, -half, -half)
  const se = offsetLatLng(lat, lng, half, -half)
  const ne = offsetLatLng(lat, lng, half, half)
  const nw = offsetLatLng(lat, lng, -half, half)
  return [sw, se, ne, nw, sw]
}

export function buildingsGeoJSON(blocks, defaultHeightM = 14) {
  return {
    type: 'FeatureCollection',
    features: blocks.map((b) => ({
      type: 'Feature',
      properties: {
        id: b.id,
        name: b.name,
        height: b.heightM ?? defaultHeightM,
        active: false,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [buildingFootprint(b.lat, b.lng)],
      },
    })),
  }
}