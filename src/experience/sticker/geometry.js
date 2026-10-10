import * as THREE from 'three'

export function createSheetGeometry(segments, positions, normals) {
  const { widthSegments, heightSegments, cols, rows } = segments
  const geometry = new THREE.BufferGeometry()
  const index = []
  for (let iy = 0; iy < heightSegments; iy += 1) {
    for (let ix = 0; ix < widthSegments; ix += 1) {
      const a = ix + cols * iy
      const b = ix + cols * (iy + 1)
      const c = ix + 1 + cols * (iy + 1)
      const d = ix + 1 + cols * iy
      index.push(a, b, d, b, c, d)
    }
  }
  const uvs = new Float32Array(cols * rows * 2)
  for (let iy = 0; iy < rows; iy += 1) {
    for (let ix = 0; ix < cols; ix += 1) {
      const i = (iy * cols + ix) * 2
      uvs[i] = ix / widthSegments
      uvs[i + 1] = 1 - iy / heightSegments
    }
  }
  geometry.setIndex(index)
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0.25), 4)
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-2, -1, -0.2),
    new THREE.Vector3(2, 1, 1.4),
  )
  return geometry
}
