import * as THREE from 'three'
import { lerp } from './math.js'

export class CameraRig {
  constructor(camera, options) {
    this.camera = camera
    this.options = options
    this.lookAt = new THREE.Vector3(options.lookAt.x, options.lookAt.y, options.lookAt.z)
    this.position = new THREE.Vector3(0, options.lookAt.y + 0.12, options.distance)
    this.angle = THREE.MathUtils.degToRad(options.orbitStart ?? 0)
    this.radius = options.distance
    this.position.set(
      Math.sin(this.angle) * this.radius,
      options.lookAt.y + (options.orbitHeight ?? 0.12),
      Math.cos(this.angle) * this.radius,
    )
    this.camera.position.copy(this.position)
    this.camera.lookAt(this.lookAt)
    this.mode = 'intro'
  }

  setFraming(distance, lookAt) {
    this.options.distance = distance
    this.options.lookAt = lookAt
    this.lookAt.set(lookAt.x, lookAt.y, lookAt.z)
    this.radius = distance
  }

  targetAngle(intro, reducedMotion = false) {
    const start = THREE.MathUtils.degToRad(this.options.orbitStart ?? 0)
    if (reducedMotion) return start
    const turns = this.options.orbitTurns ?? 1
    return start + intro * Math.PI * 2 * turns
  }

  update(progress, reducedMotion = false) {
    const introEnd = this.options.introEnd ?? 1
    const intro = Math.min(progress / introEnd, 1)
    const lookY = this.options.lookAt.y
    const camY = lookY + (this.options.orbitHeight ?? 0.12)

    const wantedAngle = this.targetAngle(intro, reducedMotion)
    this.angle += (wantedAngle - this.angle) * this.options.lerp
    const wantedRadius = lerp(this.options.distance, this.options.distance - 0.22, intro)
    this.radius += (wantedRadius - this.radius) * this.options.lerp

    this.position.set(Math.sin(this.angle) * this.radius, camY, Math.cos(this.angle) * this.radius)
    this.lookAt.set(this.options.lookAt.x, lookY, this.options.lookAt.z)

    this.camera.position.copy(this.position)
    this.camera.lookAt(this.lookAt)
    return { intro, yaw: this.angle }
  }
}
