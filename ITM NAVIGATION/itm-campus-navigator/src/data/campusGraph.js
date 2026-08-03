import { BLOCKS, PATH_POINTS } from './campusData.js'
import { buildGraph, attachLiveNode, dijkstra, haversineM } from '../utils/dijkstra.js'

/** All walkable nodes: buildings + path junctions. */
export const CAMPUS_NODES = [...BLOCKS, ...PATH_POINTS]

export const CAMPUS_NODES_BY_ID = new Map(CAMPUS_NODES.map((n) => [n.id, n]))

/**
 * Undirected campus walk edges (roads / footpaths between hubs).
 * Weights are computed as haversine meters in buildGraph.
 */
export const CAMPUS_WALK_EDGES = [
  // South approach / parking spine
  ['itm-global-school', 'main-parking'],
  ['main-parking', 'parking-2-access'],
  ['parking-2-access', 'walking-rasta'],
  ['parking-2-access', 'parking-access'],
  ['parking-access', 'hostel-road'],
  ['hostel-road', 'hostel'],
  ['walking-rasta', 'sports-arena'],
  ['walking-rasta', 'parking-access'],

  // Sports / library corridor
  ['sports-arena', 'playground'],
  ['sports-arena', 'library'],
  ['playground', 'library'],
  ['library', 'admission'],
  ['library', 'ldv-block'],
  ['admission', 'ldv-block'],
  ['library', 'jcb-block'],
  ['library', 'kirloskar-block'],

  // Academic core
  ['kirloskar-block', 'mg-block'],
  ['kirloskar-block', 'jcb-block'],
  ['mg-block', 'jcb-block'],
  ['mg-block', 'mg-side-path'],
  ['mg-side-path', 'placement'],
  ['mg-block', 'placement'],
  ['placement', 'pc-block'],
  ['mg-block', 'pc-block'],
  ['pc-block', 'mg-side-path'],

  // North gate / canteen
  ['jcb-block', 'itm-gate'],
  ['kirloskar-block', 'itm-gate'],
  ['itm-gate', 'canteen'],
  ['kirloskar-block', 'canteen'],

  // Extra short links for better Dijkstra choices
  ['ldv-block', 'sports-arena'],
  ['jcb-block', 'playground'],
  ['mg-block', 'library'],
]

export const CAMPUS_BASE_GRAPH = buildGraph(CAMPUS_NODES_BY_ID, CAMPUS_WALK_EDGES)

/**
 * Shortest walk from live GPS → destination building using Dijkstra.
 * Returns { coords:[[lng,lat],...], distanceM, nodeIds, minutes }
 */
export function shortestCampusRoute(userPos, destBlock) {
  if (!userPos || !destBlock?.id) return null

  const destId = destBlock.id
  if (!CAMPUS_NODES_BY_ID.has(destId)) {
    // Unknown dest — straight line
    const d = haversineM(userPos, destBlock)
    return {
      coords: [
        [userPos.lng, userPos.lat],
        [destBlock.lng, destBlock.lat],
      ],
      distanceM: d,
      nodeIds: ['__live__', destId],
      minutes: Math.max(1, Math.round(d / 80)),
    }
  }

  // Already almost at destination
  const direct = haversineM(userPos, destBlock)
  if (direct < 25) {
    return {
      coords: [
        [userPos.lng, userPos.lat],
        [destBlock.lng, destBlock.lat],
      ],
      distanceM: direct,
      nodeIds: ['__live__', destId],
      minutes: 1,
    }
  }

  const liveId = '__live__'
  const graph = attachLiveNode(CAMPUS_BASE_GRAPH, CAMPUS_NODES_BY_ID, userPos, liveId, 3, 200)
  const result = dijkstra(graph, liveId, destId)

  if (!result) {
    return {
      coords: [
        [userPos.lng, userPos.lat],
        [destBlock.lng, destBlock.lat],
      ],
      distanceM: direct,
      nodeIds: ['__live__', destId],
      minutes: Math.max(1, Math.round(direct / 80)),
    }
  }

  const coords = [[userPos.lng, userPos.lat]]
  for (const id of result.path) {
    if (id === liveId) continue
    const n = CAMPUS_NODES_BY_ID.get(id)
    if (n) coords.push([n.lng, n.lat])
  }

  // Ensure destination pin is last
  const last = coords[coords.length - 1]
  if (!last || last[0] !== destBlock.lng || last[1] !== destBlock.lat) {
    coords.push([destBlock.lng, destBlock.lat])
  }

  return {
    coords,
    distanceM: result.distance,
    nodeIds: result.path,
    minutes: Math.max(1, Math.round(result.distance / 80)),
  }
}
