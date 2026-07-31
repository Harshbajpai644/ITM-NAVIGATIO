import { useState, useMemo } from 'react'
import SearchBar from '../components/SearchBar.jsx'
import BuildingCard from '../components/BuildingCard.jsx'
import { BLOCKS, CATEGORIES } from '../data/campusData.js'

export default function Home() {
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    if (category === 'all') return BLOCKS
    if (category === 'blocks') {
      // show general academic blocks (exclude special categories)
      return BLOCKS.filter((b) => !['hostel', 'library', 'admission', 'canteen'].includes(b.category))
    }
    return BLOCKS.filter((b) => b.category === category)
  }, [category])

  return (
    <div>
      <section className="hero">
        <div className="eyebrow" style={{ display: 'flex', justifyContent: 'center' }}>
          Live GPS · Smart Search · Real-Time Directions
        </div>
        <h1 className="hero-title">
          Navigate <span>ITM University</span>
        </h1>
        <p className="hero-sub">
          Search your destination, turn on your location, and instantly view the real walking route—whether it's the department, hostel, library, or anywhere else, all in one place.
        </p>
        <SearchBar />
        <div className="chip-row">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`chip ${category === c.id ? 'active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="eyebrow">Popular Buildings</div>
          <div className="section-title">Where you want to go?, </div>
        </div>
        <div className="building-grid">
          {filtered.map((b) => (
            <BuildingCard key={b.id} building={b} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="glass-card" style={{ padding: '30px 20px' }}>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-num">125+</div>
              <div className="stat-lbl">Acre Campus</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">14</div>
              <div className="stat-lbl">Schools</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">5</div>
              <div className="stat-lbl">Hostels</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">3000+</div>
              <div className="stat-lbl">Auditorium Seats</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
