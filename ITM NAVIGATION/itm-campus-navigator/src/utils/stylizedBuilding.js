import * as THREE from 'three'

const WALL = 0xf0c4b0
const WALL_DARK = 0xd9a08c
const WINDOW = 0x1a2744
const BALCONY = 0x8fd9c4
const BALCONY_DARK = 0x5bbfa8
const DOOR = 0x6b4a3a
const ROOF = 0xe0b09c
const BASE = 0xe8b8a4
const DEST_WALL = 0x2ec4b6
const DEST_WALL_DARK = 0x1a9e90
const FRAME = 0xf7e6dc
const PLANTER = 0x3d8b6e

export function createStylizedBuilding({ floors = 5, isDest = false } = {}) {
  const group = new THREE.Group()
  const wallColor = isDest ? DEST_WALL : WALL
  const wallDark = isDest ? DEST_WALL_DARK : WALL_DARK

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.68, metalness: 0.04 })
  const wallDarkMat = new THREE.MeshStandardMaterial({ color: wallDark, roughness: 0.72 })
  const windowMat = new THREE.MeshStandardMaterial({
    color: WINDOW, roughness: 0.25, metalness: 0.35,
    emissive: isDest ? 0x0a3a44 : 0x050814,
    emissiveIntensity: isDest ? 0.35 : 0.15,
  })
  const balconyMat = new THREE.MeshStandardMaterial({ color: isDest ? 0xffffff : BALCONY, roughness: 0.5 })
  const balconyDarkMat = new THREE.MeshStandardMaterial({ color: isDest ? 0xd5fff8 : BALCONY_DARK, roughness: 0.55 })
  const doorMat = new THREE.MeshStandardMaterial({ color: DOOR, roughness: 0.85 })
  const roofMat = new THREE.MeshStandardMaterial({ color: isDest ? 0x178f82 : ROOF, roughness: 0.65 })
  const baseMat = new THREE.MeshStandardMaterial({ color: isDest ? DEST_WALL : BASE, roughness: 0.8 })
  const frameMat = new THREE.MeshStandardMaterial({ color: isDest ? 0xd5fff8 : FRAME, roughness: 0.7 })
  const planterMat = new THREE.MeshStandardMaterial({ color: PLANTER, roughness: 0.8 })
  const glassRailMat = new THREE.MeshStandardMaterial({
    color: isDest ? 0xb8fff4 : 0xc8efe6, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.55,
  })

  const width = 1.35
  const depth = 0.98
  const floorH = 0.5
  const bodyH = floors * floorH + 0.34

  const base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.42, 0.1, depth + 0.42), baseMat)
  base.position.y = 0.05
  group.add(base)

  const step = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.22), wallDarkMat)
  step.position.set(0, 0.08, depth / 2 + 0.18)
  group.add(step)

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, bodyH, depth), wallMat)
  body.position.y = 0.1 + bodyH / 2
  group.add(body)

  for (let floor = 1; floor < floors; floor++) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.035, depth + 0.04), wallDarkMat)
    band.position.y = 0.1 + floor * floorH
    group.add(band)
  }

  const quoinGeo = new THREE.BoxGeometry(0.13, 0.15, 0.13)
  for (let i = 0; i < floors + 2; i++) {
    const y = 0.22 + i * (floorH * 0.85)
    ;[[width / 2, depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2], [-width / 2, -depth / 2]].forEach(([x, z]) => {
      const q = new THREE.Mesh(quoinGeo, wallDarkMat)
      q.position.set(x * 0.94, y, z * 0.94)
      group.add(q)
    })
  }

  const winW = 0.17
  const winH = 0.28
  const winGeo = new THREE.BoxGeometry(winW, winH, 0.045)
  const frameGeo = new THREE.BoxGeometry(winW + 0.045, winH + 0.045, 0.02)
  const windowMeshes = []
  const balconyMeshes = []

  function addWindow(x, y, z, rotY = 0) {
    const frame = new THREE.Mesh(frameGeo, frameMat)
    frame.position.set(x, y, z)
    frame.rotation.y = rotY
    group.add(frame)
    const wf = new THREE.Mesh(winGeo, windowMat.clone())
    const nx = Math.sin(rotY) * 0.02
    const nz = Math.cos(rotY) * 0.02
    wf.position.set(x + nx, y, z + nz)
    wf.rotation.y = rotY
    group.add(wf)
    windowMeshes.push(wf)
  }

  function addBalconyUnit(x, y, faceZ) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.14, 0.05, 0.2), balconyMat)
    slab.position.set(x, y - winH / 2 - 0.04, faceZ + 0.12)
    group.add(slab)
    balconyMeshes.push(slab)
    const panel = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.12, 0.14, 0.015), glassRailMat)
    panel.position.set(x, y - winH / 2 + 0.04, faceZ + 0.21)
    group.add(panel)
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.14, 0.025, 0.025), balconyDarkMat)
    railTop.position.set(x, y - winH / 2 + 0.12, faceZ + 0.21)
    group.add(railTop)
    for (const rx of [-0.1, -0.035, 0.035, 0.1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.14, 0.022), balconyDarkMat)
      post.position.set(x + rx, y - winH / 2 + 0.04, faceZ + 0.21)
      group.add(post)
    }
    const planter = new THREE.Mesh(new THREE.BoxGeometry(winW * 0.7, 0.06, 0.08), planterMat)
    planter.position.set(x, y - winH / 2 + 0.01, faceZ + 0.16)
    group.add(planter)
  }

  function addWideBalcony(y, faceZ) {
    const slabW = width * 0.92
    const slab = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.055, 0.24), balconyMat)
    slab.position.set(0, y - winH / 2 - 0.05, faceZ + 0.14)
    group.add(slab)
    balconyMeshes.push(slab)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.025, 0.025), balconyDarkMat)
    rail.position.set(0, y - winH / 2 + 0.12, faceZ + 0.24)
    group.add(rail)
    const panel = new THREE.Mesh(new THREE.BoxGeometry(slabW - 0.04, 0.15, 0.015), glassRailMat)
    panel.position.set(0, y - winH / 2 + 0.04, faceZ + 0.24)
    group.add(panel)
  }

  for (let floor = 0; floor < floors; floor++) {
    const y = 0.3 + floor * floorH + floorH * 0.42
    const faceZ = depth / 2
    if (floor > 0 && floor % 2 === 0) addWideBalcony(y, faceZ)
    for (let c = 0; c < 3; c++) {
      const x = -0.4 + c * 0.4
      addWindow(x, y, faceZ + 0.005)
      if (floor > 0 && floor % 2 === 1 && (floor + c) % 2 === 0) addBalconyUnit(x, y, faceZ)
      addWindow(width / 2 + 0.005, y, -0.28 + c * 0.28, Math.PI / 2)
    }
  }

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.28), wallDarkMat)
  canopy.position.set(0, 0.48, depth / 2 + 0.14)
  group.add(canopy)
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.05), doorMat)
  door.position.set(0, 0.28, depth / 2 + 0.03)
  group.add(door)

  const roofY = 0.1 + bodyH
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.14, depth + 0.1), roofMat)
  parapet.position.y = roofY + 0.03
  group.add(parapet)

  if (isDest) {
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.25, 48),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false })
    )
    glow.rotation.x = -Math.PI / 2
    glow.position.y = 0.04
    group.add(glow)
    group.userData.destGlow = glow
  }

  group.userData.windowMeshes = windowMeshes
  group.userData.balconyMeshes = balconyMeshes
  group.userData.isDest = isDest
  return group
}
