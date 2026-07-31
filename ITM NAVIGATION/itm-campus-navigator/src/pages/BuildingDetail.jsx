import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { BLOCKS } from '../data/campusData.js'

export default function BuildingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const block = BLOCKS.find((b) => b.id === id)
  const [openIndex, setOpenIndex] = useState(null)
  const [shareMsg, setShareMsg] = useState('')

  if (!block) {
    return (
      <div className="page page-narrow">
        <h1 className="page-title">place not found</h1>
        <Link className="back-link" to="/">← Back to the home page</Link>
      </div>
    )
  }

  const nearbyBlocks = block.nearby.map((nid) => BLOCKS.find((b) => b.id === nid)).filter(Boolean)

  const handleShare = async () => {
    const url = `${window.location.origin}/building/${block.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: block.name, text: `${block.name} — ITM University Gwalior`, url })
      } catch {
        /* user cancelled share, ignore */
      }
    } else {
      await navigator.clipboard.writeText(url)
      setShareMsg('Link copy ho gaya!')
      setTimeout(() => setShareMsg(''), 2000)
    }
  }

  return (
    <div className="page page-narrow">
      <div className="eyebrow">{block.category}</div>
      <h1 className="page-title" style={{ fontSize: 24 }}>{block.name}</h1>
      <img className="detail-photo" src={block.image} alt={block.name} />
      <p className="detail-desc">{block.description}</p>
      <p className="status-note" style={{ marginTop: -14, marginBottom: 18 }}>🕒 {block.hours}</p>

      <div className="tag-row">
        {block.facilities.map((f) => <span key={f} className="tag">{f}</span>)}
      </div>

      <div className="btn-row" style={{ marginBottom: 26 }}>
        <button className="btn btn-primary" onClick={() => navigate(`/map?dest=${block.id}`)}>
          Navigate
        </button>
        <button className="btn btn-outline" onClick={handleShare}>Share</button>
      </div>
      {shareMsg && <p className="status-note go" style={{ marginTop: -18, marginBottom: 18 }}>{shareMsg}</p>}

      <div className="eyebrow">Yahan kisse milna hai</div>
      <ul className="people-list">
        {block.people.map((p, i) => (
          <li key={i} onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            <div className="person-row">
              <div>
                <div className="person-name">{p.name}</div>
                <div className="person-role">{p.designation}</div>
              </div>
              <div className="person-arrow">{openIndex === i ? '−' : '+'}</div>
            </div>
            {openIndex === i && <div className="person-popover">Room: {p.room}</div>}
          </li>
        ))}
      </ul>

      {nearbyBlocks.length > 0 && (
        <>
          <div className="eyebrow">Nearby Buildings</div>
          <div className="building-grid" style={{ marginBottom: 10 }}>
            {nearbyBlocks.map((nb) => (
              <Link key={nb.id} to={`/building/${nb.id}`} className="building-card glass-card">
                <img src={nb.image} alt={nb.name} />
                <div className="building-card-body">
                  <div className="building-card-name">{nb.name}</div>
                  <div className="building-card-cat">{nb.category}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <Link className="back-link" to="/">← Back to the home page</Link>
    </div>
  )
}
