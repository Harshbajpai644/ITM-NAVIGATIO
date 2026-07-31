import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import MapPage from './pages/MapPage.jsx'
import BuildingDetail from './pages/BuildingDetail.jsx'
import Visitor from './pages/Visitor.jsx'
import About from './pages/About.jsx'
import { useTheme } from './hooks/useTheme.js'

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar theme={theme} onToggleTheme={toggle} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/building/:id" element={<BuildingDetail />} />
          <Route path="/visitor" element={<Visitor />} />
          <Route path="/about" element={<About />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
