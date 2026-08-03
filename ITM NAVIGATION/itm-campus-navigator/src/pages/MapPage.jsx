import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import CampusMap from '../components/CampusMap.jsx'
import { BLOCKS } from '../data/campusData.js'

export default function MapPage() {
  const [params, setParams] = useSearchParams()
  const destId = params.get('dest') || ''
  const [locStatus, setLocStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [userPos, setUserPos] = useState(null)
  const [arrived, setArrived] = useState(false)

  const activeBlock = BLOCKS.find((b) => b.id === destId)
  const navigating = Boolean(destId && locStatus === 'granted' && userPos)

  useEffect(() => {
    if (locStatus !== 'granted') return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setLocStatus('error')
        setErrorMsg('Error while checking your location. Check if GPS is on.')
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [locStatus])

  const enableLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocStatus('error')
      setErrorMsg('This browser does not support location.')
      return
    }
    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocStatus('granted')
      },
      () => {
        setLocStatus('error')
        setErrorMsg(
          "Location access isn't enabled. Allow location from site settings. Needs https:// or localhost."
        )
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  const handleArrived = useCallback(() => setArrived(true), [])

  if (!destId) {
    return (
      <div className="page page-narrow">
        <div className="eyebrow">Navigate</div>
        <h1 className="page-title">Choose your destination</h1>
        <p className="page-sub">Where you want to go?</p>
        <div className="field">
          <select
            className="select-input"
            onChange={(e) => setParams({ dest: e.target.value })}
            defaultValue=""
          >
            <option value="" disabled>
              — Choose your destination —
            </option>
            {BLOCKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
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
        <h1 className="page-title">Turn your location on</h1>
        <p className="page-sub">
          This helps us create the correct route from your current location to {activeBlock?.name}.
          We do not store your location.
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
        </div>
        {arrived && (
          <Link className="btn btn-accent" to={`/building/${activeBlock.id}`} style={{ width: 'auto', textDecoration: 'none' }}>
            Building details →
          </Link>
        )}
      </div>

      <CampusMap userPos={userPos} block={activeBlock} onArrived={handleArrived} />
    </div>
  )
}
