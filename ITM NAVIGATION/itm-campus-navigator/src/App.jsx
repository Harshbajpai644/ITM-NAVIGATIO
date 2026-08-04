import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import MapPage from './pages/MapPage.jsx'
import BuildingDetail from './pages/BuildingDetail.jsx'
import Visitor from './pages/Visitor.jsx'
import About from './pages/About.jsx'
import { useTheme } from './hooks/useTheme.js'

function Shell({ theme, toggle }) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isMap = location.pathname === '/map'
  const hasDest = isMap && new URLSearchParams(location.search).has('dest')
  const hideFooter = isHome || isMap
  const hideNavbar = isHome || isMap
  const shellClass = isHome || (isMap && !hasDest)
    ? 'app-shell app-shell-landing'
    : hasDest
      ? 'app-shell app-shell-map'
      : 'app-shell'

  return (
    <div className={shellClass}>
      {!hideNavbar && <Navbar theme={theme} onToggleTheme={toggle} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/building/:id" element={<BuildingDetail />} />
        <Route path="/visitor" element={<Visitor />} />
        <Route path="/about" element={<About />} />
      </Routes>
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
