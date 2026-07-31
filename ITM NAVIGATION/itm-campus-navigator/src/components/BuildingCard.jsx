import { Link } from 'react-router-dom'

export default function BuildingCard({ building }) {
  return (
    <Link to={`/building/${building.id}`} className="building-card glass-card">
      <img src={building.image} alt={building.name} />
      <div className="building-card-body">
        <div className="building-card-name">{building.name}</div>
        <div className="building-card-cat">{building.category}</div>
      </div>
    </Link>
  )
}
