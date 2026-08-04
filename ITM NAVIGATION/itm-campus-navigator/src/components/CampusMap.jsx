import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Map, { Marker, NavigationControl } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CAMPUS_CENTER } from '../data/campusData.js'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

function haversineM(a, b) {
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

/** Project [lng,lat][] → screen px polyline + arrow heads. */
function useProjectedRoute(mapRef, pathCoords, viewState) {
  const [screen, setScreen] = useState({ line: '', arrows: [] })

  useEffect(() => {
    const map = mapRef.current?.getMap?.()
    if (!map || pathCoords.length < 2) {
      setScreen({ line: '', arrows: [] })
      return undefined
    }

    const project = () => {
      try {
        const pts = pathCoords.map(([lng, lat]) => map.project({ lng, lat }))
        const line = pts.map((p) => `${p.x},${p.y}`).join(' ')
        const arrows = []
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i]
          const b = pts[i + 1]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len = Math.hypot(dx, dy)
          if (len < 28) continue
          const t = 0.55
          const x = a.x + dx * t
          const y = a.y + dy * t
          const ang = (Math.atan2(dy, dx) * 180) / Math.PI
          arrows.push({ x, y, ang, key: `${i}-${Math.round(x)}-${Math.round(y)}` })
        }
        setScreen({ line, arrows })
      } catch (_) {
        setScreen({ line: '', arrows: [] })
      }
    }

    project()
    map.on('move', project)
    map.on('zoom', project)
    map.on('resize', project)
    return () => {
      map.off('move', project)
      map.off('zoom', project)
      map.off('resize', project)
    }
  }, [mapRef, pathCoords, viewState])

  return screen
}

export default function CampusMap({ userPos, block, onArrived }) {
  const mapRef = useRef(null)

  const [viewState, setViewState] = useState({
    longitude: block?.lng ?? CAMPUS_CENTER.lng,
    latitude: block?.lat ?? CAMPUS_CENTER.lat,
    zoom: 18,
    pitch: 0,
    bearing: 0,
  })
  const [mapTick, setMapTick] = useState(0)

  // Exact live GPS ↔ destination distance (no Dijkstra / no hubs)
  const liveDistanceM = useMemo(() => {
    if (!userPos || !block) return null
    return haversineM(userPos, block)
  }, [userPos, block])

  // Straight accurate line: your live coords → destination coords
  const pathCoords = useMemo(() => {
    if (!userPos || !block) return []
    return [
      [userPos.lng, userPos.lat],
      [block.lng, block.lat],
    ]
  }, [userPos, block])

  const projected = useProjectedRoute(mapRef, pathCoords, { ...viewState, mapTick })

  const fitBoth = useCallback(() => {
    if (!mapRef.current || !userPos || !block) return
    try {
      const map = mapRef.current.getMap()
      map.fitBounds(
        [
          [Math.min(userPos.lng, block.lng), Math.min(userPos.lat, block.lat)],
          [Math.max(userPos.lng, block.lng), Math.max(userPos.lat, block.lat)],
        ],
        { padding: 100, duration: 600, maxZoom: 19, pitch: 0 }
      )
    } catch (_) {}
  }, [userPos, block])

  // Keep camera centered between accurate pins
  useEffect(() => {
    if (!userPos || !block) return
    const d = liveDistanceM ?? Infinity
    if (d < 600) {
      setViewState((v) => ({
        ...v,
        longitude: (userPos.lng + block.lng) / 2,
        latitude: (userPos.lat + block.lat) / 2,
        zoom: d < 80 ? 19 : d < 200 ? 18.2 : Math.max(v.zoom, 17.5),
        pitch: 0,
      }))
    } else {
      fitBoth()
    }
  }, [userPos, block, liveDistanceM, fitBoth])

  useEffect(() => {
    if (!onArrived || liveDistanceM == null) return
    if (liveDistanceM < 25) onArrived()
  }, [liveDistanceM, onArrived])

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState)
  }, [])

  const onLoad = useCallback(() => {
    setMapTick((t) => t + 1)
  }, [])

  if (!userPos || !block) return null

  const shownDistance = Math.round(liveDistanceM ?? 0)
  const shownMinutes = Math.max(1, Math.round(shownDistance / 80))
  const accuracyM =
    userPos.accuracy != null && Number.isFinite(userPos.accuracy)
      ? Math.round(userPos.accuracy)
      : null

  return (
    <div className="map-card map-card-full" style={{ position: 'relative' }}>
      <div className="maplibre-3d-full" style={{ position: 'relative' }}>
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
                <strong>You (live)</strong>
                <span>
                  {fmtCoord(userPos.lat)}, {fmtCoord(userPos.lng)}
                </span>
                {accuracyM != null && <span>±{accuracyM} m</span>}
              </div>
            </div>
          </Marker>
        </Map>

        {projected.line && (
          <svg className="route-svg-overlay" aria-hidden="true">
            <polyline
              points={projected.line}
              fill="none"
              stroke="#ffffff"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
            <polyline
              points={projected.line}
              fill="none"
              stroke="#00C2A8"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {projected.arrows.map((a) => (
              <g key={a.key} transform={`translate(${a.x} ${a.y}) rotate(${a.ang})`}>
                <polygon points="0,-5 12,0 0,5" fill="#0F4C81" stroke="#ffffff" strokeWidth="1" />
              </g>
            ))}
          </svg>
        )}
      </div>

      <div className="map-3d-badge">Live GPS accuracy · Direct line</div>

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
            {accuracyM != null && (
              <>
                <br />
                <span className="map-coord-mins">GPS accuracy ±{accuracyM} m</span>
              </>
            )}
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
