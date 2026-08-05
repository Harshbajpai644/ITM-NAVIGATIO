import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Map, { Marker, NavigationControl } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CAMPUS_SATELLITE_STYLE, CAMPUS_OVERVIEW_CAMERA, CAMPUS_MAX_ZOOM } from '../data/campus3d.js'

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

/** Compass label from you → destination (map north-up). */
function bearingLabel(from, to) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI
  const y = Math.sin(toRad(to.lng - from.lng)) * Math.cos(toRad(to.lat))
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(toRad(to.lng - from.lng))
  let brng = (toDeg(Math.atan2(y, x)) + 360) % 360
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(brng / 45) % 8]
}

/** meters → screen pixels at current map center latitude/zoom (approx). */
function metersToPixels(map, lat, meters) {
  const zoom = map.getZoom()
  const latRad = (lat * Math.PI) / 180
  const metersPerPx = (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoom)
  return meters / metersPerPx
}

function useProjectedRoute(mapRef, pathCoords, userPos, accuracyM, viewState) {
  const [screen, setScreen] = useState({ line: '', arrows: [], you: null, accR: 0 })

  useEffect(() => {
    const map = mapRef.current?.getMap?.()
    if (!map || pathCoords.length < 2) {
      setScreen({ line: '', arrows: [], you: null, accR: 0 })
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
          arrows.push({
            x: a.x + dx * t,
            y: a.y + dy * t,
            ang: (Math.atan2(dy, dx) * 180) / Math.PI,
            key: `${i}-${Math.round(a.x)}`,
          })
        }
        let you = null
        let accR = 0
        if (userPos) {
          you = map.project({ lng: userPos.lng, lat: userPos.lat })
          if (accuracyM != null && accuracyM > 0) {
            accR = metersToPixels(map, userPos.lat, accuracyM)
          }
        }
        setScreen({ line, arrows, you, accR })
      } catch (_) {
        setScreen({ line: '', arrows: [], you: null, accR: 0 })
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
  }, [mapRef, pathCoords, userPos, accuracyM, viewState])

  return screen
}

