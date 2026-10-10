import * as THREE from 'three'
import { stickerConfig } from './config.js'
import { createAdhesionTween } from './animation.js'
import {
  deformStickerInto,
  adhesionTravel,
  segmentGrid,
  shadowInto,
  shadowOpacity,
  stickerNormalsInto,
  worldSize,
} from './deformation.js'
import { createSheetGeometry } from './geometry.js'
import { createStickerMaterials } from './materials.js'

function devProgress() {
  let dev = false
  try {
    dev = Boolean(import.meta.env.DEV)
  } catch {
    dev = false
  }
  if (!dev || typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('peel')
  if (raw == null || raw === '') return null
  const value = Number(raw)
  if (!Number.isFinite(value)) return null
  return Math.min(1, Math.max(0, value))
}

export class StickerAdhesion {
  constructor(host, src, { reducedMotion = false } = {}) {
    this.host = host
    this.src = src
    this.reducedMotion = reducedMotion
    this.aspect = 482 / 231
    this.progress = 0
    this.ready = false
    this.mounted = false
    this.failed = false
    this.devLock = devProgress()
    this.lastApplied = null
    this.segments = null
    this.narrowQuery = typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)') : null

    const img = host?.querySelector('img')
    if (img) {
      this.onImage = () => {
        if (!img.naturalWidth || !img.naturalHeight) return
        this.aspect = img.naturalWidth / img.naturalHeight
        host.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`
        if (this.ready) this.resize()
      }
      img.addEventListener('load', this.onImage)
      if (img.complete) this.onImage()
    }
  }

  wake() {
    if (this.reducedMotion || this.failed || this.mounted || !this.host) return
    this.mounted = true
    try {
      this.mount()
    } catch {
      this.failed = true
      this.teardown()
    }
  }

  mount() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.domElement.setAttribute('aria-hidden', 'true')
    this.host.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(20, 1, 0.01, 30)
    this.driver = createAdhesionTween((progress) => this.apply(progress), stickerConfig)
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(this.host)

    const loader = new THREE.TextureLoader()
    loader.load(
      encodeURI(this.src),
      (texture) => this.onTexture(texture),
      undefined,
      () => {
        this.failed = true
      },
    )
  }

  onTexture(texture) {
    if (this.failed || !this.renderer) {
      texture.dispose()
      return
    }
    const image = texture.image
    if (image?.width && image?.height) {
      this.aspect = image.width / image.height
      this.host.style.aspectRatio = `${image.width} / ${image.height}`
    }
    const materials = createStickerMaterials(texture, {
      thickness: stickerConfig.thickness,
      backColor: stickerConfig.backColor,
      anisotropy: this.renderer.capabilities.getMaxAnisotropy(),
    })
    this.texture = texture
    this.frontMaterial = materials.front
    this.backMaterial = materials.back
    this.shadowMaterial = materials.shadow
    this.ready = true
    this.resize()
    this.host.classList.add('is-webgl')
    this.apply(this.devLock == null ? this.progress : this.devLock, true)
  }

  resize() {
    if (!this.renderer || !this.host) return
    const width = this.host.clientWidth
    const height = this.host.clientHeight
    if (width < 2 || height < 2) return
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.setSize(width, height, false)
    this.fitCamera()
    if (!this.ready) return
    const narrow = this.narrowQuery?.matches || width < 768
    this.ensureMesh(narrow)
    this.apply(this.devLock == null ? this.progress : this.devLock, true)
  }

  fitCamera(progress = 1) {
    const { width, height } = worldSize(this.aspect)
    const distance = stickerConfig.cameraDistance
    const open = 1 - adhesionTravel(progress)
    const yaw = open * stickerConfig.viewYaw
    const pitch = open * stickerConfig.viewPitch
    const pad = 1 + open * stickerConfig.viewPadding
    this.worldWidth = width
    this.worldHeight = height
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((height / 2) * pad / distance))
    this.camera.aspect = width / height
    this.camera.position.set(
      Math.sin(yaw) * distance,
      Math.sin(pitch) * distance,
      Math.cos(yaw) * Math.cos(pitch) * distance,
    )
    this.camera.near = 0.01
    this.camera.far = distance + 12
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()
  }

  ensureMesh(narrow) {
    const next = segmentGrid(stickerConfig, narrow)
    if (this.segments && this.segments.cols === next.cols && this.segments.rows === next.rows && this.frontMesh) {
      return
    }
    this.segments = next
    const count = next.cols * next.rows
    this.positions = new Float32Array(count * 3)
    this.normals = new Float32Array(count * 3)
    this.shadowPositions = new Float32Array(count * 3)
    this.shadowNormals = new Float32Array(count * 3)
    this.geometry?.dispose()
    this.shadowGeometry?.dispose()
    this.geometry = createSheetGeometry(next, this.positions, this.normals)
    this.shadowGeometry = createSheetGeometry(next, this.shadowPositions, this.shadowNormals)
    if (!this.frontMesh) {
      this.shadowMesh = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial)
      this.backMesh = new THREE.Mesh(this.geometry, this.backMaterial)
      this.frontMesh = new THREE.Mesh(this.geometry, this.frontMaterial)
      this.shadowMesh.renderOrder = 0
      this.backMesh.renderOrder = 1
      this.frontMesh.renderOrder = 2
      this.shadowMesh.frustumCulled = false
      this.backMesh.frustumCulled = false
      this.frontMesh.frustumCulled = false
      this.scene.add(this.shadowMesh, this.backMesh, this.frontMesh)
      return
    }
    this.frontMesh.geometry = this.geometry
    this.backMesh.geometry = this.geometry
    this.shadowMesh.geometry = this.shadowGeometry
    this.lastApplied = null
  }

  apply(progress, force = false) {
    this.progress = progress
    if (!this.ready || !this.geometry || !this.renderer) return
    if (!force && this.lastApplied != null && Math.abs(progress - this.lastApplied) < 0.0004) return
    if (this.host.clientWidth < 2 || this.host.clientHeight < 2) return
    this.lastApplied = progress
    this.fitCamera(progress)
    const segments = this.segments
    deformStickerInto(
      this.positions,
      progress,
      stickerConfig,
      this.worldWidth,
      this.worldHeight,
      segments,
    )
    stickerNormalsInto(this.normals, this.positions, segments.cols, segments.rows)
    shadowInto(this.shadowPositions, this.positions, progress, stickerConfig)
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.normal.needsUpdate = true
    this.shadowGeometry.attributes.position.needsUpdate = true
    this.shadowMaterial.uniforms.opacity.value = shadowOpacity(progress, stickerConfig)
    this.renderer.render(this.scene, this.camera)
  }

  setDwell(dwell) {
    if (this.reducedMotion || this.failed || !this.driver) return
    if (this.devLock == null) this.driver.setDwell(dwell)
    else this.driver.setProgress(this.devLock)
  }

  setProgress(progress) {
    this.driver?.setProgress(progress)
  }

  teardown() {
    this.observer?.disconnect()
    this.driver?.dispose()
    this.geometry?.dispose()
    this.shadowGeometry?.dispose()
    this.frontMaterial?.dispose()
    this.backMaterial?.dispose()
    this.shadowMaterial?.dispose()
    this.texture?.dispose()
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer.domElement.remove()
      this.renderer = null
    }
    this.host?.classList.remove('is-webgl')
    this.ready = false
    this.mounted = false
  }
}
