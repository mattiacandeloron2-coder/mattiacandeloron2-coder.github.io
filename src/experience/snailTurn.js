import * as THREE from 'three'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

const plastic = new THREE.MeshPhysicalMaterial({
  color: 0x101010,
  metalness: 0,
  roughness: 0.38,
  clearcoat: 1,
  clearcoatRoughness: 0.18,
  reflectivity: 0.5,
  envMapIntensity: 0.65,
  side: THREE.DoubleSide,
})

export class SnailTurn {
  constructor(host, url, { reducedMotion = false } = {}) {
    this.host = host
    this.url = url
    this.reducedMotion = reducedMotion
    this.yaw = 0.35
    this.pitch = 0.04
    this.dragging = false
    this.held = false
    this.ready = false
    this.loading = false
    this.mounted = false
    this.lastX = 0
    this.lastY = 0
    this.renderer = null

    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    host.addEventListener('pointerdown', this.onPointerDown)
    host.addEventListener('pointermove', this.onPointerMove)
    host.addEventListener('pointerup', this.onPointerUp)
    host.addEventListener('pointercancel', this.onPointerUp)
    host.addEventListener('keydown', this.onKeyDown)
  }

  mount() {
    if (this.mounted) return
    this.mounted = true
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.96
    this.renderer.domElement.setAttribute('aria-hidden', 'true')
    this.host.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 20)
    this.camera.position.set(0, 0.08, 3.35)
    this.turntable = new THREE.Group()
    this.scene.add(this.turntable)

    const hemi = new THREE.HemisphereLight(0xf7f4ee, 0x2c2c2c, 0.9)
    const key = new THREE.DirectionalLight(0xffffff, 2.5)
    key.position.set(2.6, 3.4, 4.2)
    const rim = new THREE.DirectionalLight(0xd5e0e8, 1.7)
    rim.position.set(-3.4, 1.6, -2.6)
    const fill = new THREE.DirectionalLight(0xfff4ea, 0.55)
    fill.position.set(-1.8, -0.6, 2.4)
    this.scene.add(hemi, key, rim, fill)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
  }

  wake() {
    this.mount()
    if (this.loading || this.ready || !this.url) return
    this.loading = true
    this.load().catch(() => {
      this.loading = false
    })
  }

  async load() {
    const raw = await new OBJLoader().loadAsync(this.url)
    raw.traverse((child) => {
      if (!child.isMesh) return
      const welded = mergeVertices(child.geometry, 0.05)
      if (welded !== child.geometry) child.geometry.dispose()
      welded.computeVertexNormals()
      child.geometry = welded
      child.material = plastic
    })
    const box = new THREE.Box3().setFromObject(raw)
    const size = box.getSize(new THREE.Vector3())
    raw.position.sub(box.getCenter(new THREE.Vector3()))
    const upright = new THREE.Group()
    upright.rotation.y = -Math.PI / 2
    upright.add(raw)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    upright.scale.setScalar(1 / maxDim)
    this.turntable.add(upright)
    this.frameCamera()
    this.ready = true
    this.loading = false
  }

  frameCamera() {
    this.turntable.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(this.turntable)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const vFov = (this.camera.fov * Math.PI) / 180
    const aspect = this.host.clientWidth / Math.max(this.host.clientHeight, 1)
    const radius = Math.max(size.x, size.y, size.z, 0.001) / 2
    const tan = Math.tan(vFov / 2)
    const dist = (Math.max(radius / tan, radius / (tan * aspect)) || 1) * 1.18
    this.camera.position.set(center.x, center.y, center.z + dist)
    this.camera.near = Math.max(0.01, dist * 0.05)
    this.camera.far = dist + radius * 8
    this.camera.lookAt(center)
    this.camera.updateProjectionMatrix()
  }

  onPointerDown(event) {
    if (event.button != null && event.button !== 0) return
    this.dragging = true
    this.held = true
    this.lastX = event.clientX
    this.lastY = event.clientY
    this.host.classList.add('is-turning')
    this.host.setPointerCapture?.(event.pointerId)
  }

  onPointerMove(event) {
    if (!this.dragging) return
    const dx = event.clientX - this.lastX
    const dy = event.clientY - this.lastY
    this.lastX = event.clientX
    this.lastY = event.clientY
    this.yaw += dx * 0.008
    this.pitch = Math.max(-0.55, Math.min(0.7, this.pitch + dy * 0.0045))
  }

  onPointerUp(event) {
    this.dragging = false
    this.held = false
    this.host.classList.remove('is-turning')
    if (this.host.hasPointerCapture?.(event.pointerId)) this.host.releasePointerCapture(event.pointerId)
  }

  onKeyDown(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    this.yaw += event.key === 'ArrowLeft' ? -0.18 : 0.18
  }

  resize() {
    const width = this.host.clientWidth
    const height = this.host.clientHeight
    if (width < 2 || height < 2) return
    if (width === this.width && height === this.height) return
    this.width = width
    this.height = height
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    if (this.ready) this.frameCamera()
    else this.camera.updateProjectionMatrix()
  }

  render() {
    if (!this.renderer) return
    const box = this.host.getBoundingClientRect()
    if (box.bottom <= 0 || box.top >= window.innerHeight || box.width < 2) return
    this.resize()
    if (!this.dragging && !this.held && !this.reducedMotion) this.yaw += 0.004
    this.turntable.rotation.y = this.yaw
    this.turntable.rotation.x = this.pitch
    this.renderer.render(this.scene, this.camera)
  }
}
