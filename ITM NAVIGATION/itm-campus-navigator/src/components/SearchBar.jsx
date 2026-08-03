import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BLOCKS } from '../data/campusData.js'

export default function SearchBar({ autoFocus }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return BLOCKS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [query])

  const goToBuilding = (id) => {
    setOpen(false)
    setQuery('')
    navigate(`/building/${id}`)
  }

  const handleGo = () => {
    if (matches.length > 0) goToBuilding(matches[0].id)
  }

  return (
    <div className="search-wrap">
      <div className="search-input-row">
        <span aria-hidden="true">🔍</span>
        <input
          autoFocus={autoFocus}
          type="text"
          placeholder="Library, Hostel, School of Engineering…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleGo()}
          onFocus={() => setOpen(true)}
        />
        <button className="search-go" onClick={handleGo}>Search</button>
      </div>
      {open && matches.length > 0 && (
        <div className="search-suggestions">
          {matches.map((b) => (
            <div key={b.id} className="suggestion-item" onClick={() => goToBuilding(b.id)}>
              <span className="suggestion-name">{b.name}</span>
              <span className="suggestion-cat">{b.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
