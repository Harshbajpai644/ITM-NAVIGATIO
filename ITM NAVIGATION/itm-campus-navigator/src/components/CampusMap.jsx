import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Map, { Marker, NavigationControl } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CAMPUS_CENTER } from '../data/campusData.js'
import { shortestCampusRoute } from '../data/campusGraph.js'
import { haversineM } from '../utils/dijkstra.js'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const ROUTE_SOURCE = 'campus-route'
const ROUTE_LAYERS = ['route-casing', 'route-line', 'route-arrows']

function fmtCoord(n) {
  return Number(n).toFixed(6)
}

/** Add midpoints so short routes still paint as a clear solid line. */
function densifyLine(coords, stepM = 8) {
  if (!coords || coords.length < 2) return coords || []
  const out = [coords[0]]
  for (let i = 0; i < coords.length - 1; i++) {
    const a = { lng: coords[i][0], lat: coords[i][1] }
    const b = { lng: coords[i + 1][0], lat: coords[i + 1][1] }
    const seg = haversineM(a, b)
    const steps = Math.max(1, Math.ceil(seg / stepM))
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      out.push([a.lng + (b.lng - a.lng) * t, a.lat + (b.lat - a.lat) * t])
    }
  }
  return out
}

function removeRoute(map) {
  if (!map?.getStyle) return
  try {
    for (const id of ROUTE_LAYERS) {
      if (map.getLayer(id)) map.removeLayer(id)
    }
    if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE)
  } catch (_) {}
}

function paintRoute(map, coords) {
  if (!map || !coords || coords.length < 2) return
  const data = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: densifyLine(coords, 6) },
  }

  const src = map.getSource(ROUTE_SOURCE)
  if (src) {
    src.setData(data)
    return
  }

  map.addSource(ROUTE_SOURCE, { type: 'geojson', data })

  map.addLayer({
    id: 'route-casing',
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#ffffff',
      'line-width': 10,
      'line-opacity': 0.95,
    },
  })

  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: ROUTE_SOURCE,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#00C2A8',
      'line-width': 6,
      'line-opacity': 1,
    },
  })

  map.addLayer({
    id: 'route-arrows',
    type: 'symbol',
    source: ROUTE_SOURCE,
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 36,
      'text-field': '▶',
      'text-size': 15,
      'text-keep-upright': false,
      'text-rotation-alignment': 'map',
      'text-pitch-alignment': 'viewport',
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#0F4C81',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  })
}

export default function CampusMap({ userPos, block, onArrived }) {
  const mapRef = useRef(null)
  const lastRoutedPos = useRef(null)
  const [mapReady, setMapReady] = useState(false)

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

  const fitBoth = useCallback(() => {
    if (!mapRef.current || !userPos || !block) return
    try {
      const map = mapRef.current.getMap()
      const lngs = pathCoords.length > 1 ? pathCoords.map((c) => c[0]) : [userPos.lng, block.lng]
      const lats = pathCoords.length > 1 ? pathCoords.map((c) => c[1]) : [userPos.lat, block.lat]
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 100, duration: 600, maxZoom: 18.5, pitch: 0 }
      )
    } catch (_) {}
  }, [userPos, block, pathCoords])

  useEffect(() => {
    if (!userPos || !block) return
    const d = liveDistanceM ?? Infinity
    if (d < 800) {
      setViewState((v) => ({
        ...v,
        longitude: (userPos.lng + block.lng) / 2,
        latitude: (userPos.lat + block.lat) / 2,
        zoom: Math.max(v.zoom, 17.6),
        pitch: 0,
      }))
    } else {
      fitBoth()
    }
  }, [userPos, block, liveDistanceM, fitBoth])

  // Dijkstra shortest route
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

  // Draw solid path on the MapLibre map (imperative = always visible)
  useEffect(() => {
    const map = mapRef.current?.getMap?.()
    if (!map || !mapReady || pathCoords.length < 2) return

    const draw = () => {
      if (!map.isStyleLoaded()) return
      try {
        paintRoute(map, pathCoords)
      } catch (_) {}
    }

    if (map.isStyleLoaded()) {
      draw()
      return undefined
    }

    map.once('load', draw)
    return () => {
      map.off('load', draw)
    }
  }, [pathCoords, mapReady])

  useEffect(() => {
    if (!onArrived || liveDistanceM == null) return
    if (liveDistanceM < 40) onArrived()
  }, [liveDistanceM, onArrived])

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState)
  }, [])

  const onLoad = useCallback(() => {
    setMapReady(true)
    const map = mapRef.current?.getMap?.()
    if (map && pathCoords.length > 1) paintRoute(map, pathCoords)
  }, [pathCoords])

  useEffect(() => {
    return () => {
      const map = mapRef.current?.getMap?.()
      if (map) removeRoute(map)
    }
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
          onLoad={onLoad}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
          maxPitch={60}
          attributionControl
        >
          <NavigationControl position="top-right" />

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

      <div className="map-3d-badge">Dijkstra shortest · Solid path · Arrows</div>

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
