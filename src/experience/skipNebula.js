import { clamp, damp } from './math.js'

export const NEBULA_COLORS = [
  '#3F3A46',
  '#53485C',
  '#6B5C78',
  '#756484',
  '#4E4A5A',
  '#8A7B96',
  '#5C5668',
]

export function nebulaSpeed(hover) {
  return 0.62 - hover * 0.5
}

export function nebulaScale(hover) {
  return 1 + hover * 0.12
}

export function nebulaCount(reducedMotion) {
  return reducedMotion ? 900 : 2200
}

export function nebulaGrainSize(sizeSeed, pixelRatio = 1) {
  return (1.42 + sizeSeed * 0.7) * pixelRatio
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function unit(x, y, z) {
  const n = Math.hypot(x, y, z) || 1
  return { x: x / n, y: y / n, z: z / n }
}

function rotateAround(point, axis, angle) {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const d = point.x * axis.x + point.y * axis.y + point.z * axis.z
  const cr = cross(axis, point)
  const k = 1 - c
  return {
    x: point.x * c + cr.x * s + axis.x * d * k,
    y: point.y * c + cr.y * s + axis.y * d * k,
    z: point.z * c + cr.z * s + axis.z * d * k,
  }
}

function hash3(x, y, z) {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453)
}

function noise3(x, y, z) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  const fx = x - ix
  const fy = y - iy
  const fz = z - iz
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const uz = fz * fz * (3 - 2 * fz)
  const n = (i, j, k) => hash3(ix + i, iy + j, iz + k)
  const x00 = n(0, 0, 0) * (1 - ux) + n(1, 0, 0) * ux
  const x10 = n(0, 1, 0) * (1 - ux) + n(1, 1, 0) * ux
  const x01 = n(0, 0, 1) * (1 - ux) + n(1, 0, 1) * ux
  const x11 = n(0, 1, 1) * (1 - ux) + n(1, 1, 1) * ux
  const y0 = x00 * (1 - uy) + x10 * uy
  const y1 = x01 * (1 - uy) + x11 * uy
  return y0 * (1 - uz) + y1 * uz
}

function potential(x, y, z, t, offset) {
  return noise3(x + t * 0.37 + offset, y + t * 0.11, z + t * 0.29 + offset * 0.7)
}

export function nebulaCurl(point, time) {
  const e = 0.09
  const p1 = (x, y, z) => potential(x, y, z, time, 0)
  const p2 = (x, y, z) => potential(x, y, z, time, 17.2)
  const p3 = (x, y, z) => potential(x, y, z, time, 31.8)
  const flow = {
    x: (p3(point.x, point.y + e, point.z) - p3(point.x, point.y - e, point.z) - (p2(point.x, point.y, point.z + e) - p2(point.x, point.y, point.z - e))) / (2 * e),
    y: (p1(point.x, point.y, point.z + e) - p1(point.x, point.y, point.z - e) - (p3(point.x + e, point.y, point.z) - p3(point.x - e, point.y, point.z))) / (2 * e),
    z: (p2(point.x + e, point.y, point.z) - p2(point.x - e, point.y, point.z) - (p1(point.x, point.y + e, point.z) - p1(point.x, point.y - e, point.z))) / (2 * e),
  }
  return unit(flow.x, flow.y, flow.z)
}

const CLOUD_AXIS = unit(0.18, 0.96, 0.22)

function gelScale(point, time, amount) {
  const n = noise3(point.x * 1.4 + time * 0.48, point.y * 1.4 + 4.1, point.z * 1.4 + time * 0.56)
  const n2 = noise3(point.x * 2.4 + time * 0.31 + 11.7, point.y * 2.4, point.z * 2.4 + time * 0.37)
  return 1 + amount * ((n - 0.5) * 1.85 + (n2 - 0.5) * 0.9)
}

export function nebulaPoint(seed, time, speed, hover = 0) {
  const t = time * speed
  const rest = 1 - hover
  const r = seed.radius
  let point = {
    x: r * Math.sin(seed.phi) * Math.cos(seed.theta),
    y: r * Math.cos(seed.phi),
    z: r * Math.sin(seed.phi) * Math.sin(seed.theta),
  }
  point = rotateAround(point, CLOUD_AXIS, t * 0.22)
  const warp = gelScale(point, t, 0.4 * rest + 0.07 * hover)
  const squash = nebulaCurl(
    { x: point.x * 0.85 + t * 0.22, y: point.y * 0.85, z: point.z * 0.85 + 8.2 },
    t * 0.42,
  )
  const squashAmp = 0.22 * rest + 0.04 * hover
  point = {
    x: point.x * warp + squash.x * squashAmp,
    y: point.y * warp + squash.y * squashAmp * 0.55,
    z: point.z * warp + squash.z * squashAmp,
  }
  const field = {
    x: point.x * 2.6 + t * 0.24,
    y: point.y * 2.6,
    z: point.z * 2.6 + t * 0.38,
  }
  const flow = nebulaCurl(field, t * 0.5)
  const curlAmp = 0.16 * (0.38 + 0.62 * rest)
  let next = {
    x: point.x + flow.x * curlAmp,
    y: point.y + flow.y * curlAmp,
    z: point.z + flow.z * curlAmp,
  }
  const span = Math.hypot(next.x, next.y, next.z)
  if (span > 1.22) {
    const scale = 1.22 / span
    next = { x: next.x * scale, y: next.y * scale, z: next.z * scale }
  }
  return {
    x: next.x,
    y: next.y * 0.84,
    z: next.z,
  }
}

