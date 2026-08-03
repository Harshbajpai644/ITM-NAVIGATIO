import { CAMPUS_SPINE } from '../data/campusData.js'

/** Route helpers for path-follow camera */

export function bearingDeg(from, to) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI
  const φ1 = toRad(from.lat)
  const φ2 = toRad(to.lat)
  const Δλ = toRad(to.lng - from.lng)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function nearestRouteIndex(coords, pos) {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i]
    const d = (lat - pos.lat) ** 2 + (lng - pos.lng) ** 2
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

export function lookAheadPoint(coords, index, steps = 4) {
  const i = Math.min(coords.length - 1, index + steps)
  return { lng: coords[i][0], lat: coords[i][1] }
}

/** Build campus walk path when user is far (uses real spine pins). */
export function campusPreviewPath(_center, dest) {
  const spine = CAMPUS_SPINE.map(([lng, lat]) => [lng, lat])
  if (!dest) return spine
  return [...spine, [dest.lng, dest.lat]]
}
