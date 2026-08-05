import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import CampusMap from '../components/CampusMap.jsx'
import { BLOCKS } from '../data/campusData.js'

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

function categoryLabel(category) {
  const key = String(category || '').toLowerCase()
  if (key === 'library') return 'Library'
  if (key === 'hostel') return 'Hostel'
  if (key === 'admission') return 'Admission'
  if (key === 'canteen') return 'Canteen'
  if (key === 'blocks') return 'Academic'
  if (key.includes('engineering')) return 'Academic'
  if (key.includes('management')) return 'Academic'
  if (key.includes('nursing')) return 'Academic'
  if (key.includes('fashion') || key.includes('design')) return 'Academic'
  if (key.includes('physical') || key.includes('sport')) return 'Sports'
  if (key.includes('admin')) return 'Administrative'
  return 'Campus'
}

export default function MapPage() {
  const [params, setParams] = useSearchParams()
  const destId = params.get('dest') || ''
  const [locStatus, setLocStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [userPos, setUserPos] = useState(null)
  const [arrived, setArrived] = useState(false)
  const [pinOverrides, setPinOverrides] = useState(() => loadPinOverrides())
  const [calibrateMsg, setCalibrateMsg] = useState('')
  const [query, setQuery] = useState('')
  const [showTeachers, setShowTeachers] = useState(false)
  const [navStarted, setNavStarted] = useState(false)

  const baseBlock = BLOCKS.find((b) => b.id === destId)

  const activeBlock = useMemo(() => {
    if (!baseBlock) return null
    const ov = pinOverrides[baseBlock.id]
    if (!ov) return baseBlock
    return { ...baseBlock, lat: ov.lat, lng: ov.lng }
  }, [baseBlock, pinOverrides])

  const filteredBlocks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return BLOCKS
    return BLOCKS.filter((b) => {
      const hay = `${b.name} ${b.category} ${categoryLabel(b.category)}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const navigating = Boolean(destId && navStarted && locStatus === 'granted' && userPos)

  useEffect(() => {
    if (!navStarted || locStatus !== 'granted') return
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
        setErrorMsg('Location error. Turn on GPS and enable Precise / High Accuracy location.')
      },
      GPS_OPTS
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [navStarted, locStatus])

  const enableLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocStatus('error')
      setErrorMsg('This browser does not support location.')
      return
    }
    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLocStatus('granted')
        setNavStarted(true)
      },
      () => {
        setLocStatus('error')
        setErrorMsg('Allow location access (https / localhost). Keep Precise location ON.')
      },
      GPS_OPTS
    )
  }

  const startNavigation = () => {
    if (locStatus === 'granted' && userPos) {
      setNavStarted(true)
      return
    }
    enableLocation()
  }

  const handleArrived = useCallback(() => setArrived(true), [])

  const calibratePin = useCallback(() => {
    if (!userPos || !activeBlock) return
    // Allow pin even when weak, but warn — campus indoor GPS is often poor
    if (userPos.accuracy != null && userPos.accuracy > 50) {
      setCalibrateMsg(
        `GPS still weak (±${Math.round(userPos.accuracy)} m). Wait in open sky near the entrance, then tap Set pin here again.`
      )
      return
    }
    const next = savePinOverride(activeBlock.id, userPos.lat, userPos.lng)
    setPinOverrides(next)
    const line = `${activeBlock.id}: ${userPos.lat.toFixed(6)}, ${userPos.lng.toFixed(6)}`
    setCalibrateMsg(`${activeBlock.name} pin saved. Send this to update code: ${line}`)
    try {
      navigator.clipboard?.writeText?.(line)
    } catch (_) {}
  }, [userPos, activeBlock])

  const chooseDestination = (id) => {
    setArrived(false)
    setCalibrateMsg('')
    setShowTeachers(false)
    setNavStarted(false)
    setParams({ dest: id })
  }

  const clearDestination = () => {
    setShowTeachers(false)
    setNavStarted(false)
    setArrived(false)
    setCalibrateMsg('')
    setParams({})
  }

  const teachers = useMemo(() => {
    const list = activeBlock?.people || []
    return list.filter((p) => (p.name && p.name.trim()) || (p.room && String(p.room).trim()))
  }, [activeBlock])

  if (!destId) {
    return (
      <section className="dest-picker" aria-label="Choose destination">
        <div className="dest-picker-bg" aria-hidden="true" />
        <div className="dest-picker-shade" aria-hidden="true" />

        <div className="dest-picker-inner">
          <header className="dest-picker-top">
            <Link to="/" className="dest-picker-brand">
              <span className="dest-picker-mark" aria-hidden="true" />
              <span>
                <strong>ITM NAVIGATOR</strong>
                <em>Where do you want to go?</em>
              </span>
            </Link>
          </header>

          <div className="dest-picker-hero">
            <h1>Choose your destination</h1>
            <p>
              Campus directions with <em>live GPS</em>
            </p>
          </div>

          <label className="dest-search" htmlFor="dest-search-input">
            <span className="dest-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              id="dest-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search buildings..."
              autoComplete="off"
            />
          </label>

          <ul className="dest-list" role="list">
            {filteredBlocks.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className="dest-row"
                  onClick={() => chooseDestination(b.id)}
                >
                  <img
                    className="dest-row-photo"
                    src={b.image}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = '/campus-walk.jpg'
                    }}
                  />
                  <span className="dest-row-text">
                    <strong>{b.name}</strong>
                    <span>{categoryLabel(b.category)}</span>
                  </span>
                  <span className="dest-row-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
              </li>
            ))}
            {filteredBlocks.length === 0 && (
              <li className="dest-empty">No buildings match your search.</li>
            )}
          </ul>
        </div>
      </section>
    )
  }

  if (!navStarted) {
    const locationReady = locStatus === 'granted' && userPos
    return (
      <section className="dest-picker dest-picker-compact" aria-label="Building details">
        <div className="dest-picker-bg" aria-hidden="true" />
        <div className="dest-picker-shade" aria-hidden="true" />
        <div className="dest-picker-inner dest-gps-panel">
          <button type="button" className="dest-back" onClick={clearDestination}>
            ← Change destination
          </button>
          <div className="eyebrow">{activeBlock?.name}</div>
          <h1 className="page-title">
            {locationReady ? 'Start navigation' : 'Turn on live location'}
          </h1>
          <p className="page-sub dest-gps-help">
            Enable precise GPS. If the pin looks wrong, stand at the building and use “Set pin here” on
            the map.
          </p>

          {teachers.length > 0 && (
            <div className="dest-teachers">
              <div className="dest-teachers-head">
                <h2>Teachers in this building</h2>
                <button
                  type="button"
                  className="dest-teachers-view"
                  onClick={() => setShowTeachers((v) => !v)}
                  aria-expanded={showTeachers}
                >
                  {showTeachers ? 'Hide' : 'View'}
                </button>
              </div>
              {showTeachers && (
                <div className="dest-teachers-table-wrap">
                  <table className="dest-teachers-table">
                    <thead>
                      <tr>
                        <th scope="col">Floor</th>
                        <th scope="col">Name</th>
                        <th scope="col">Room No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((p, i) => (
                        <tr key={`${p.name}-${p.room}-${i}`}>
                          <td>{p.floor?.trim() || '—'}</td>
                          <td>{p.name?.trim() || p.designation || '—'}</td>
                          <td>{p.room?.trim() || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={startNavigation}
            disabled={locStatus === 'loading'}
          >
            {locStatus === 'loading'
              ? 'Detecting…'
              : locationReady
                ? 'Start navigation'
                : 'Turn on your location'}
          </button>
          {locStatus === 'error' && <p className="status-note error">{errorMsg}</p>}
        </div>
      </section>
    )
  }

  return (
    <div className={navigating ? 'page-map-full' : 'page page-narrow'}>
      <div className={navigating ? 'map-full-top' : 'map-toolbar'}>
        <div>
          <button type="button" className="dest-back" onClick={clearDestination}>
            ← Change destination
          </button>
          <div className="eyebrow">{arrived ? 'You have arrived' : 'Navigating to'}</div>
          <h1 className="page-title" style={{ fontSize: navigating ? 18 : 20, marginBottom: 0 }}>
            {activeBlock?.name}
          </h1>
          {calibrateMsg && (
            <p className="status-note go" style={{ margin: '6px 0 0' }}>
              {calibrateMsg}
            </p>
          )}
        </div>
        {arrived && (
          <Link
            className="btn btn-accent"
            to={`/building/${activeBlock.id}`}
            style={{ width: 'auto', textDecoration: 'none' }}
          >
            Building details →
          </Link>
        )}
      </div>

      <CampusMap
        userPos={userPos}
        block={activeBlock}
        buildings={BLOCKS.map((b) => {
          const ov = pinOverrides[b.id]
          return ov ? { ...b, lat: ov.lat, lng: ov.lng } : b
        })}
        onArrived={handleArrived}
        onCalibratePin={calibratePin}
      />
    </div>
  )
}
