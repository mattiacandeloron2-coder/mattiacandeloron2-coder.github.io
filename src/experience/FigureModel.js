import * as THREE from 'three'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export class FigureModel {
  constructor(scene, options, { reducedMotion = false } = {}) {
    this.scene = scene
    this.options = options
    this.reducedMotion = reducedMotion
    this.group = new THREE.Group()
    this.scene.add(this.group)
    this.meshes = []
    this.root = null
    this.nativeHeight = 1
  }

  async load() {
    const url = this.options.model
    const root = url.endsWith('.obj')
      ? await new OBJLoader().loadAsync(url)
      : (await new GLTFLoader().loadAsync(url)).scene

    root.updateMatrixWorld(true)

    const color = new THREE.Color(this.options.color)
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: this.options.roughness,
      metalness: this.options.metalness,
      envMapIntensity: 0,
      dithering: true,
    })

    root.traverse((child) => {
      if (!child.isMesh) return
      child.material = material.clone()
      child.castShadow = false
      child.receiveShadow = false
      child.frustumCulled = false
      this.meshes.push(child)
    })

    const box = new THREE.Box3().setFromObject(root)
    this.nativeHeight = Math.max(box.getSize(new THREE.Vector3()).y, 0.001)
    this.root = root
    this.group.add(root)
    this.group.rotation.y = this.options.yawOffset ?? 0
    this.applyLayout(this.options.height, this.options.position)
    return this
  }

  applyLayout(height, position = { x: 0, y: 0, z: 0 }) {
    if (!this.root) return this
    this.root.position.set(0, 0, 0)
    this.root.scale.setScalar(1)
    this.root.updateMatrixWorld(true)
    this.root.scale.setScalar(height / this.nativeHeight)
    this.root.updateMatrixWorld(true)
    const scaled = new THREE.Box3().setFromObject(this.root)
    const center = scaled.getCenter(new THREE.Vector3())
    this.root.position.sub(center)
    this.group.position.set(position.x ?? 0, position.y ?? 0, position.z ?? 0)
    return this
  }

  setOpacity(value) {
    const opacity = THREE.MathUtils.clamp(value, 0, 1)
    this.group.visible = opacity > 0.02
    for (const mesh of this.meshes) {
      mesh.material.transparent = opacity < 0.999
      mesh.material.opacity = opacity
      mesh.material.depthWrite = opacity > 0.85
    }
  }

  update() {
    return this
  }
}
