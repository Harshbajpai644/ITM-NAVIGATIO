import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import { useTheme } from './hooks/useTheme.js'

const MapPage = lazy(() => import('./pages/MapPage.jsx'))
const BuildingDetail = lazy(() => import('./pages/BuildingDetail.jsx'))
const Visitor = lazy(() => import('./pages/Visitor.jsx'))
const About = lazy(() => import('./pages/About.jsx'))

function RouteFallback() {
  return (
    <div className="loading-screen" role="status">
      <div className="boot-dot" aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
      <p className="loading-text">Loading…</p>
    </div>
  )
}

function Shell({ theme, toggle }) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isMap = location.pathname === '/map'
  const hideFooter = isHome || isMap
  const hideNavbar = isHome || isMap
  const shellClass = isHome
    ? 'app-shell app-shell-landing'
    : isMap
      ? 'app-shell app-shell-map'
      : 'app-shell'

  return (
    <div className={shellClass}>
      {!hideNavbar && <Navbar theme={theme} onToggleTheme={toggle} />}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/building/:id" element={<BuildingDetail />} />
          <Route path="/visitor" element={<Visitor />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
      {!hideFooter && <Footer />}
    </div>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  return (
    <BrowserRouter>
      <Shell theme={theme} toggle={toggle} />
    </BrowserRouter>
  )
}
