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
      (pos) =>
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => {
        setLocStatus('error')
        setErrorMsg('Location error. GPS on hai?')
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
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
        setErrorMsg('Location allow karo (https / localhost).')
      },
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  const handleArrived = useCallback(() => setArrived(true), [])

  if (!destId) {
    return (
      <div className="page page-narrow">
        <div className="eyebrow">Navigate</div>
        <h1 className="page-title">Building search</h1>
        <p className="page-sub">Building choose karo — uske coordinates + aapki live GPS dikhengi.</p>
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
          Destination coordinates:{' '}
          <code>
            {activeBlock?.lat.toFixed(6)}, {activeBlock?.lng.toFixed(6)}
          </code>
          <br />
          Ab apni live GPS on karo — dono match karke distance milega.
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
          <Link
            className="btn btn-accent"
            to={`/building/${activeBlock.id}`}
            style={{ width: 'auto', textDecoration: 'none' }}
          >
            Building details →
          </Link>
        )}
      </div>

      <CampusMap userPos={userPos} block={activeBlock} onArrived={handleArrived} />
    </div>
  )
}
