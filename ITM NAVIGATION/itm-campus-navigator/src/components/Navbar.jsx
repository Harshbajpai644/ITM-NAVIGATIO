import { NavLink } from 'react-router-dom'

export default function Navbar({ theme, onToggleTheme }) {
  return (
    <nav className="navbar">
      <NavLink to="/" className="brand">
        <span className="brand-name">ITM <span>NAVIGATOR</span></span>
        <span className="brand-tag">ITM University · Gwalior</span>
      </NavLink>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Home
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Map
        </NavLink>
        <NavLink to="/visitor" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="full">Visitor </span>Pass
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          About
        </NavLink>
        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle dark mode">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  )
}
