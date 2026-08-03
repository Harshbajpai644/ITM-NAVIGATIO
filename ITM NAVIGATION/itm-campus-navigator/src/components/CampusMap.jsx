import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Map, { Source, Layer, Marker, NavigationControl } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BLOCKS, CAMPUS_CENTER } from '../data/campusData.js'
import { createCampusBuildingsLayer } from '../utils/threeBuildingsLayer.js'
import {
  bearingDeg,
  nearestRouteIndex,
  lookAheadPoint,
  campusPreviewPath,
} from '../utils/routeCamera.js'

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

export default function CampusMap({ userPos, block, onArrived }) {
  const mapRef = useRef(null)
  const buildingsLayerRef = useRef(null)
  const lastRoutedPos = useRef(null)
  const flyIndexRef = useRef(0)
  const flyTimerRef = useRef(null)

  const [viewState, setViewState] = useState({
    longitude: CAMPUS_CENTER.lng,
    latitude: CAMPUS_CENTER.lat,
    zoom: 17.2,
    pitch: 55,
    bearing: -28,
  })
  const [distanceM, setDistanceM] = useState(null)
  const [durationS, setDurationS] = useState(null)
  const [routeError, setRouteError] = useState(false)
  const [routeCoords, setRouteCoords] = useState([])
  const [pathMode, setPathMode] = useState(false)

  const routeGeoJSON = useMemo(
    () => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords } }),
    [routeCoords]
  )

  const stopFlythrough = useCallback(() => {
    if (flyTimerRef.current) {
      clearInterval(flyTimerRef.current)
      flyTimerRef.current = null
    }
  }, [])

  const focusCampus = useCallback(() => {
    stopFlythrough()
    setPathMode(false)
    const target = block || CAMPUS_CENTER
    setViewState((v) => ({
      ...v,
      longitude: target.lng,
      latitude: target.lat,
      zoom: 17.2,
      pitch: 55,
      bearing: -28,
    }))
  }, [block, stopFlythrough])

  const enterPathMode = useCallback(
    (coords) => {
      const line = coords?.length > 1 ? coords : routeCoords
      if (!line.length || !block) return
      stopFlythrough()
      setPathMode(true)

      const near = userPos && haversine(userPos, block) < 1500
      if (near && userPos) {
        const idx = nearestRouteIndex(line, userPos)
        const ahead = lookAheadPoint(line, idx, 5)
        const brg = bearingDeg(userPos, ahead)
        setViewState({
          longitude: userPos.lng,
          latitude: userPos.lat,
          zoom: 18.6,
          pitch: 78,
          bearing: brg,
        })
        return
      }

      // Far from campus: cinematic fly-along campus road toward destination
      const preview = campusPreviewPath(CAMPUS_CENTER, block)
      flyIndexRef.current = 0
      const step = () => {
        const i = flyIndexRef.current
        if (i >= preview.length - 1) {
          stopFlythrough()
          return
        }
        const cur = { lng: preview[i][0], lat: preview[i][1] }
        const next = { lng: preview[i + 1][0], lat: preview[i + 1][1] }
        setViewState({
          longitude: cur.lng,
          latitude: cur.lat,
          zoom: 18.4,
          pitch: 76,
          bearing: bearingDeg(cur, next),
        })
        flyIndexRef.current = i + 1
      }
      step()
      flyTimerRef.current = setInterval(step, 1400)
    },
    [routeCoords, block, userPos, stopFlythrough]
  )

  const onMapLoad = useCallback(
    (evt) => {
      const map = evt.target
      try {
        if (map.getLayer('campus-stylized-buildings')) {
          map.removeLayer('campus-stylized-buildings')
        }
        const layer = createCampusBuildingsLayer(BLOCKS, block?.id)
        map.addLayer(layer)
        buildingsLayerRef.current = layer
        if (userPos) layer.setUserPosition(userPos)
      } catch (err) {
        console.warn('3D building models failed', err)
      }
      focusCampus()
    },
    [block?.id, focusCampus, userPos]
  )

  useEffect(() => {
    if (buildingsLayerRef.current && block?.id) {
      buildingsLayerRef.current.setDestination(block.id)
    }
  }, [block?.id])

  useEffect(() => {
    if (buildingsLayerRef.current) {
      buildingsLayerRef.current.setUserPosition(userPos || null)
    }
  }, [userPos])

  // Live GPS follow while in path mode (near campus)
  useEffect(() => {
    if (!pathMode || !userPos || !block || routeCoords.length < 2) return
    if (haversine(userPos, block) > 1500) return
    const idx = nearestRouteIndex(routeCoords, userPos)
    const ahead = lookAheadPoint(routeCoords, idx, 5)
    setViewState((v) => ({
      ...v,
      longitude: userPos.lng,
      latitude: userPos.lat,
      zoom: Math.max(v.zoom, 18.4),
      pitch: 78,
      bearing: bearingDeg(userPos, ahead),
    }))
  }, [userPos, pathMode, block, routeCoords])

  useEffect(() => {
    if (!block) return
    if (!userPos) {
      focusCampus()
      return
    }
    if (pathMode) return
    const dist = haversine(userPos, block)
    if (dist > 1200) focusCampus()
    else {
      setViewState((v) => ({
        ...v,
        longitude: userPos.lng,
        latitude: userPos.lat,
        zoom: Math.max(v.zoom, 17),
        pitch: 58,
      }))
    }
  }, [userPos, block, focusCampus, pathMode])

  useEffect(() => {
    if (!userPos || !block) return
    const moved = lastRoutedPos.current ? haversine(lastRoutedPos.current, userPos) : Infinity
    if (moved < 20 && lastRoutedPos.current) return

    let cancelled = false
    setRouteError(false)
    const url =
      `https://router.project-osrm.org/route/v1/foot/` +
      `${userPos.lng},${userPos.lat};${block.lng},${block.lat}?overview=full&geometries=geojson`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.routes?.[0]) {
          const route = data.routes[0]
          setDistanceM(route.distance)
          setDurationS(route.duration)
          lastRoutedPos.current = userPos
          setRouteError(false)
          setRouteCoords(route.geometry.coordinates)
        } else {
          setRouteError(true)
          setDistanceM(haversine(userPos, block))
          setDurationS(null)
          setRouteCoords([
            [userPos.lng, userPos.lat],
            [block.lng, block.lat],
          ])
        }
      })
      .catch(() => {
        if (cancelled) return
        setRouteError(true)
        setDistanceM(haversine(userPos, block))
        setDurationS(null)
        setRouteCoords([
          [userPos.lng, userPos.lat],
          [block.lng, block.lat],
        ])
      })

    return () => {
      cancelled = true
    }
  }, [userPos, block])

  useEffect(() => {
    if (!userPos || !block || !onArrived) return
    const d = distanceM ?? haversine(userPos, block)
    if (d < 40) onArrived()
  }, [distanceM, userPos, block, onArrived])

  useEffect(() => () => stopFlythrough(), [stopFlythrough])

  const onMove = useCallback((evt) => {
    if (pathMode) return
    setViewState(evt.viewState)
  }, [pathMode])

  if (!userPos || !block) return null

  const straightDist = haversine(userPos, block)
  const shownDistance = Math.round(distanceM ?? straightDist)
  const shownMinutes =
    durationS != null
      ? Math.max(1, Math.round(durationS / 60))
      : Math.max(1, Math.round(shownDistance / 80))
  const nearCampus = straightDist < 2500
  const dashedRoute = routeError || shownDistance > 1500

  return (
    <div className="map-card map-card-full" style={{ position: 'relative' }}>
      <div className="maplibre-3d-full">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={onMove}
          onLoad={onMapLoad}
          onClick={() => enterPathMode()}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
          maxPitch={85}
          attributionControl
        >
          <NavigationControl position="top-right" visualizePitch />

          {routeCoords.length > 0 && (
            <Source id="route" type="geojson" data={routeGeoJSON}>
              <Layer
                id="route-glow"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': dashedRoute ? '#7dd3c7' : '#5eead4',
                  'line-width': 14,
                  'line-opacity': 0.4,
                  'line-blur': 2,
                }}
              />
              <Layer
                id="route-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={
                  dashedRoute
                    ? {
                        'line-color': '#00C2A8',
                        'line-width': 5,
                        'line-opacity': 0.8,
                        'line-dasharray': [1.8, 1.4],
                      }
                    : {
                        'line-color': '#00C2A8',
                        'line-width': 7,
                        'line-opacity': 0.98,
                      }
                }
              />
              <Layer
                id="route-core"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#ecfeff',
                  'line-width': dashedRoute ? 1.5 : 2.2,
                  'line-opacity': dashedRoute ? 0.35 : 0.75,
                }}
              />
            </Source>
          )}

          {BLOCKS.map((b) => {
            const isDest = b.id === block.id
            return (
              <Marker key={b.id} longitude={b.lng} latitude={b.lat} anchor="bottom">
                <div className={`campus-bldg-label${isDest ? ' is-dest' : ''}`}>
                  <span className="campus-bldg-label-dot" aria-hidden />
                  <span className="campus-bldg-label-text">{b.name}</span>
                </div>
              </Marker>
            )
          })}

          {nearCampus && (
            <Marker longitude={userPos.lng} latitude={userPos.lat} anchor="bottom">
              <div className="campus-you-label">You</div>
            </Marker>
          )}
        </Map>
      </div>

      <div className="map-3d-badge">
        {pathMode ? 'Path view · street level' : '3D Campus · tap map for path view'}
      </div>

      <div className="map-float-actions">
        <button type="button" className="map-float-btn" onClick={() => enterPathMode()}>
          Walk on path
        </button>
        <button type="button" className="map-float-btn" onClick={focusCampus}>
          Campus view
        </button>
      </div>

      <div className="map-overlay-stats">
        <div className="route-stat">
          <div className="num">{shownDistance}</div>
          <div className="lbl">Meter away</div>
        </div>
        <div className="route-stat">
          <div className="num">{shownMinutes}</div>
          <div className="lbl">Estimated Min</div>
        </div>
      </div>

      {shownDistance > 1500 && (
        <p className="status-note map-error-float">
          Campus se door ho (~{Math.round(shownDistance / 1000)} km). “Walk on path” dabao —
          camera seedhi road pe street-level pe le aayega. Campus pahunch ke live GPS follow milega.
        </p>
      )}
    </div>
  )
}