export default function CampusMap({ userPos, block, onArrived, onCalibratePin }) {
  const mapRef = useRef(null)

  const [viewState, setViewState] = useState({
    longitude: block?.lng ?? CAMPUS_OVERVIEW_CAMERA.longitude,
    latitude: block?.lat ?? CAMPUS_OVERVIEW_CAMERA.latitude,
    zoom: 16.8,
    pitch: 0,
    bearing: 0,
  })
  const [mapTick, setMapTick] = useState(0)

  const liveDistanceM = useMemo(() => {
    if (!userPos || !block) return null
    return haversineM(userPos, block)
  }, [userPos, block])

  const pathCoords = useMemo(() => {
    if (!userPos || !block) return []
    return [
      [userPos.lng, userPos.lat],
      [block.lng, block.lat],
    ]
  }, [userPos, block])

  const accuracyM =
    userPos?.accuracy != null && Number.isFinite(userPos.accuracy)
      ? Math.round(userPos.accuracy)
      : null

  // Direction unreliable when GPS circle is bigger than (or close to) distance
  const directionUnreliable =
    accuracyM != null && liveDistanceM != null && accuracyM >= Math.max(25, liveDistanceM * 0.8)

  const dir = useMemo(() => {
    if (!userPos || !block) return null
    return bearingLabel(userPos, block)
  }, [userPos, block])

  const projected = useProjectedRoute(
    mapRef,
    pathCoords,
    userPos,
    accuracyM,
    { ...viewState, mapTick }
  )

  const fitBoth = useCallback(() => {
    if (!mapRef.current || !userPos || !block) return
    try {
      const map = mapRef.current.getMap()
      const padAcc = accuracyM ? accuracyM / 111320 : 0
      map.fitBounds(
        [
          [
            Math.min(userPos.lng, block.lng) - padAcc,
            Math.min(userPos.lat, block.lat) - padAcc,
          ],
          [
            Math.max(userPos.lng, block.lng) + padAcc,
            Math.max(userPos.lat, block.lat) + padAcc,
          ],
        ],
        { padding: 100, duration: 700, maxZoom: 17.5, pitch: 0, bearing: 0 }
      )
    } catch (_) {}
  }, [userPos, block, accuracyM])

  useEffect(() => {
    if (!userPos || !block) return
    const d = liveDistanceM ?? Infinity
    if (d < 600) {
      setViewState((v) => ({
        ...v,
        longitude: (userPos.lng + block.lng) / 2,
        latitude: (userPos.lat + block.lat) / 2,
        // Keep within Esri tile coverage for this campus (avoid blank "not available")
        zoom: d < 80 ? 17.6 : d < 200 ? 17.2 : Math.min(Math.max(v.zoom, 16.6), 17.4),
        pitch: 0,
        bearing: 0,
      }))
    } else {
      fitBoth()
    }
  }, [userPos, block, liveDistanceM, fitBoth])

  useEffect(() => {
    if (!onArrived || liveDistanceM == null || directionUnreliable) return
    if (liveDistanceM < 20) onArrived()
  }, [liveDistanceM, onArrived, directionUnreliable])

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState)
  }, [])

  const onLoad = useCallback(() => {
    setMapTick((t) => t + 1)
  }, [])

  if (!userPos || !block) return null

  const shownDistance = Math.round(liveDistanceM ?? 0)
  const shownMinutes = Math.max(1, Math.round(shownDistance / 80))
  const lineColor = directionUnreliable ? '#94a3b8' : '#00C2A8'

  return (
    <div className="map-card map-card-full" style={{ position: 'relative' }}>
      <div className="maplibre-3d-full" style={{ position: 'relative' }}>
        <Map
          ref={mapRef}
          {...viewState}
          onMove={onMove}
          onLoad={onLoad}
          mapStyle={CAMPUS_SATELLITE_STYLE}
          style={{ width: '100%', height: '100%' }}
          maxZoom={CAMPUS_MAX_ZOOM}
          maxPitch={60}
          attributionControl
        >
          <NavigationControl position="top-right" />

          <Marker longitude={block.lng} latitude={block.lat} anchor="bottom">
            <div className="coord-pin dest-pin">
              <div className="coord-pin-title">{block.name}</div>
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
                {accuracyM != null && <span>±{accuracyM} m</span>}
              </div>
            </div>
          </Marker>
        </Map>

        <svg className="route-svg-overlay" aria-hidden="true">
          {/* GPS accuracy circle — real uncertainty around You */}
          {projected.you && projected.accR > 4 && (
            <circle
              cx={projected.you.x}
              cy={projected.you.y}
              r={projected.accR}
              fill="rgba(15,76,129,0.12)"
              stroke="#0F4C81"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )}

          {projected.line && (
            <>
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
                stroke={lineColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={directionUnreliable ? '10 8' : undefined}
              />
              {!directionUnreliable &&
                projected.arrows.map((a) => (
                  <g key={a.key} transform={`translate(${a.x} ${a.y}) rotate(${a.ang})`}>
                    <polygon points="0,-5 12,0 0,5" fill="#0F4C81" stroke="#ffffff" strokeWidth="1" />
                  </g>
                ))}
            </>
          )}
        </svg>
      </div>

      <div className={`map-3d-badge ${directionUnreliable ? 'map-3d-badge-warn' : ''}`}>
        {directionUnreliable
          ? `GPS weak ±${accuracyM}m — direction unreliable`
          : `Campus satellite · Live GPS · ${dir || ''}`}
      </div>

      <div className="map-float-actions">
        <button type="button" className="map-float-btn" onClick={fitBoth}>
          Fit both pins
        </button>
        {onCalibratePin && (
          <button
            type="button"
            className="map-float-btn map-float-btn-accent"
            onClick={onCalibratePin}
            title="Stand at the building entrance, then set the pin to your current GPS position"
          >
            Set pin here
          </button>
        )}
      </div>

      <div className="map-coord-panel">
        {directionUnreliable && (
          <div className="map-gps-warn">
            GPS accuracy (±{accuracyM} m) is larger than the distance ({shownDistance} m), so{' '}
            {block.name} may show the wrong direction. Wait 10–20 seconds in open sky, or stand at
            the building and tap <strong>Set pin here</strong>.
          </div>
        )}
        <div className="map-coord-row">
          <span className="map-coord-label">Destination</span>
          <span className="map-coord-value">
            {block.name}
            {dir && !directionUnreliable ? ` · ${dir}` : ''}
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
