import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Map, { Source, Layer, Marker, NavigationControl } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CAMPUS_CENTER } from '../data/campusData.js'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

function haversine(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function fmtCoord(n) {
  return Number(n).toFixed(6)
}

/** Evenly spaced dots along a [lng,lat][] line for “dot dot” path. */
function buildDotFeatures(coords, spacingM = 12) {
  if (!coords || coords.length < 2) return []
  const features = []
  let carry = 0
  for (let i = 0; i < coords.length - 1; i++) {
    const a = { lng: coords[i][0], lat: coords[i][1] }
    const b = { lng: coords[i + 1][0], lat: coords[i + 1][1] }
    const seg = haversine(a, b)
    if (seg < 0.01) continue
    let d = carry
    while (d <= seg) {
      const t = d / seg
      const lng = a.lng + (b.lng - a.lng) * t
      const lat = a.lat + (b.lat - a.lat) * t
      features.push({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [lng, lat] },
      })
      d += spacingM
    }
    carry = d - seg
  }
  return features
}

export default function CampusMap({ userPos, block, onArrived }) {
  const mapRef = useRef(null)
  const lastRoutedPos = useRef(null)

  const [viewState, setViewState] = useState({
    longitude: block?.lng ?? CAMPUS_CENTER.lng,
    latitude: block?.lat ?? CAMPUS_CENTER.lat,
    zoom: 17.5,
    pitch: 0,
    bearing: 0,
  })
  const [routeCoords, setRouteCoords] = useState([])
  const [routeDistanceM, setRouteDistanceM] = useState(null)
  const [routeDurationS, setRouteDurationS] = useState(null)

  const liveDistanceM = useMemo(() => {
    if (!userPos || !block) return null
    return haversine(userPos, block)
  }, [userPos, block])

  // Always have at least a straight path between you → destination
  const pathCoords = useMemo(() => {
    if (routeCoords.length > 1) return routeCoords
    if (userPos && block) {
      return [
        [userPos.lng, userPos.lat],
        [block.lng, block.lat],
      ]
    }
    return []
  }, [routeCoords, userPos, block])

  const routeGeoJSON = useMemo(
    () => ({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: pathCoords },
    }),
    [pathCoords]
  )

  const dotsGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: buildDotFeatures(pathCoords, 14),
    }),
    [pathCoords]
  )

  const fitBoth = useCallback(() => {
    if (!mapRef.current || !userPos || !block) return
    try {
      const map = mapRef.current.getMap()
      const bounds = [
        [Math.min(userPos.lng, block.lng), Math.min(userPos.lat, block.lat)],
        [Math.max(userPos.lng, block.lng), Math.max(userPos.lat, block.lat)],
      ]
      map.fitBounds(bounds, { padding: 90, duration: 600, maxZoom: 18.5, pitch: 0 })
    } catch (_) {}
  }, [userPos, block])

  useEffect(() => {
    if (!userPos || !block) return
    const d = liveDistanceM ?? Infinity
    if (d < 800) {
      setViewState((v) => ({
        ...v,
        longitude: userPos.lng,
        latitude: userPos.lat,
        zoom: Math.max(v.zoom, 17.8),
        pitch: 0,
      }))
    } else {
      fitBoth()
    }
  }, [userPos, block, liveDistanceM, fitBoth])

  useEffect(() => {
    if (!userPos || !block) return
    const moved = lastRoutedPos.current ? haversine(lastRoutedPos.current, userPos) : Infinity
    if (moved < 20 && lastRoutedPos.current) return

    let cancelled = false
    const url =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${userPos.lng},${userPos.lat};${block.lng},${block.lat}?overview=full&geometries=geojson`

    // Instant fallback so path always visible
    setRouteCoords([
      [userPos.lng, userPos.lat],
      [block.lng, block.lat],
    ])

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.routes?.[0]) {
          const route = data.routes[0]
          setRouteCoords(route.geometry.coordinates)
          setRouteDistanceM(route.distance)
          setRouteDurationS(route.duration)
          lastRoutedPos.current = userPos
        } else {
          setRouteDistanceM(null)
          setRouteDurationS(null)
        }
      })
      .catch(() => {
        if (cancelled) return
        setRouteDistanceM(null)
        setRouteDurationS(null)
      })

    return () => {
      cancelled = true
    }
  }, [userPos, block])

  useEffect(() => {
    if (!onArrived || liveDistanceM == null) return
    if (liveDistanceM < 40) onArrived()
  }, [liveDistanceM, onArrived])

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState)
  }, [])

  if (!userPos || !block) return null

  const shownDistance = Math.round(liveDistanceM ?? routeDistanceM ?? 0)
  const shownMinutes =
    routeDurationS != null
      ? Math.max(1, Math.round(routeDurationS / 60))
      : Math.max(1, Math.round(shownDistance / 80))

  return (
    <div className="map-card map-card-full" style={{ position: 'relative' }}>
      <div className="maplibre-3d-full">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={onMove}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
          maxPitch={60}
          attributionControl
        >
          <NavigationControl position="top-right" />

          {pathCoords.length > 1 && (
            <>
              <Source id="route" type="geojson" data={routeGeoJSON}>
                {/* Soft under-glow */}
                <Layer
                  id="route-glow"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': '#5eead4',
                    'line-width': 10,
                    'line-opacity': 0.35,
                    'line-blur': 2,
                  }}
                />
                {/* Dotted path */}
                <Layer
                  id="route-dots-line"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': '#00C2A8',
                    'line-width': 4,
                    'line-opacity': 0.95,
                    'line-dasharray': [0.4, 1.6],
                  }}
                />
                {/* Direction arrows along the path */}
                <Layer
                  id="route-arrows"
                  type="symbol"
                  layout={{
                    'symbol-placement': 'line',
                    'symbol-spacing': 42,
                    'text-field': '▶',
                    'text-size': 16,
                    'text-keep-upright': false,
                    'text-rotation-alignment': 'map',
                    'text-pitch-alignment': 'viewport',
                    'text-allow-overlap': true,
                    'text-ignore-placement': true,
                  }}
                  paint={{
                    'text-color': '#0F4C81',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 1.5,
                  }}
                />
              </Source>

              {/* Extra circle dots for clearer “dot dot” look */}
              <Source id="route-dots" type="geojson" data={dotsGeoJSON}>
                <Layer
                  id="route-dot-circles"
                  type="circle"
                  paint={{
                    'circle-radius': 3.5,
                    'circle-color': '#00C2A8',
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#ffffff',
                  }}
                />
              </Source>
            </>
          )}

          <Marker longitude={block.lng} latitude={block.lat} anchor="bottom">
            <div className="coord-pin dest-pin">
              <div className="coord-pin-title">{block.name}</div>
              <div className="coord-pin-xy">
                {fmtCoord(block.lat)}, {fmtCoord(block.lng)}
              </div>
            </div>
          </Marker>

          <Marker longitude={userPos.lng} latitude={userPos.lat} anchor="bottom">
            <div className="coord-pin you-pin">
              <div className="coord-pin-title">You (live)</div>
              <div className="coord-pin-xy">
                {fmtCoord(userPos.lat)}, {fmtCoord(userPos.lng)}
              </div>
            </div>
          </Marker>
        </Map>
      </div>

      <div className="map-3d-badge">Dotted path · Arrows · Live distance</div>

      <button type="button" className="map-float-btn map-float-single" onClick={fitBoth}>
        Fit both pins
      </button>

      <div className="map-coord-panel">
        <div className="map-coord-row">
          <span className="map-coord-label">Destination</span>
          <span className="map-coord-value">
            {block.name}
            <br />
            <code>
              {fmtCoord(block.lat)}, {fmtCoord(block.lng)}
            </code>
          </span>
        </div>
        <div className="map-coord-row">
          <span className="map-coord-label">Your live GPS</span>
          <span className="map-coord-value">
            <code>
              {fmtCoord(userPos.lat)}, {fmtCoord(userPos.lng)}
            </code>
          </span>
        </div>
        <div className="map-coord-row map-coord-dist">
          <span className="map-coord-label">Distance now</span>
          <span className="map-coord-value">
            <strong>{shownDistance} m</strong>
            <span className="map-coord-mins"> · ~{shownMinutes} min walk</span>
          </span>
        </div>
      </div>
    </div>
  )
}
