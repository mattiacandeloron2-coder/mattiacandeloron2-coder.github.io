import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function mat(color, extras = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.46,
    metalness: 0.04,
    clearcoat: 0.12,
    ...extras,
  })
}

function shell() {
  const profile = [
    new THREE.Vector2(0.02, -0.42),
    new THREE.Vector2(0.22, -0.34),
    new THREE.Vector2(0.3, -0.12),
    new THREE.Vector2(0.24, 0.08),
    new THREE.Vector2(0.16, 0.26),
    new THREE.Vector2(0.08, 0.4),
  ]
  const geo = new THREE.LatheGeometry(profile, 48)
  geo.rotateZ(0.18)
  geo.rotateX(0.12)
  return new THREE.Mesh(geo, mat('#f2f2ee'))
}

function planes() {
  const group = new THREE.Group()
  const material = mat('#c7d2c7', { transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide })
  for (let i = 0; i < 5; i += 1) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.9), material)
    mesh.position.set((i - 2) * 0.09, 0, (i - 2) * 0.05)
    mesh.rotation.y = 0.18 * i - 0.3
    group.add(mesh)
  }
  return group
}

function tube() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, -0.3, 0.1),
    new THREE.Vector3(-0.1, 0.05, 0.22),
    new THREE.Vector3(0.12, 0.28, -0.05),
    new THREE.Vector3(0.32, -0.05, -0.18),
    new THREE.Vector3(0.08, -0.32, 0.12),
  ])
  const geo = new THREE.TubeGeometry(curve, 80, 0.055, 16, false)
  return new THREE.Mesh(geo, mat('#e8e8e4'))
}

function monolith() {
  const parts = [
    new THREE.BoxGeometry(0.28, 0.82, 0.22),
    new THREE.BoxGeometry(0.42, 0.18, 0.3),
    new THREE.BoxGeometry(0.16, 0.4, 0.16),
  ]
  parts[1].translate(0.08, -0.22, 0.04)
  parts[2].translate(-0.12, 0.18, 0.06)
  const geo = mergeGeometries(parts)
  return new THREE.Mesh(geo, mat('#dfe6e4'))
}

function modules() {
  const group = new THREE.Group()
  const material = mat('#f4f4f1')
  const accent = mat('#829da7')
  const offsets = [
    [0, 0, 0],
    [0.22, 0.12, 0.04],
    [-0.2, 0.08, -0.06],
    [0.06, -0.2, 0.1],
    [-0.08, 0.24, -0.12],
  ]
  offsets.forEach((pos, i) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12 - i * 0.008, 24, 16), i === 1 ? accent : material)
    mesh.position.set(...pos)
    group.add(mesh)
  })
  return group
}

const factories = { shell, planes, tube, monolith, modules }

export function createProjectObject(type) {
  return (factories[type] || shell)()
}
