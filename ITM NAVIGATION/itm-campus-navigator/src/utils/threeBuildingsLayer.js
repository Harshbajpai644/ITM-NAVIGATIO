import * as THREE from 'three'
import { MercatorCoordinate } from 'maplibre-gl'
import { createStylizedBuilding } from './stylizedBuilding.js'
import { createHumanAvatar, updateHumanAvatar } from './humanAvatar.js'

function easeOutElastic(t) {
  if (t === 0 || t === 1) return t
  return (
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
  )
}

/**
 * MapLibre custom 3D layer — stylized balcony buildings + human avatar
 * with strong unique animations.
 */
export function createCampusBuildingsLayer(blocks, destId) {
  const state = {
    map: null,
    renderer: null,
    scene: null,
    camera: null,
    root: null,
    destId,
    startTime: performance.now(),
    lastFrame: performance.now(),
    avatarHolder: null,
    userPos: null,
    lastUserPos: null,
    walking: false,
  }

  function disposeObject(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
        else o.material.dispose()
      }
    })
  }

  function clearRootKeepAvatar() {
    if (!state.root) return
    ;[...state.root.children].forEach((child) => {
      if (child.userData?.kind === 'avatar') return
      state.root.remove(child)
      disposeObject(child)
    })
  }

  function rebuildBuildings() {
    if (!state.root) return
    state.startTime = performance.now()
    clearRootKeepAvatar()

    blocks.forEach((b, idx) => {
      const isDest = b.id === state.destId
      const floors = isDest ? 7 : 4 + (idx % 3)
      const building = createStylizedBuilding({ floors, isDest })

      const meters = isDest ? 36 : 26
      const mc = MercatorCoordinate.fromLngLat({ lng: b.lng, lat: b.lat }, 0)
      const meterScale = mc.meterInMercatorCoordinateUnits()

      const holder = new THREE.Group()
      holder.add(building)
      holder.userData = {
        kind: 'building',
        building,
        isDest,
        phase: idx * 0.45,
        baseMeters: meters,
        transform: {
          translateX: mc.x,
          translateY: mc.y,
          translateZ: mc.z,
          scale: meterScale * meters,
          rotateY: ((idx * 18) % 50) * (Math.PI / 180),
          meterScale,
        },
      }
      building.scale.setScalar(0.01)
      state.root.add(holder)
    })
  }

  function ensureAvatar() {
    if (!state.root || state.avatarHolder) return
    const avatar = createHumanAvatar({ accent: 0x00c2a8 })
    const holder = new THREE.Group()
    holder.add(avatar)
    holder.visible = false
    holder.userData = {
      kind: 'avatar',
      avatar,
      transform: null,
    }
    state.root.add(holder)
    state.avatarHolder = holder
  }

  function syncAvatarTransform(lng, lat) {
    if (!state.avatarHolder) return
    const mc = MercatorCoordinate.fromLngLat({ lng, lat }, 0)
    const meterScale = mc.meterInMercatorCoordinateUnits()
    const meters = 9
    state.avatarHolder.userData.transform = {
      translateX: mc.x,
      translateY: mc.y,
      translateZ: mc.z,
      scale: meterScale * meters,
      rotateY: state.avatarHolder.userData.facing || 0,
      meterScale,
    }
    state.avatarHolder.visible = true
  }

  function applyBuildingAnimation(holder, now, dt) {
    const { building, isDest, phase, transform, baseMeters } = holder.userData
    if (!building || !transform) return

    const elapsed = (now - state.startTime) / 1000
    const appearT = Math.min(1, Math.max(0, (elapsed - phase * 0.14) / 0.75))
    const appearScale =
      appearT <= 0 ? 0.01 : appearT < 1 ? easeOutElastic(appearT) : 1

    // Stronger idle bob + slight sway
    const bob = Math.sin(elapsed * 1.8 + phase) * 0.055
    const sway = Math.sin(elapsed * 0.55 + phase) * 0.02

    // Destination pulse
    const pulse = isDest ? 1 + Math.sin(elapsed * 2.8) * 0.06 : 1

    building.scale.setScalar(Math.max(0.01, appearScale * pulse))
    building.position.y = bob + (appearT < 1 ? (1 - appearT) * 0.4 : 0)
    building.rotation.y = sway + (isDest ? Math.sin(elapsed * 0.85) * 0.1 : 0)

    // Window blink — unique per pane
    const windows = building.userData.windowMeshes || []
    windows.forEach((mesh, i) => {
      if (!mesh.material) return
      const blink =
        0.18 +
        Math.sin(elapsed * 2.6 + i * 0.55 + phase * 3) * 0.22 +
        (isDest ? 0.15 : 0)
      mesh.material.emissiveIntensity = Math.max(0.06, blink)
    })

    // Balcony shimmer
    const balconies = building.userData.balconyMeshes || []
    balconies.forEach((mesh, i) => {
      if (!mesh.material || mesh.material.color == null) return
      const shimmer = 0.92 + Math.sin(elapsed * 3 + i) * 0.08
      mesh.scale.y = shimmer
    })

    // Destination ground glow pulse
    if (building.userData.destGlow) {
      const g = building.userData.destGlow
      const p = 1 + Math.sin(elapsed * 3.2) * 0.2
      g.scale.set(p, p, 1)
      g.material.opacity = 0.4 + Math.sin(elapsed * 3.2) * 0.3
    }

    transform.scale = transform.meterScale * baseMeters
  }

  function applyAvatarAnimation(now, dt) {
    const holder = state.avatarHolder
    if (!holder?.visible || !holder.userData.avatar) return
    const t = (now - state.startTime) / 1000
    updateHumanAvatar(holder.userData.avatar, {
      t,
      dt,
      walking: state.walking,
    })
    if (holder.userData.transform) {
      holder.userData.transform.rotateY = holder.userData.facing || 0
    }
  }

  return {
    id: 'campus-stylized-buildings',
    type: 'custom',
    renderingMode: '3d',

    onAdd(map, gl) {
      state.map = map
      state.camera = new THREE.Camera()
      state.scene = new THREE.Scene()
      state.root = new THREE.Group()
      state.scene.add(state.root)
      state.startTime = performance.now()
      state.lastFrame = state.startTime

      state.scene.add(new THREE.AmbientLight(0xffffff, 0.85))
      const sun = new THREE.DirectionalLight(0xfff1d6, 1.15)
      sun.position.set(100, 140, 80)
      state.scene.add(sun)
      const fill = new THREE.DirectionalLight(0xa5f3fc, 0.45)
      fill.position.set(-60, 50, -40)
      state.scene.add(fill)
      state.scene.add(new THREE.HemisphereLight(0xdbeafe, 0x78716c, 0.35))

      state.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      })
      state.renderer.autoClear = false
      if ('outputColorSpace' in state.renderer) {
        state.renderer.outputColorSpace = THREE.SRGBColorSpace
      }

      rebuildBuildings()
      ensureAvatar()
      if (state.userPos) {
        syncAvatarTransform(state.userPos.lng, state.userPos.lat)
      }
    },

    setDestination(id) {
      state.destId = id
      rebuildBuildings()
      ensureAvatar()
      if (state.userPos) {
        syncAvatarTransform(state.userPos.lng, state.userPos.lat)
      }
      state.map?.triggerRepaint()
    },

    setUserPosition(pos) {
      if (!pos || !Number.isFinite(pos.lng) || !Number.isFinite(pos.lat)) {
        state.userPos = null
        if (state.avatarHolder) state.avatarHolder.visible = false
        return
      }

      if (state.lastUserPos) {
        const dx = pos.lng - state.lastUserPos.lng
        const dy = pos.lat - state.lastUserPos.lat
        const dist = Math.sqrt(dx * dx + dy * dy)
        state.walking = dist > 0.0000012
        if (state.walking && state.avatarHolder) {
          state.avatarHolder.userData.facing = Math.atan2(dx, dy)
        }
      }
      state.lastUserPos = { lng: pos.lng, lat: pos.lat }
      state.userPos = pos
      ensureAvatar()
      syncAvatarTransform(pos.lng, pos.lat)
      state.map?.triggerRepaint()
    },

    render(_gl, matrix) {
      if (!state.renderer || !state.scene || !state.camera || !state.root) return

      const now = performance.now()
      const dt = Math.min(0.05, (now - state.lastFrame) / 1000)
      state.lastFrame = now
      const mapMatrix = new THREE.Matrix4().fromArray(matrix)

      state.renderer.resetState()

      const holders = state.root.children.filter((h) => h.userData?.transform)

      holders.forEach((holder) => {
        if (holder.userData.kind === 'building') {
          applyBuildingAnimation(holder, now, dt)
        } else if (holder.userData.kind === 'avatar') {
          applyAvatarAnimation(now, dt)
        }

        const t = holder.userData.transform
        if (!t) return

        const rotationX = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          Math.PI / 2
        )
        const rotationY = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          t.rotateY || 0
        )

        const model = new THREE.Matrix4()
          .makeTranslation(t.translateX, t.translateY, t.translateZ)
          .scale(new THREE.Vector3(t.scale, -t.scale, t.scale))
          .multiply(rotationX)
          .multiply(rotationY)

        holders.forEach((h) => {
          h.visible = h === holder
        })
        state.camera.projectionMatrix = mapMatrix.clone().multiply(model)
        state.renderer.render(state.scene, state.camera)
      })

      holders.forEach((h) => {
        h.visible = h.userData.kind === 'avatar' ? Boolean(state.userPos) : true
      })

      state.map.triggerRepaint()
    },

    onRemove() {
      if (state.root) {
        ;[...state.root.children].forEach((child) => disposeObject(child))
      }
      state.renderer = null
      state.scene = null
      state.camera = null
      state.root = null
      state.avatarHolder = null
      state.map = null
    },
  }
}