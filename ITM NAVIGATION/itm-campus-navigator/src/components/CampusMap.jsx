import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Map, { Marker } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  CAMPUS_SATELLITE_STYLE,
  CAMPUS_OVERVIEW_CAMERA,
  CAMPUS_MAX_ZOOM,
  CAMPUS_MIN_ZOOM,
} from '../data/campus3d.js'

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
          arrows.push({
            x: a.x + dx * t,
            y: a.y + dy * t,
            ang: (Math.atan2(dy, dx) * 180) / Math.PI,
            key: `${i}-${Math.round(a.x)}`,
          })
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
  const [useSatellite, setUseSatellite] = useState(true)

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
        { padding: 110, duration: 700, maxZoom: CAMPUS_MAX_ZOOM, pitch: 0, bearing: 0 }
      )
    } catch (_) {}
  }, [userPos, block])

  useEffect(() => {
    if (!userPos || !block) return
    const d = liveDistanceM ?? Infinity
    if (d < 600) {
      setViewState((v) => ({
        ...v,
        longitude: (userPos.lng + block.lng) / 2,
        latitude: (userPos.lat + block.lat) / 2,
        zoom:
          d < 100
            ? 17.2
            : d < 250
              ? 16.8
              : Math.min(Math.max(v.zoom, 16.2), CAMPUS_MAX_ZOOM),
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

  useEffect(() => {
    const map = mapRef.current?.getMap?.()
    if (!map?.getLayer?.('satellite')) return
    try {
      map.setPaintProperty('satellite', 'raster-opacity', useSatellite ? 1 : 0)
    } catch (_) {}
  }, [useSatellite, mapTick])

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
          minZoom={CAMPUS_MIN_ZOOM}
          maxZoom={CAMPUS_MAX_ZOOM}
          maxPitch={60}
          attributionControl={false}
        >
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
                <strong>You</strong>
              </div>
            </div>
          </Marker>
        </Map>

        <svg className="route-svg-overlay" aria-hidden="true">
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

      <div className="map-float-actions">
        <button
          type="button"
          className="map-float-btn"
          onClick={() => setUseSatellite((v) => !v)}
        >
          {useSatellite ? 'Streets map' : 'Satellite'}
        </button>
        <button type="button" className="map-float-btn" onClick={fitBoth}>
          Fit both
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

      <div className="map-dist-chip">
        <strong>{shownDistance} m</strong>
        <span>· ~{shownMinutes} min</span>
      </div>
    </div>
  )
}
