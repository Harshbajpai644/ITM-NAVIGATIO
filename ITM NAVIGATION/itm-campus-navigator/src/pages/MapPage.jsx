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

export default function MapPage() {
  const [params, setParams] = useSearchParams()
  const destId = params.get('dest') || ''
  const [locStatus, setLocStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [userPos, setUserPos] = useState(null)
  const [arrived, setArrived] = useState(false)
  const [pinOverrides, setPinOverrides] = useState(() => loadPinOverrides())
  const [calibrateMsg, setCalibrateMsg] = useState('')

  const baseBlock = BLOCKS.find((b) => b.id === destId)

  const activeBlock = useMemo(() => {
    if (!baseBlock) return null
    const ov = pinOverrides[baseBlock.id]
    if (!ov) return baseBlock
    return { ...baseBlock, lat: ov.lat, lng: ov.lng }
  }, [baseBlock, pinOverrides])

  const navigating = Boolean(destId && locStatus === 'granted' && userPos)

  useEffect(() => {
    if (locStatus !== 'granted') return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        setUserPos((prev) => {
          // Keep better (smaller) accuracy fixes; drop much worse jumps
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
        setErrorMsg('Location error. GPS on hai? Phone pe Precise / High Accuracy location ON karo.')
      },
      GPS_OPTS
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [locStatus])

  const enableLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocStatus('error')
      setErrorMsg('Browser location support nahi karta.')
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
      },
      () => {
        setLocStatus('error')
        setErrorMsg('Location allow karo (https / localhost). Precise location ON rakho.')
      },
      GPS_OPTS
    )
  }

  const handleArrived = useCallback(() => setArrived(true), [])

  const calibratePin = useCallback(() => {
    if (!userPos || !activeBlock) return
    if (userPos.accuracy != null && userPos.accuracy > 35) {
      setCalibrateMsg(
        `GPS abhi ±${Math.round(userPos.accuracy)} m hai. Open sky mein wait karo, ±35 m se better hone pe pin set karo.`
      )
      return
    }
    const next = savePinOverride(activeBlock.id, userPos.lat, userPos.lng)
    setPinOverrides(next)
    setCalibrateMsg(
      `${activeBlock.name} pin update: ${userPos.lat.toFixed(6)}, ${userPos.lng.toFixed(6)}`
    )
  }, [userPos, activeBlock])

  if (!destId) {
    return (
      <div className="page page-narrow">
        <div className="eyebrow">Navigate</div>
        <h1 className="page-title">Building search</h1>
        <p className="page-sub">Building choose karo — live GPS + exact destination pin.</p>
        <div className="field">
          <select
            className="select-input"
            onChange={(e) => setParams({ dest: e.target.value })}
            defaultValue=""
          >
            <option value="" disabled>
              — Building choose karo —
            </option>
            {BLOCKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.lat.toFixed(5)}, {b.lng.toFixed(5)})
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  if (locStatus !== 'granted') {
    return (
      <div className="page page-narrow">
        <div className="eyebrow">{activeBlock?.name}</div>
        <h1 className="page-title">Turn on live location</h1>
        <p className="page-sub">
          Destination:{' '}
          <code>
            {activeBlock?.lat.toFixed(6)}, {activeBlock?.lng.toFixed(6)}
          </code>
          <br />
          Precise GPS on karo. Agar pin galat direction dikhe to building pe khade hokar map pe
          “Pin yahan set karo” use karna.
        </p>
        <button className="btn btn-primary" onClick={enableLocation} disabled={locStatus === 'loading'}>
          {locStatus === 'loading' ? 'Detecting...' : 'Turn On Your Location'}
        </button>
        {locStatus === 'error' && <p className="status-note error">{errorMsg}</p>}
      </div>
    )
  }

  return (
    <div className={navigating ? 'page-map-full' : 'page page-narrow'}>
      <div className={navigating ? 'map-full-top' : 'map-toolbar'}>
        <div>
          <div className="eyebrow">{arrived ? 'Pahunch gaye' : 'Navigating to'}</div>
          <h1 className="page-title" style={{ fontSize: navigating ? 18 : 20, marginBottom: 0 }}>
            {activeBlock?.name}
          </h1>
          {calibrateMsg && <p className="status-note go" style={{ margin: '6px 0 0' }}>{calibrateMsg}</p>}
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
        onArrived={handleArrived}
        onCalibratePin={calibratePin}
      />
    </div>
  )
}
