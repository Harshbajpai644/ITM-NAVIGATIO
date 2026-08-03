import * as THREE from 'three'

export function createHumanAvatar({ accent = 0x00c2a8 } = {}) {
  const group = new THREE.Group()
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.7 })
  const shirt = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.55, emissive: accent, emissiveIntensity: 0.12 })
  const pants = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.7 })
  const shoe = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.8 })
  const hair = new THREE.MeshStandardMaterial({ color: 0x3b2a1a, roughness: 0.85 })

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.02
  group.add(shadow)

  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.28, 4, 8), pants)
  leftLeg.position.set(-0.1, 0.28, 0)
  const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.28, 4, 8), pants)
  rightLeg.position.set(0.1, 0.28, 0)
  group.add(leftLeg, rightLeg)

  const ls = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), shoe)
  ls.position.set(-0.1, 0.06, 0.04)
  const rs = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), shoe)
  rs.position.set(0.1, 0.06, 0.04)
  group.add(ls, rs)

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.28, 6, 12), shirt)
  torso.position.y = 0.72
  group.add(torso)

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 8), shirt)
  leftArm.position.set(-0.3, 0.72, 0)
  leftArm.rotation.z = 0.25
  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 8), shirt)
  rightArm.position.set(0.3, 0.72, 0)
  rightArm.rotation.z = -0.25
  group.add(leftArm, rightArm)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skin)
  head.position.y = 1.12
  group.add(head)
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.185, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), hair)
  hairCap.position.y = 1.16
  group.add(hairCap)

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.55, 40),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.03
  group.add(ring)

  group.userData = { leftLeg, rightLeg, leftArm, rightArm, ring, head, torso }
  return group
}

export function updateHumanAvatar(avatar, { t, walking = false }) {
  if (!avatar?.userData) return
  const { leftLeg, rightLeg, leftArm, rightArm, ring, head, torso } = avatar.userData
  if (ring) {
    const pulse = 1 + Math.sin(t * 3.4) * 0.18
    ring.scale.set(pulse, pulse, 1)
    ring.material.opacity = 0.4 + Math.sin(t * 3.4) * 0.28
  }
  if (walking) {
    const phase = t * 9
    const swing = Math.sin(phase) * 0.7
    if (leftLeg) leftLeg.rotation.x = swing
    if (rightLeg) rightLeg.rotation.x = -swing
    if (leftArm) leftArm.rotation.x = -swing * 0.75
    if (rightArm) rightArm.rotation.x = swing * 0.75
    avatar.position.y = Math.abs(Math.sin(phase)) * 0.06
  } else {
    if (leftLeg) leftLeg.rotation.x *= 0.85
    if (rightLeg) rightLeg.rotation.x *= 0.85
    avatar.position.y = Math.sin(t * 2.2) * 0.025
    if (head) head.rotation.y = Math.sin(t * 1.3) * 0.15
    if (torso) torso.rotation.z = Math.sin(t * 1.1) * 0.02
  }
}
