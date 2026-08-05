import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Map, { Marker } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  CAMPUS_SATELLITE_STYLE,
  CAMPUS_OVERVIEW_CAMERA,
  CAMPUS_MAX_ZOOM,
  CAMPUS_MIN_ZOOM,
} from '../data/campus3d.js'
import {
  AMENITIES,
  AMENITY_META,
  LAYER_DEFS,
  defaultLayerState,
  buildingKind,
  isAmenityBuilding,
  buildTeacherPlaces,
  buildSearchIndex,
  filterPlaces,
} from '../data/mapLayers.js'

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
          arrows.push({
            x: a.x + dx * 0.55,
            y: a.y + dy * 0.55,
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

function MarkerIcon({ kind, label, active, compact, onClick }) {
  const meta = AMENITY_META[kind]
  const short =
    kind === 'building' || kind === 'library' || kind === 'hostel'
      ? 'B'
      : kind === 'teacher'
        ? 'T'
        : meta?.short || '•'
  const color =
    kind === 'teacher'
      ? '#0B3760'
      : kind === 'building' || kind === 'library' || kind === 'hostel'
        ? '#00C2A8'
        : meta?.color || '#0F4C81'

  return (
    <button
      type="button"
      className={`map-marker ${compact ? 'map-marker-sm' : ''} ${active ? 'is-active' : ''}`}
      style={{ '--marker-color': color }}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
    >
      <span className="map-marker-dot">{short}</span>
      {!compact && <span className="map-marker-name">{label}</span>}
    </button>
  )
}

export default function CampusMap({ userPos, block, buildings = [], onArrived, onCalibratePin }) {
  const mapRef = useRef(null)
  const [viewState, setViewState] = useState({
    longitude: block?.lng ?? CAMPUS_OVERVIEW_CAMERA.longitude,
    latitude: block?.lat ?? CAMPUS_OVERVIEW_CAMERA.latitude,
    zoom: 16,
    pitch: 0,
    bearing: 0,
  })
  const [mapTick, setMapTick] = useState(0)
  const [useSatellite, setUseSatellite] = useState(true)
  const [layersOpen, setLayersOpen] = useState(false)
  const [layers, setLayers] = useState(() => defaultLayerState())
  const [mapQuery, setMapQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const teachers = useMemo(() => buildTeacherPlaces(buildings), [buildings])
  const searchIndex = useMemo(
    () => buildSearchIndex(buildings, teachers),
    [buildings, teachers]
  )
  const searchHits = useMemo(() => filterPlaces(searchIndex, mapQuery), [searchIndex, mapQuery])

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

  const flyTo = useCallback((lat, lng, zoom = 16) => {
    setViewState((v) => ({
      ...v,
      latitude: lat,
      longitude: lng,
      zoom: Math.min(zoom, CAMPUS_MAX_ZOOM),
      pitch: 0,
      bearing: 0,
    }))
  }, [])

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
            ? 16
            : d < 250
              ? 15.7
              : Math.min(Math.max(v.zoom, 15.4), CAMPUS_MAX_ZOOM),
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

  const onMove = useCallback((evt) => setViewState(evt.viewState), [])
  const onLoad = useCallback(() => setMapTick((t) => t + 1), [])

  useEffect(() => {
    const map = mapRef.current?.getMap?.()
    if (!map?.getLayer?.('satellite')) return
    try {
      map.setPaintProperty('satellite', 'raster-opacity', useSatellite ? 1 : 0)
    } catch (_) {}
  }, [useSatellite, mapTick])

  if (!userPos || !block) return null

  const showBuildings = layers.buildings !== false
  const showTeachers = layers.teachers === true || searchHits.some((h) => h.type === 'teacher')
  const showAmenities = layers.amenities !== false

  const buildingMarkers = showBuildings ? buildings.filter((b) => !isAmenityBuilding(b)) : []
  const amenityBuildings = showAmenities ? buildings.filter((b) => isAmenityBuilding(b)) : []
  const amenityMarkers = showAmenities ? AMENITIES : []
  const teacherMarkers =
    showTeachers && (viewState.zoom >= 15.5 || mapQuery.trim()) ? teachers : []

  const shownDistance = Math.round(liveDistanceM ?? 0)
  const shownMinutes = Math.max(1, Math.round(shownDistance / 80))
  const lineColor = directionUnreliable ? '#94a3b8' : '#00C2A8'

  const openPlace = (place) => {
    setSelected(place)
    flyTo(place.lat, place.lng, 16)
    setMapQuery('')
  }

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
          {buildingMarkers.map((b) => (
            <Marker key={b.id} longitude={b.lng} latitude={b.lat} anchor="bottom">
              <MarkerIcon
                kind={buildingKind(b)}
                label={b.name}
                active={block.id === b.id || selected?.id === b.id}
                compact={b.id !== block.id}
                onClick={() =>
                  openPlace({
                    id: b.id,
                    type: 'building',
                    kind: buildingKind(b),
                    name: b.name,
                    subtitle: b.category,
                    hours: b.hours,
                    lat: b.lat,
                    lng: b.lng,
                  })
                }
              />
            </Marker>
          ))}

          {amenityBuildings.map((b) => (
            <Marker key={`ab-${b.id}`} longitude={b.lng} latitude={b.lat} anchor="bottom">
              <MarkerIcon
                kind={buildingKind(b)}
                label={b.name}
                active={selected?.id === b.id}
                compact
                onClick={() =>
                  openPlace({
                    id: b.id,
                    type: 'amenity',
                    kind: buildingKind(b),
                    name: b.name,
                    subtitle: b.category,
                    hours: b.hours,
                    lat: b.lat,
                    lng: b.lng,
                  })
                }
              />
            </Marker>
          ))}

          {amenityMarkers.map((a) => (
            <Marker key={a.id} longitude={a.lng} latitude={a.lat} anchor="bottom">
              <MarkerIcon
                kind={a.kind}
                label={a.name}
                active={selected?.id === a.id}
                compact
                onClick={() =>
                  openPlace({
                    id: a.id,
                    type: 'amenity',
                    kind: a.kind,
                    name: a.name,
                    subtitle: a.hint,
                    hours: a.hours,
                    lat: a.lat,
                    lng: a.lng,
                  })
                }
              />
            </Marker>
          ))}

          {teacherMarkers.map((t) => (
            <Marker key={t.id} longitude={t.lng} latitude={t.lat} anchor="bottom">
              <MarkerIcon
                kind="teacher"
                label={t.name}
                active={selected?.id === t.id}
                compact
                onClick={() =>
                  openPlace({
                    id: t.id,
                    type: 'teacher',
                    kind: 'teacher',
                    name: t.name,
                    designation: t.designation,
                    blockName: t.blockName,
                    room: t.room,
                    floor: t.floor,
                    hours: t.hours,
                    lat: t.lat,
                    lng: t.lng,
                  })
                }
              />
            </Marker>
          ))}

          <Marker longitude={block.lng} latitude={block.lat} anchor="bottom">
            <div className="coord-pin dest-pin">
              <div className="coord-pin-title">{block.name}</div>
            </div>
          </Marker>

          <Marker longitude={userPos.lng} latitude={userPos.lat} anchor="center">
            <div className="you-dot" aria-label="You live location">
              <span className="you-dot-pulse" />
              <span className="you-dot-core" />
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

      <div className="map-nav-search">
        <label className="map-search-field" htmlFor="nav-map-search">
          <span aria-hidden="true">⌕</span>
          <input
            id="nav-map-search"
            type="search"
            value={mapQuery}
            onChange={(e) => setMapQuery(e.target.value)}
            placeholder="Search on map…"
            autoComplete="off"
          />
        </label>
        {searchHits.length > 0 && (
          <ul className="map-search-hits" role="listbox">
            {searchHits.map((hit) => (
              <li key={hit.id}>
                <button type="button" onClick={() => openPlace(hit)}>
                  <strong>{hit.name}</strong>
                  <span>{hit.subtitle}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="map-float-actions">
        <button type="button" className="map-float-btn" onClick={() => setLayersOpen((v) => !v)}>
          {layersOpen ? 'Close layers' : 'Layers'}
        </button>
        <button type="button" className="map-float-btn" onClick={() => setUseSatellite((v) => !v)}>
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

      {layersOpen && (
        <div className="map-layers-panel" role="dialog" aria-label="Map layers">
          <strong>Map layers</strong>
          {LAYER_DEFS.map((l) => (
            <label key={l.id} className="map-layer-row">
              <input
                type="checkbox"
                checked={!!layers[l.id]}
                onChange={() => setLayers((prev) => ({ ...prev, [l.id]: !prev[l.id] }))}
              />
              <span>{l.label}</span>
            </label>
          ))}
          <p className="map-layer-hint">Teachers show when zoomed in or searched.</p>
        </div>
      )}

      {selected && (
        <div className="map-popup-card">
          <button
            type="button"
            className="map-popup-close"
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            ×
          </button>
          <div className="map-popup-kind">
            {selected.type === 'teacher'
              ? 'Teacher'
              : selected.type === 'amenity'
                ? AMENITY_META[selected.kind]?.label || 'Amenity'
                : 'Building'}
          </div>
          <h2>{selected.name}</h2>
          <ul className="map-popup-meta">
            {selected.type === 'teacher' ? (
              <>
                {selected.designation && <li>{selected.designation}</li>}
                {selected.blockName && <li>{selected.blockName}</li>}
                {(selected.floor || selected.room) && (
                  <li>
                    {[selected.floor, selected.room ? `Room ${selected.room}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </li>
                )}
              </>
            ) : (
              selected.subtitle && <li>{selected.subtitle}</li>
            )}
            {selected.hours && <li>{selected.hours}</li>}
          </ul>
        </div>
      )}

      <div className="map-dist-chip">
        <strong>{shownDistance} m</strong>
        <span>· ~{shownMinutes} min</span>
      </div>
    </div>
  )
}
