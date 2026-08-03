import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Map, { Source, Layer, Marker, NavigationControl } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CAMPUS_CENTER } from '../data/campusData.js'
import { shortestCampusRoute } from '../data/campusGraph.js'
import { haversineM } from '../utils/dijkstra.js'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

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
    const seg = haversineM(a, b)
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
  const [routeMinutes, setRouteMinutes] = useState(null)
  const [viaNodes, setViaNodes] = useState(0)

  const liveDistanceM = useMemo(() => {
    if (!userPos || !block) return null
    return haversineM(userPos, block)
  }, [userPos, block])

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

  // Dijkstra shortest route on campus walk graph — recompute when you move ~12m
  useEffect(() => {
    if (!userPos || !block) return
    const moved = lastRoutedPos.current ? haversineM(lastRoutedPos.current, userPos) : Infinity
    if (moved < 12 && lastRoutedPos.current) return

    const route = shortestCampusRoute(userPos, block)
    if (route?.coords?.length > 1) {
      setRouteCoords(route.coords)
      setRouteDistanceM(route.distanceM)
      setRouteMinutes(route.minutes)
      setViaNodes(Math.max(0, (route.nodeIds?.length || 0) - 2))
      lastRoutedPos.current = userPos
    } else {
      setRouteCoords([
        [userPos.lng, userPos.lat],
        [block.lng, block.lat],
      ])
      setRouteDistanceM(liveDistanceM)
      setRouteMinutes(Math.max(1, Math.round((liveDistanceM || 0) / 80)))
      setViaNodes(0)
    }
  }, [userPos, block, liveDistanceM])

  useEffect(() => {
    if (!onArrived || liveDistanceM == null) return
    if (liveDistanceM < 40) onArrived()
  }, [liveDistanceM, onArrived])

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState)
  }, [])

  if (!userPos || !block) return null

  const shownDistance = Math.round(routeDistanceM ?? liveDistanceM ?? 0)
  const shownMinutes = routeMinutes ?? Math.max(1, Math.round(shownDistance / 80))

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
            <div className="you-avatar" aria-label="You live location">
              <div className="you-avatar-pulse" />
              <div className="you-avatar-figure">
                <span className="you-avatar-hair" />
                <span className="you-avatar-head" />
                <span className="you-avatar-torso" />
                <span className="you-avatar-arm you-avatar-arm-l" />
                <span className="you-avatar-arm you-avatar-arm-r" />
                <span className="you-avatar-leg you-avatar-leg-l" />
                <span className="you-avatar-leg you-avatar-leg-r" />
              </div>
              <div className="you-avatar-label">
                <strong>You</strong>
                <span>
                  {fmtCoord(userPos.lat)}, {fmtCoord(userPos.lng)}
                </span>
              </div>
            </div>
          </Marker>
        </Map>
      </div>

      <div className="map-3d-badge">Dijkstra shortest · Dotted path · Arrows</div>

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
          <span className="map-coord-label">Shortest route</span>
          <span className="map-coord-value">
            <strong>{shownDistance} m</strong>
            <span className="map-coord-mins">
              {' '}
              · ~{shownMinutes} min
              {viaNodes > 0 ? ` · via ${viaNodes} hubs` : ''}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
