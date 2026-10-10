import * as THREE from 'three'
import { createProjectObject } from './createProjectObjects.js'

const INFO_KEYS = ['CONTEXT', 'RESEARCH', 'CONCEPT', 'DEVELOPMENT', 'FINAL RESULT']

export class ProjectField {
  constructor(scene, camera, renderer, projects, options = {}) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.projects = projects
    this.group = new THREE.Group()
    this.scene.add(this.group)
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.items = []
    this.hoverIndex = -1
    this.selectedIndex = -1
    this.visible = 0
    this.rotationY = 0
    this.dragging = false
    this.lastX = 0
    this.onSelect = options.onSelect || (() => {})
    this.onHover = options.onHover || (() => {})
    this.onBack = options.onBack || (() => {})

    const spread = 1.35
    projects.forEach((data, index) => {
      const object = createProjectObject(data.type)
      object.traverse((child) => {
        if (child.isMesh) child.userData.index = index
      })
      const x = (index - 2) * spread
      object.position.set(x, 0, 0)
      object.scale.setScalar(0.001)
      this.group.add(object)
      this.items.push({
        data,
        object,
        base: new THREE.Vector3(x, 0, 0),
        hover: 0,
        appear: 0,
      })
    })

    this.boundMove = this.onPointerMove.bind(this)
    this.boundDown = this.onPointerDown.bind(this)
    this.boundUp = this.onPointerUp.bind(this)
    this.renderer.domElement.addEventListener('pointermove', this.boundMove)
    this.renderer.domElement.addEventListener('pointerdown', this.boundDown)
    window.addEventListener('pointerup', this.boundUp)
  }

  setVisibleAmount(value) {
    this.visible = value
    const active = value > 0.12 && this.selectedIndex < 0
    this.renderer.domElement.style.pointerEvents = active || this.selectedIndex >= 0 ? 'auto' : 'none'
  }

  onPointerMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    if (this.dragging && this.selectedIndex >= 0) {
      this.rotationY += (event.clientX - this.lastX) * 0.008
      this.lastX = event.clientX
      return
    }

    if (this.visible < 0.2 || this.selectedIndex >= 0) return
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.group.children, true)
    const next = hits.length ? hits[0].object.userData.index : -1
    if (next !== this.hoverIndex) {
      this.hoverIndex = next
      this.onHover(next >= 0 ? this.projects[next] : null)
    }
  }

  onPointerDown(event) {
    if (this.selectedIndex >= 0) {
      this.dragging = true
      this.lastX = event.clientX
      return
    }
    if (this.visible < 0.25) return
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.group.children, true)
    if (!hits.length) return
    this.selectedIndex = hits[0].object.userData.index
    this.rotationY = 0
    this.onSelect(this.projects[this.selectedIndex])
  }

  onPointerUp() {
    this.dragging = false
  }

  exitDetail() {
    this.selectedIndex = -1
    this.rotationY = 0
    this.onBack()
  }

  currentInfo() {
    if (this.selectedIndex < 0) return null
    const angle = ((this.rotationY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const deg = THREE.MathUtils.radToDeg(angle)
    const stops = [0, 60, 130, 210, 300]
    let key = INFO_KEYS[0]
    stops.forEach((stop, i) => {
      if (deg >= stop) key = INFO_KEYS[i]
    })
    const project = this.projects[this.selectedIndex]
    return { key, copy: project.info[key], project }
  }

  update() {
    this.items.forEach((item, index) => {
      const show = this.visible
      item.appear += ((show > 0.05 ? 1 : 0) - item.appear) * 0.06
      const selected = this.selectedIndex === index
      const other = this.selectedIndex >= 0 && !selected
      const hover = this.hoverIndex === index ? 1 : 0
      item.hover += (hover - item.hover) * 0.1

      const scale = item.appear * (other ? 0.0001 : selected ? 1.18 : 0.92 + item.hover * 0.12)
      item.object.scale.setScalar(Math.max(scale, 0.0001))
      item.object.visible = item.appear > 0.02 && scale > 0.02

      if (selected) {
        item.object.position.lerp(new THREE.Vector3(0.35, 0.05, 0.2), 0.08)
        item.object.rotation.y = this.rotationY
      } else {
        const quiet = this.selectedIndex >= 0 ? 1.15 : 1
        item.object.position.lerp(item.base.clone().multiplyScalar(quiet), 0.08)
        item.object.rotation.y += (item.hover * 0.4 - item.object.rotation.y) * 0.08
        item.object.rotation.x += (item.hover * 0.12 - item.object.rotation.x) * 0.08
      }
    })
  }

  dispose() {
    this.renderer.domElement.removeEventListener('pointermove', this.boundMove)
    this.renderer.domElement.removeEventListener('pointerdown', this.boundDown)
    window.removeEventListener('pointerup', this.boundUp)
  }
}
