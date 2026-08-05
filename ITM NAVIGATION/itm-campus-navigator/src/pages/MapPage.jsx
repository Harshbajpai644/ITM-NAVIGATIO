import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { BLOCKS } from '../data/campusData.js'
import {
  buildTeacherPlaces,
  buildSearchIndex,
  filterPlaces,
  defaultLayerState,
} from '../data/mapLayers.js'

const CampusMap = lazy(() => import('../components/CampusMap.jsx'))

const GPS_OPTS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20000,
}

const PIN_KEY = 'itm-pin-overrides'

function loadPinOverrides() {
  try {
    return JSON.parse(localStorage.getItem(PIN_KEY) || '{}')
  } catch (_) {
    return {}
  }
}

function savePinOverride(id, lat, lng) {
  const all = loadPinOverrides()
  all[id] = { lat, lng, updatedAt: Date.now() }
  localStorage.setItem(PIN_KEY, JSON.stringify(all))
  return all
}

export default function MapPage() {
  const [locStatus, setLocStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [userPos, setUserPos] = useState(null)
  const [arrived, setArrived] = useState(false)
  const [pinOverrides, setPinOverrides] = useState(() => loadPinOverrides())
  const [calibrateMsg, setCalibrateMsg] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [dest, setDest] = useState(null)
  const [focusTarget, setFocusTarget] = useState(null)
  const [layers] = useState(() => defaultLayerState())
  const [watching, setWatching] = useState(false)

  const buildings = useMemo(() => {
    return BLOCKS.map((b) => {
      const ov = pinOverrides[b.id]
      return ov ? { ...b, lat: ov.lat, lng: ov.lng } : b
    })
  }, [pinOverrides])

  const teachers = useMemo(() => buildTeacherPlaces(buildings), [buildings])
  const searchIndex = useMemo(
    () => buildSearchIndex(buildings, teachers),
    [buildings, teachers]
  )
  const searchHits = useMemo(() => filterPlaces(searchIndex, query), [searchIndex, query])
  const searchingTeachers = query.trim().length > 0 && searchHits.some((h) => h.type === 'teacher')

  useEffect(() => {
    if (!watching || locStatus !== 'granted') return undefined
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        setUserPos((prev) => {
          if (
            prev?.accuracy != null &&
            next.accuracy != null &&
            next.accuracy > prev.accuracy + 20 &&
            next.accuracy > 35
          ) {
            return prev
          }
          return next
        })
      },
      () => {
        setLocStatus('error')
        setErrorMsg('Location error. Turn on GPS and enable Precise location.')
      },
      GPS_OPTS
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [watching, locStatus])

  const enableLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocStatus('error')
      setErrorMsg('This browser does not support location.')
      return Promise.reject(new Error('no geolocation'))
    }
    setLocStatus('loading')
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }
          setUserPos(next)
          setLocStatus('granted')
          setWatching(true)
          resolve(next)
        },
        () => {
          setLocStatus('error')
          setErrorMsg('Allow location access. Keep Precise location ON.')
          reject(new Error('denied'))
        },
        GPS_OPTS
      )
    })
  }, [])

  const handleNavigate = useCallback(
    async (place) => {
      if (!place) return
      setArrived(false)
      setCalibrateMsg('')
      setSelected(null)
      setDest({
        id: place.blockId || place.id,
        name: place.type === 'teacher' ? `${place.name} (${place.blockName || 'Cabin'})` : place.name,
        lat: place.lat,
        lng: place.lng,
        type: place.type,
      })
      setFocusTarget({ lat: place.lat, lng: place.lng, id: place.id })
      try {
        if (locStatus !== 'granted' || !userPos) {
          await enableLocation()
        } else {
          setWatching(true)
        }
      } catch (_) {}
    },
    [enableLocation, locStatus, userPos]
  )

  const handleSelectSearch = (place) => {
    setQuery('')
    setSelected(place)
    setFocusTarget({ lat: place.lat, lng: place.lng, id: place.id })
  }

  const clearNav = () => {
    setDest(null)
    setArrived(false)
    setCalibrateMsg('')
    setSelected(null)
  }

  const calibratePin = useCallback(() => {
    if (!userPos || !dest) return
    if (userPos.accuracy != null && userPos.accuracy > 50) {
      setCalibrateMsg(
        `GPS still weak (±${Math.round(userPos.accuracy)} m). Wait in open sky, then tap Set pin here again.`
      )
      return
    }
    const pinId = dest.id
    if (!BLOCKS.some((b) => b.id === pinId)) {
      setCalibrateMsg('Pin calibrate works for campus buildings. Stand at the building entrance.')
      return
    }
    const next = savePinOverride(pinId, userPos.lat, userPos.lng)
    setPinOverrides(next)
    const line = `${pinId}: ${userPos.lat.toFixed(6)}, ${userPos.lng.toFixed(6)}`
    setCalibrateMsg(`${dest.name} pin saved: ${line}`)
    setDest((d) => (d ? { ...d, lat: userPos.lat, lng: userPos.lng } : d))
    try {
      navigator.clipboard?.writeText?.(line)
    } catch (_) {}
  }, [userPos, dest])

  useEffect(() => {
    if (!dest || !userPos) return
    const R = 6371000
    const toRad = (d) => (d * Math.PI) / 180
    const dLat = toRad(dest.lat - userPos.lat)
    const dLng = toRad(dest.lng - userPos.lng)
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(userPos.lat)) * Math.cos(toRad(dest.lat)) * Math.sin(dLng / 2) ** 2
    const dist = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
    const acc = userPos.accuracy ?? 999
    if (dist < 20 && acc < Math.max(25, dist * 0.8)) setArrived(true)
  }, [dest, userPos])

  return (
    <div className="page-map-full map-explore-page">
      <div className="map-explore-top">
        <div className="map-explore-brand">
          <Link to="/" className="dest-back">
            ← Home
          </Link>
          <div>
            <div className="eyebrow">{arrived ? 'You have arrived' : dest ? 'Navigating to' : 'Campus map'}</div>
            <h1 className="page-title" style={{ fontSize: 18, marginBottom: 0 }}>
              {dest?.name || 'ITM University Gwalior'}
            </h1>
          </div>
        </div>

        <div className="map-explore-search">
          <label className="map-search-field" htmlFor="map-search-input">
            <span aria-hidden="true">⌕</span>
            <input
              id="map-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search building, teacher, parking..."
              autoComplete="off"
            />
          </label>
          {searchHits.length > 0 && (
            <ul className="map-search-hits" role="listbox">
              {searchHits.map((hit) => (
                <li key={hit.id}>
                  <button type="button" onClick={() => handleSelectSearch(hit)}>
                    <strong>{hit.name}</strong>
                    <span>{hit.subtitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="map-explore-actions">
          {locStatus !== 'granted' ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              onClick={() => enableLocation()}
              disabled={locStatus === 'loading'}
            >
              {locStatus === 'loading' ? 'Detecting…' : 'Turn on GPS'}
            </button>
          ) : (
            <span className="map-gps-pill">GPS on</span>
          )}
          {dest && (
            <button type="button" className="map-float-btn" onClick={clearNav}>
              Clear route
            </button>
          )}
        </div>

        {calibrateMsg && <p className="status-note go map-explore-note">{calibrateMsg}</p>}
        {locStatus === 'error' && <p className="status-note error map-explore-note">{errorMsg}</p>}
      </div>

      <Suspense
        fallback={
          <div className="loading-screen" style={{ position: 'relative', minHeight: '60vh' }}>
            <p className="loading-text">Loading map…</p>
          </div>
        }
      >
        <CampusMap
          buildings={buildings}
          teachers={teachers}
          layers={layers}
          userPos={userPos}
          dest={dest}
          selected={selected}
          onSelect={setSelected}
          onNavigate={handleNavigate}
          focusTarget={focusTarget}
          onCalibratePin={dest ? calibratePin : null}
          searchingTeachers={searchingTeachers}
        />
      </Suspense>
    </div>
  )
}
