import { useEffect, useRef, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'

const youIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#0F4C81;border:3px solid #fff;box-shadow:0 0 0 4px rgba(15,76,129,0.28);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})
const blockIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:3px;background:#00C2A8;border:3px solid #fff;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function FitBounds({ points, fitSignal }) {
  const map = useMap()
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points, { padding: [30, 30] })
    else if (points.length === 1) map.setView(points[0], 17)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal])
  return null
}

function RecenterControl({ userPos }) {
  const map = useMap()
  return (
    <button
      className="recenter-btn"
      style={{ position: 'absolute', zIndex: 1000, top: 10, right: 10 }}
      onClick={() => userPos && map.setView([userPos.lat, userPos.lng], 18)}
    >
      ⦿ Recenter
    </button>
  )
}

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
  const [routeCoords, setRouteCoords] = useState([])
  const [distanceM, setDistanceM] = useState(null)
  const [durationS, setDurationS] = useState(null)
  const [routeError, setRouteError] = useState(false)
  const lastRoutedPos = useRef(null)
  const [fitSignal, setFitSignal] = useState(0)

  useEffect(() => {
    if (!userPos || !block) return
    const moved = lastRoutedPos.current ? haversine(lastRoutedPos.current, userPos) : Infinity
    if (moved < 20 && lastRoutedPos.current) return // throttle: skip tiny movements

    let cancelled = false
    setRouteError(false)
    const url = `https://router.project-osrm.org/route/v1/foot/${userPos.lng},${userPos.lat};${block.lng},${block.lat}?overview=full&geometries=geojson`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.routes && data.routes[0]) {
          const route = data.routes[0]
          setRouteCoords(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]))
          setDistanceM(route.distance)
          setDurationS(route.duration)
          lastRoutedPos.current = userPos
          setFitSignal((f) => f + 1)
        } else {
          setRouteError(true)
        }
      })
      .catch(() => {
        if (!cancelled) setRouteError(true)
      })

    return () => { cancelled = true }
  }, [userPos, block])

  const straightDist = useMemo(
    () => (userPos && block ? haversine(userPos, block) : null),
    [userPos, block]
  )

  useEffect(() => {
    const d = distanceM ?? straightDist
    if (d !== null && d < 40) onArrived()
  }, [distanceM, straightDist, onArrived])

  if (!userPos || !block) return null

  const points = routeError || routeCoords.length === 0
    ? [[userPos.lat, userPos.lng], [block.lat, block.lng]]
    : routeCoords

  const shownDistance = Math.round(distanceM ?? straightDist)
  const shownMinutes = durationS ? Math.max(1, Math.round(durationS / 60)) : Math.max(1, Math.round(shownDistance / 80))

  return (
    <>
      <div className="map-card" style={{ position: 'relative' }}>
        <MapContainer center={[userPos.lat, userPos.lng]} zoom={17} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[userPos.lat, userPos.lng]} icon={youIcon} />
          <Marker position={[block.lat, block.lng]} icon={blockIcon} />
          <Polyline
            positions={points}
            pathOptions={{ color: '#00C2A8', weight: 5, dashArray: routeError ? '6 8' : null }}
          />
          <FitBounds points={points} fitSignal={fitSignal} />
          <RecenterControl userPos={userPos} />
        </MapContainer>
      </div>
      <div className="route-stats">
        <div className="route-stat">
          <div className="num">{shownDistance}</div>
          <div className="lbl">Meter away</div>
        </div>
        <div className="route-stat">
          <div className="num">{shownMinutes}</div>
          <div className="lbl">Estimated Min</div>
        </div>
      </div>
      {routeError && (
        <p className="status-note">
          The live road route hasn't loaded yet, so only a straight line is being shown. The direction is correct..
        </p>
      )}
    </>
  )
}
