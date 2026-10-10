import * as THREE from 'three'

/**
 * Normalize wheel / trackpad / touch into a comparable pixel-like delta.
 */
export class ScrollController {
  constructor(options) {
    this.options = options
    this.target = 0
    this.current = 0
    this.velocity = 0
    this.energy = 0
    this.max = options.max ?? 1
    this.locked = false
    this.boundWheel = this.onWheel.bind(this)

    window.addEventListener('wheel', this.boundWheel, { passive: false })
  }

  onWheel(event) {
    event.preventDefault()
    if (this.locked) {
      this.onLocked?.(event)
      return
    }
    const { maxDelta, pixelScale, lineScale, pageScale, distance } = this.options
    let delta = event.deltaY

    if (event.deltaMode === 1) delta *= lineScale
    else if (event.deltaMode === 2) delta *= window.innerHeight * pageScale
    else delta *= pixelScale

    delta = THREE.MathUtils.clamp(delta, -maxDelta, maxDelta)
    this.target = THREE.MathUtils.clamp(this.target + delta / distance, 0, this.max)
  }

  setMax(max) {
    this.max = max
    this.target = THREE.MathUtils.clamp(this.target, 0, this.max)
  }

  applyTouchDelta(deltaY) {
    if (this.locked) return
    const { maxDelta, distance, touchScale } = this.options
    const clamped = THREE.MathUtils.clamp(deltaY * touchScale, -maxDelta, maxDelta)
    this.target = THREE.MathUtils.clamp(this.target + clamped / distance, 0, this.max)
  }

  update() {
    const previous = this.current
    this.current = THREE.MathUtils.lerp(this.current, this.target, this.options.lerp)
    this.velocity = this.current - previous
    this.energy = THREE.MathUtils.lerp(this.energy, Math.min(Math.abs(this.velocity) * 55, 1), 0.18)
    this.energy *= 1 - this.options.energyDecay
    return this.current
  }

  dispose() {
    window.removeEventListener('wheel', this.boundWheel)
  }
}
