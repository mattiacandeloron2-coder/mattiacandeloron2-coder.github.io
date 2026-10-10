import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function transform(geometry, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const matrix = new THREE.Matrix4()
  matrix.compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  )
  geometry.applyMatrix4(matrix)
  return geometry
}

function tube(points, radius, tubular = 18, radial = 14) {
  const curve = new THREE.CatmullRomCurve3(points)
  return new THREE.TubeGeometry(curve, tubular, radius, radial, false)
}

/**
 * Temporary sculptural male figure.
 * Replace later by setting `config.figure.modelUrl`.
 */
export function createMannequin(targetHeight = 1.78) {
  const torsoProfile = [
    new THREE.Vector2(0.048, 1.52),
    new THREE.Vector2(0.07, 1.47),
    new THREE.Vector2(0.11, 1.42),
    new THREE.Vector2(0.205, 1.36),
    new THREE.Vector2(0.228, 1.3),
    new THREE.Vector2(0.215, 1.2),
    new THREE.Vector2(0.188, 1.08),
    new THREE.Vector2(0.168, 0.97),
    new THREE.Vector2(0.162, 0.88),
    new THREE.Vector2(0.185, 0.8),
    new THREE.Vector2(0.205, 0.73),
    new THREE.Vector2(0.155, 0.67),
    new THREE.Vector2(0.08, 0.64),
  ]

  const leftArm = tube([
    new THREE.Vector3(0.2, 1.33, 0.02),
    new THREE.Vector3(0.3, 1.18, 0.04),
    new THREE.Vector3(0.36, 0.96, 0.05),
    new THREE.Vector3(0.39, 0.76, 0.06),
    new THREE.Vector3(0.4, 0.6, 0.08),
  ], 0.042, 20, 16)

  const rightArm = tube([
    new THREE.Vector3(-0.2, 1.33, 0.02),
    new THREE.Vector3(-0.3, 1.18, 0.04),
    new THREE.Vector3(-0.36, 0.96, 0.05),
    new THREE.Vector3(-0.39, 0.76, 0.06),
    new THREE.Vector3(-0.4, 0.6, 0.08),
  ], 0.042, 20, 16)

  const leftLeg = tube([
    new THREE.Vector3(0.09, 0.68, 0.01),
    new THREE.Vector3(0.1, 0.42, 0.02),
    new THREE.Vector3(0.105, 0.18, 0.03),
    new THREE.Vector3(0.11, -0.04, 0.04),
    new THREE.Vector3(0.112, -0.22, 0.06),
  ], 0.055, 20, 16)

  const rightLeg = tube([
    new THREE.Vector3(-0.09, 0.68, 0.01),
    new THREE.Vector3(-0.1, 0.42, 0.02),
    new THREE.Vector3(-0.105, 0.18, 0.03),
    new THREE.Vector3(-0.11, -0.04, 0.04),
    new THREE.Vector3(-0.112, -0.22, 0.06),
  ], 0.055, 20, 16)

  const parts = [
    new THREE.LatheGeometry(torsoProfile, 48),
    transform(new THREE.SphereGeometry(0.118, 32, 24), 0, 1.635, 0.018, 0, 0, 0, 0.9, 1.12, 0.95),
    transform(new THREE.SphereGeometry(0.046, 20, 16), 0.4, 0.57, 0.09, 0, 0, 0, 1.2, 0.82, 0.72),
    transform(new THREE.SphereGeometry(0.046, 20, 16), -0.4, 0.57, 0.09, 0, 0, 0, 1.2, 0.82, 0.72),
    transform(new THREE.SphereGeometry(0.05, 20, 16), 0.115, -0.255, 0.09, 0.15, 0, 0.08, 1.45, 0.48, 2.15),
    transform(new THREE.SphereGeometry(0.05, 20, 16), -0.115, -0.255, 0.09, 0.15, 0, -0.08, 1.45, 0.48, 2.15),
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
  ]

  const geometry = mergeGeometries(parts, false)
  parts.forEach((part) => part.dispose())

  geometry.computeVertexNormals()
  geometry.computeBoundingBox()

  const size = new THREE.Vector3()
  geometry.boundingBox.getSize(size)
  geometry.scale(targetHeight / size.y, targetHeight / size.y, targetHeight / size.y)
  geometry.computeBoundingBox()
  geometry.translate(
    -(geometry.boundingBox.min.x + geometry.boundingBox.max.x) * 0.5,
    -geometry.boundingBox.min.y,
    -(geometry.boundingBox.min.z + geometry.boundingBox.max.z) * 0.5,
  )
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  return geometry
}
