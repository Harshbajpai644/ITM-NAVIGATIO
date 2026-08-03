/**
 * Dijkstra shortest path on an undirected weighted graph.
 * graph: Map<nodeId, Array<{ to: string, w: number }>>
 * returns { path: string[], distance: number } or null
 */
export function dijkstra(graph, startId, endId) {
  if (!startId || !endId || !graph.has(startId) || !graph.has(endId)) return null
  if (startId === endId) return { path: [startId], distance: 0 }

  const dist = new Map()
  const prev = new Map()
  const visited = new Set()

  for (const id of graph.keys()) dist.set(id, Infinity)
  dist.set(startId, 0)

  // Tiny campus graph → simple O(V²) pick is fine
  while (visited.size < graph.size) {
    let u = null
    let best = Infinity
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < best) {
        best = d
        u = id
      }
    }
    if (u == null || best === Infinity) break
    if (u === endId) break
    visited.add(u)

    const edges = graph.get(u) || []
    for (const { to, w } of edges) {
      if (visited.has(to)) continue
      const nd = best + w
      if (nd < dist.get(to)) {
        dist.set(to, nd)
        prev.set(to, u)
      }
    }
  }

  if (dist.get(endId) === Infinity) return null

  const path = []
  let cur = endId
  while (cur != null) {
    path.push(cur)
    if (cur === startId) break
    cur = prev.get(cur)
  }
  path.reverse()
  if (path[0] !== startId) return null

  return { path, distance: dist.get(endId) }
}

export function haversineM(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/** Build adjacency list from nodes + undirected edge id pairs. */
export function buildGraph(nodesById, edgePairs) {
  const graph = new Map()
  for (const id of nodesById.keys()) graph.set(id, [])

  const link = (a, b) => {
    const na = nodesById.get(a)
    const nb = nodesById.get(b)
    if (!na || !nb) return
    const w = haversineM(na, nb)
    graph.get(a).push({ to: b, w })
    graph.get(b).push({ to: a, w })
  }

  for (const [a, b] of edgePairs) link(a, b)
  return graph
}

/**
 * Clone graph and attach a temporary live-GPS node connected to nearest hubs.
 */
export function attachLiveNode(baseGraph, nodesById, livePos, liveId = '__live__', k = 3, maxLinkM = 180) {
  const graph = new Map()
  for (const [id, edges] of baseGraph) {
    graph.set(id, edges.map((e) => ({ ...e })))
  }
  graph.set(liveId, [])

  const ranked = [...nodesById.entries()]
    .map(([id, n]) => ({ id, d: haversineM(livePos, n) }))
    .sort((a, b) => a.d - b.d)

  const links = ranked.filter((x) => x.d <= maxLinkM).slice(0, k)
  const chosen = links.length > 0 ? links : ranked.slice(0, 1)

  for (const { id, d } of chosen) {
    graph.get(liveId).push({ to: id, w: d })
    graph.get(id).push({ to: liveId, w: d })
  }

  return graph
}
