import { BLOCKS } from './campusData.js'

/** Layer toggles shown in the map UI. */
export const LAYER_DEFS = [
  { id: 'buildings', label: 'Buildings', defaultOn: true },
  { id: 'teachers', label: 'Teachers', defaultOn: false },
  { id: 'amenities', label: 'Amenities', defaultOn: true },
]

/** Extra campus points (not full buildings). Coords approximate — refine with Set pin. */
export const AMENITIES = [
  {
    id: 'washroom-library',
    name: 'Washroom (Library)',
    kind: 'washroom',
    lat: 26.13770,
    lng: 78.20805,
    hours: 'Campus hours',
    hint: 'Near Central Library',
  },
  {
    id: 'washroom-mg',
    name: 'Washroom (MG Block)',
    kind: 'washroom',
    lat: 26.13825,
    lng: 78.20740,
    hours: 'Campus hours',
    hint: 'Ground floor corridor',
  },
  {
    id: 'medical-pc',
    name: 'Medical Room',
    kind: 'medical',
    lat: 26.13845,
    lng: 78.20695,
    hours: 'Mon–Sat, 9:00 AM – 4:30 PM',
    hint: 'Near PCB / Nursing',
  },
  {
    id: 'atm-admission',
    name: 'ATM',
    kind: 'atm',
    lat: 26.13775,
    lng: 78.20815,
    hours: '24 Hours',
    hint: 'Near Admission / LDV side',
  },
  {
    id: 'bus-gate',
    name: 'Bus Stop',
    kind: 'bus',
    lat: 26.13920,
    lng: 78.20720,
    hours: 'As per bus schedule',
    hint: 'Outside main gate',
  },
]

export const AMENITY_META = {
  washroom: { short: 'WC', label: 'Washroom', color: '#0B3760' },
  medical: { short: '+', label: 'Medical', color: '#c0392b' },
  atm: { short: 'ATM', label: 'ATM', color: '#1a7a4c' },
  bus: { short: 'BUS', label: 'Bus stop', color: '#b45f06' },
  cafeteria: { short: 'FOOD', label: 'Cafeteria', color: '#00C2A8' },
  parking: { short: 'P', label: 'Parking', color: '#0F4C81' },
  gate: { short: 'GATE', label: 'Gate', color: '#0B3760' },
  sports: { short: 'PLAY', label: 'Sports', color: '#2d6a4f' },
}

/** Building ids that behave more like amenity pins on the map. */
const AMENITY_BUILDING_IDS = new Set([
  'canteen',
  'main-parking',
  'itm-gate',
  'playground',
  'sports-arena',
])

export function buildingKind(block) {
  const id = block.id
  if (id === 'canteen') return 'cafeteria'
  if (id === 'main-parking') return 'parking'
  if (id === 'itm-gate') return 'gate'
  if (id === 'playground' || id === 'sports-arena') return 'sports'
  if (block.category === 'library') return 'library'
  if (block.category === 'hostel') return 'hostel'
  return 'building'
}

export function isAmenityBuilding(block) {
  return AMENITY_BUILDING_IDS.has(block.id)
}

function offsetAround(lat, lng, index, total) {
  const angle = ((index + 1) / Math.max(total + 1, 2)) * Math.PI * 2
  const meters = 12 + (index % 4) * 6
  const dLat = (meters * Math.cos(angle)) / 111320
  const dLng = (meters * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180))
  return { lat: lat + dLat, lng: lng + dLng }
}

/** Flatten faculty onto map pins near their building. */
export function buildTeacherPlaces(blocks = BLOCKS) {
  const out = []
  for (const block of blocks) {
    const people = (block.people || []).filter(
      (p) => p.name && String(p.name).trim() && !String(p.name).toLowerCase().includes('staff')
    )
    people.forEach((p, i) => {
      const pos = offsetAround(block.lat, block.lng, i, people.length)
      out.push({
        id: `teacher-${block.id}-${i}-${p.room || i}`,
        type: 'teacher',
        name: p.name.trim(),
        designation: p.designation || 'Faculty',
        room: p.room || '',
        floor: p.floor || '',
        blockId: block.id,
        blockName: block.name,
        hours: block.hours || 'Mon–Sat, 9:00 AM – 5:00 PM',
        lat: pos.lat,
        lng: pos.lng,
      })
    })
  }
  return out
}

export function defaultLayerState() {
  return Object.fromEntries(LAYER_DEFS.map((l) => [l.id, l.defaultOn]))
}

/** Unified searchable places for map search. */
export function buildSearchIndex(blocks = BLOCKS, teachers = buildTeacherPlaces(blocks)) {
  const places = []

  for (const b of blocks) {
    places.push({
      id: b.id,
      type: isAmenityBuilding(b) ? 'amenity' : 'building',
      kind: buildingKind(b),
      name: b.name,
      subtitle: b.category,
      hours: b.hours,
      lat: b.lat,
      lng: b.lng,
      blockId: b.id,
    })
  }

  for (const a of AMENITIES) {
    places.push({
      id: a.id,
      type: 'amenity',
      kind: a.kind,
      name: a.name,
      subtitle: a.hint || AMENITY_META[a.kind]?.label || a.kind,
      hours: a.hours,
      lat: a.lat,
      lng: a.lng,
    })
  }

  for (const t of teachers) {
    places.push({
      id: t.id,
      type: 'teacher',
      kind: 'teacher',
      name: t.name,
      subtitle: `${t.designation} · ${t.blockName}${t.room ? ` · ${t.room}` : ''}`,
      hours: t.hours,
      lat: t.lat,
      lng: t.lng,
      blockId: t.blockId,
      room: t.room,
      floor: t.floor,
      designation: t.designation,
      blockName: t.blockName,
    })
  }

  return places
}

export function filterPlaces(places, query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return places
    .filter((p) => {
      const hay = `${p.name} ${p.subtitle || ''} ${p.room || ''} ${p.blockName || ''} ${p.kind || ''}`.toLowerCase()
      return hay.includes(q)
    })
    .slice(0, 12)
}
