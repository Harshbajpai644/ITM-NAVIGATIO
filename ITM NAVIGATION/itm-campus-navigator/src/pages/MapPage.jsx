import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import CampusMap from '../components/CampusMap.jsx'
import { BLOCKS } from '../data/campusData.js'

export default function MapPage() {
  const [params, setParams] = useSearchParams()
  const destId = params.get('dest') || ''
  const [locStatus, setLocStatus] = useState('idle') // idle | loading | granted | error
  const [errorMsg, setErrorMsg] = useState('')
  const [userPos, setUserPos] = useState(null)
  const [arrived, setArrived] = useState(false)

  const activeBlock = BLOCKS.find((b) => b.id === destId)

  // Live GPS using watchPosition so the route updates as the visitor walks
  useEffect(() => {
    if (locStatus !== 'granted') return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setLocStatus('error')
        setErrorMsg('Error while checking your location. check weather your GPS is on or not.')
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [locStatus])

  const enableLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocStatus('error')
      setErrorMsg('This browser not support the location.')
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
          'Location access isn\'t enabled. Please allow location access from the site settings next to your browser\'s address bar. It also won\'t work if you open the file directly using file://—you need to use https:// or localhost.'
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
          <select className="select-input" onChange={(e) => setParams({ dest: e.target.value })} defaultValue="">
            <option value="" disabled>— Choose your destination —</option>
            {BLOCKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
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
          This helps us create the correct route from your current location to {activeBlock?.name} We do not store your location.
        </p>
        <button className="btn btn-primary" onClick={enableLocation} disabled={locStatus === 'loading'}>
          {locStatus === 'loading' ? 'Detecting...' : 'Turn On Your Location'}
        </button>
        {locStatus === 'error' && <p className="status-note error">{errorMsg}</p>}
      </div>
    )
  }

  return (
    <div className="page page-narrow">
      <div className="map-toolbar">
        <div>
          <div className="eyebrow">{arrived ? 'Pahunch gaye' : 'Navigating to'}</div>
          <h1 className="page-title" style={{ fontSize: 20, marginBottom: 0 }}>{activeBlock?.name}</h1>
        </div>
      </div>

      {arrived && (
        <div className="glass-card" style={{ padding: '16px 18px', marginBottom: 16 }}>
          <p className="status-note go" style={{ marginTop: 0 }}>
            ✓ Aap {activeBlock?.name} Reached close to your destination
          </p>
          <Link className="btn btn-accent" to={`/building/${activeBlock.id}`} style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
            Building details →
          </Link>
        </div>
      )}

      <CampusMap userPos={userPos} block={activeBlock} onArrived={handleArrived} />

      {locStatus === 'error' && <p className="status-note error">{errorMsg}</p>}
    </div>
  )
}
