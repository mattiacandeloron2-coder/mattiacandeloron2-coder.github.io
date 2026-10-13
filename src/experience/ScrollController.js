import * as THREE from 'three'

const holdFrameCap = 1 / 20

export function holdStep(target, dt, rate, max, gates) {
  if (!gates?.armed || gates.locked) return target
  const step = Math.min(Math.max(dt, 0), holdFrameCap)
  if (!(rate > 0) || !(max >= 0)) return target
  return THREE.MathUtils.clamp(target + step * rate, 0, max)
}

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
    this.armed = false
    this.boundWheel = this.onWheel.bind(this)

    window.addEventListener('wheel', this.boundWheel, { passive: false })
  }

  onWheel(event) {
    event.preventDefault()
    if (!this.armed) return
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

  arm() {
    this.armed = true
  }

  applyTouchDelta(deltaY) {
    if (!this.armed || this.locked) return
    const { maxDelta, distance, touchScale } = this.options
    const clamped = THREE.MathUtils.clamp(deltaY * touchScale, -maxDelta, maxDelta)
    this.target = THREE.MathUtils.clamp(this.target + clamped / distance, 0, this.max)
  }

  hold(dt) {
    this.target = holdStep(this.target, dt, this.options.holdRate ?? 0, this.max, {
      armed: this.armed,
      locked: this.locked,
    })
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