export function skipScrollTarget(viewportHeight, distance) {
  if (distance <= 0) return 1
  return 1 + viewportHeight / distance
}

export function skipVisible(worksTravelValue) {
  return clamp(1 - worksTravelValue / 0.35, 0, 1)
}

function hexRgb(hex) {
  const value = hex.replace('#', '')
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
}

function fract(n) {
  return n - Math.floor(n)
}

function seedUnit(index, channel) {
  return fract(Math.sin(index * 12.9898 + channel * 78.233) * 43758.5453)
}

function makeSeed(index) {
  const g = (channel) => seedUnit(index, channel)
  return {
    theta: g(1) * Math.PI * 2,
    phi: Math.acos(2 * g(2) - 1),
    radius: Math.pow(0.06 + g(3) * 0.94, 0.72),
    size: g(6),
    color: hexRgb(NEBULA_COLORS[index % NEBULA_COLORS.length]),
    alpha: 0.28 + g(7) * 0.42,
  }
}

export class SkipNebula {
  constructor(root, options = {}) {
    this.root = root
    this.canvas = root?.querySelector('[data-skip-cloud]')
    this.ctx = this.canvas?.getContext('2d')
    this.reducedMotion = Boolean(options.reducedMotion)
    this.onSkip = options.onSkip
    this.hover = 0
    this.hovering = false
    this.time = 0
    this.count = nebulaCount(this.reducedMotion)
    this.seeds = Array.from({ length: this.count }, (_, index) => makeSeed(index))
    this.boundEnter = () => {
      this.hovering = true
    }
    this.boundLeave = () => {
      this.hovering = false
    }
    this.boundClick = (event) => {
      event.preventDefault()
      this.onSkip?.()
    }
    if (this.root) {
      this.root.addEventListener('pointerenter', this.boundEnter)
      this.root.addEventListener('pointerleave', this.boundLeave)
      this.root.addEventListener('click', this.boundClick)
      this.fit()
    }
  }

  fit() {
    if (!this.canvas) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio))
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
    this.ratio = ratio
  }

  update(dt, worksTravelValue) {
    if (!this.root || !this.ctx) return
    const visible = skipVisible(worksTravelValue)
    this.root.style.opacity = String(visible)
    this.root.style.pointerEvents = visible > 0.04 ? 'auto' : 'none'
    this.root.hidden = visible <= 0
    if (visible <= 0) return

    this.fit()
    this.hover = damp(this.hover, this.hovering ? 1 : 0, this.hovering ? 7 : 4.2, dt)
    const speed = nebulaSpeed(this.hover) * (this.reducedMotion ? 0.28 : 1)
    this.time += dt * speed
    const scale = nebulaScale(this.hover)
    this.canvas.style.transform = `scale(${scale})`
    this.draw()
  }

  draw() {
    const ctx = this.ctx
    const { width, height } = this.canvas
    ctx.clearRect(0, 0, width, height)
    const radius = Math.min(width, height) * 0.4
    const cx = width * 0.5
    const cy = height * 0.5
    const pixelRatio = this.ratio || 1

    for (const seed of this.seeds) {
      const point = nebulaPoint(seed, this.time, 1, this.hover)
      const depth = 1 / (1.55 - point.z * 0.42)
      const x = cx + point.x * radius * depth
      const y = cy + point.y * radius * depth
      const size = nebulaGrainSize(seed.size, pixelRatio) * (0.82 + (point.z + 1) * 0.16)
      const fade = seed.alpha * (0.34 + (point.z + 1) * 0.28) * (1.02 - seed.radius * 0.48)
      const [r, g, b] = seed.color
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fade})`
      ctx.beginPath()
      ctx.arc(x, y, size * 0.52, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  dispose() {
    if (!this.root) return
    this.root.removeEventListener('pointerenter', this.boundEnter)
    this.root.removeEventListener('pointerleave', this.boundLeave)
    this.root.removeEventListener('click', this.boundClick)
  }
}
