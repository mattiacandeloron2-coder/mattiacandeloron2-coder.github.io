import * as THREE from 'three'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { sectionOpacity, labelOcclusionOpacity } from './math.js'

export class Sections {
  constructor(cssScene, items, orbit = {}) {
    this.orbit = orbit
    this.introEnd = orbit.introEnd ?? 1
    this.start = THREE.MathUtils.degToRad(orbit.orbitStart ?? 0)
    this.turns = orbit.orbitTurns ?? 1
    this.mobile = Boolean(orbit.mobile)

    this.items = items.map((data, index) => {
      const element = document.createElement('article')
      const side = (data.position?.x ?? (index % 2 === 0 ? -1 : 1)) >= 0 ? 1 : -1
      element.className = `section${side > 0 ? ' is-right' : ''}`
      element.innerHTML = `
        <div class="section-inner">
          <span class="section-index">${data.index}</span>
          <h2 class="section-title">${data.title}</h2>
          <div class="section-body">${data.body}</div>
        </div>
      `
      const object = new CSS2DObject(element)
      element.style.opacity = '0'
      cssScene.add(object)
      return { data, element, object, index, side }
    })

    this.place()
  }

  setMobile(mobile) {
    this.mobile = Boolean(mobile)
    this.place()
  }

  place() {
    const lateral = this.mobile ? 0.08 : (this.orbit.sectionLateral ?? 1.14)
    const along = this.orbit.sectionAlong ?? 0.06

    this.items.forEach(({ data, element, object, index, side }) => {
      element.classList.toggle('is-stack', this.mobile)
      if (this.mobile) {
        object.position.set(0, 0.54, 0)
        return
      }
      const t = Math.min(data.focus / this.introEnd, 1)
      const angle = this.start + t * Math.PI * 2 * this.turns
      object.position.set(
        Math.sin(angle) * along + Math.cos(angle) * side * lateral,
        data.position?.y ?? (index % 3 - 1) * 0.22,
        Math.cos(angle) * along - Math.sin(angle) * side * lateral,
      )
    })
  }

  update(progress, camera, lookAt, figureRadius = 0.4) {
    const cam = [camera.position.x, camera.position.y, camera.position.z]
    const look = [lookAt.x, lookAt.y, lookAt.z]
    this.items.forEach(({ data, element, object }) => {
      const pos = object.position
      const opacity =
        sectionOpacity(progress, data.appear, data.focus, data.disappear) *
        labelOcclusionOpacity(cam, look, [pos.x, pos.y, pos.z], figureRadius)
      element.style.opacity = String(opacity)
      element.style.visibility = opacity < 0.02 ? 'hidden' : 'visible'
    })
  }
}
