import { stickerConfig } from './config.js'

export function clamp01(value) {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

export function segmentGrid(config = stickerConfig, narrow = false) {
  const widthSegments = narrow ? config.narrowWidthSegments : config.widthSegments
  const heightSegments = narrow ? config.narrowHeightSegments : config.heightSegments
  return {
    widthSegments,
    heightSegments,
    cols: widthSegments + 1,
    rows: heightSegments + 1,
  }
}

export function worldSize(aspect) {
  const safe = aspect > 0 ? aspect : 1
  return { width: safe, height: 1 }
}

// How far through the slide the sticker has stuck, from the page scroll.
export function stickerProgress(dwell, config = stickerConfig) {
  const end = config.scrollEnd > 0 ? config.scrollEnd : 1
  return clamp01(dwell / end)
}

// The last tenth eases in, so the free edge lands a moment after the rest.
export function adhesionTravel(progress) {
  const p = clamp01(progress)
  if (p >= 1) return 1
  if (p <= 0.9) return p
  const u = (p - 0.9) / 0.1
  const settled = u * u * (3 - 2 * u)
  return 0.9 + 0.1 * settled
}

export function adhesionBoundary(progress, config = stickerConfig) {
  const travel = adhesionTravel(progress)
  const start = clamp01(config.initialAttachedFraction)
  return start + (1 - start) * travel
}

export function freeCurlAngle(progress, config = stickerConfig) {
  const p = clamp01(progress)
  if (p >= 1) return 0
  const startFree = Math.max(1e-4, 1 - clamp01(config.initialAttachedFraction))
  const free = Math.max(0, 1 - adhesionBoundary(p, config))
  const ratio = free / startFree
  let angle = config.curlAngle * Math.pow(ratio, config.curlFalloff)
  if (p > 0.9) {
    const u = (p - 0.9) / 0.1
    const bump = Math.sin(Math.PI * u) * (1 - u)
    angle += bump * config.curlAngle * config.settlingIntensity
  }
  return angle
}

function angleAlong(t, thetaEnd, bias) {
  if (t <= 0 || thetaEnd <= 0) return 0
  if (t >= 1) return thetaEnd
  return thetaEnd * Math.pow(t, bias)
}

// Place a point `distance` along a curl of `length`, measured from the contact.
// Steps follow the tangent, so the sheet keeps its length.
export function curlPoint(distance, length, thetaEnd, bias = stickerConfig.curlBias) {
  if (distance <= 0 || length <= 1e-6 || thetaEnd <= 1e-5) {
    return { x: Math.max(0, distance), z: 0, angle: 0 }
  }
  const steps = 24
  const ds = distance / steps
  let x = 0
  let z = 0
  let prev = 0
  for (let i = 1; i <= steps; i += 1) {
    const t = (ds * i) / length
    const angle = angleAlong(t, thetaEnd, bias)
    const mid = (prev + angle) * 0.5
    x += Math.cos(mid) * ds
    z += Math.sin(mid) * ds
    prev = angle
  }
  return { x, z, angle: prev }
}

export function deformStickerInto(
  target,
  progress,
  config,
  width,
  height,
  segments,
) {
  const { widthSegments, heightSegments, cols, rows } = segments
  const p = clamp01(progress)
  const flat = p >= 0.9995
  const boundary = adhesionBoundary(p, config)
  const theta = freeCurlAngle(p, config)
  const direction = config.direction === 'right-to-left' ? -1 : 1
  const freeSpan = Math.max(0, 1 - boundary) * width
  const bias = config.curlBias

  for (let iy = 0; iy < rows; iy += 1) {
    const yPlane = iy * (height / heightSegments) - height / 2
    const y = -yPlane
    for (let ix = 0; ix < cols; ix += 1) {
      const u = widthSegments === 0 ? 0 : ix / widthSegments
      const xFlat = ix * (width / widthSegments) - width / 2
      let x = xFlat
      let z = 0
      if (!flat && theta > 1e-4) {
        const along = direction === 1 ? u : 1 - u
        if (along > boundary && freeSpan > 1e-6) {
          const distance = (along - boundary) * width
          const point = curlPoint(distance, freeSpan, theta, bias)
          const contactU = direction === 1 ? boundary : 1 - boundary
          const contactX = (contactU - 0.5) * width
          x = contactX + direction * point.x
          z = point.z
        }
      }
      const i = (iy * cols + ix) * 3
      target[i] = x
      target[i + 1] = y
      target[i + 2] = z
    }
  }
  return target
}

export function deformSticker(progress, config, width, height, segments = segmentGrid(config)) {
  const { cols, rows } = segments
  const target = new Float32Array(cols * rows * 3)
  return deformStickerInto(target, progress, config, width, height, segments)
}

export function stickerNormalsInto(target, positions, cols, rows) {
  const at = (ix, iy) => {
    const i = (iy * cols + ix) * 3
    return [positions[i], positions[i + 1], positions[i + 2]]
  }
  for (let iy = 0; iy < rows; iy += 1) {
    for (let ix = 0; ix < cols; ix += 1) {
      const left = at(Math.max(0, ix - 1), iy)
      const right = at(Math.min(cols - 1, ix + 1), iy)
      const down = at(ix, Math.max(0, iy - 1))
      const up = at(ix, Math.min(rows - 1, iy + 1))
      const tx = right[0] - left[0]
      const ty = right[1] - left[1]
      const tz = right[2] - left[2]
      const vx = down[0] - up[0]
      const vy = down[1] - up[1]
      const vz = down[2] - up[2]
      let nx = ty * vz - tz * vy
      let ny = tz * vx - tx * vz
      let nz = tx * vy - ty * vx
      const len = Math.hypot(nx, ny, nz)
      const i = (iy * cols + ix) * 3
      if (len < 1e-8) {
        target[i] = 0
        target[i + 1] = 0
        target[i + 2] = 1
      } else {
        target[i] = nx / len
        target[i + 1] = ny / len
        target[i + 2] = nz / len
      }
    }
  }
  return target
}

export function projectShadow(x, y, z, config = stickerConfig) {
  const spread = z * config.shadowSoftness * 0.04
  return {
    x: x + z * config.shadowOffset + Math.sign(x) * spread,
    y: y - z * 0.08,
    z: -0.012,
  }
}

export function shadowInto(target, positions, progress, config, width, height) {
  const p = clamp01(progress)
  const fade = p >= 0.9995 ? 0 : 1
  for (let i = 0; i < positions.length; i += 3) {
    const point = projectShadow(positions[i], positions[i + 1], positions[i + 2] * fade, config)
    target[i] = point.x
    target[i + 1] = point.y
    target[i + 2] = point.z
  }
  return target
}

export function shadowOpacity(progress, config = stickerConfig) {
  const p = clamp01(progress)
  if (p >= 1) return config.shadowOpacity * 0.16
  const lifted = Math.pow(1 - adhesionTravel(p), 0.75)
  return config.shadowOpacity * (0.16 + 0.84 * lifted)
}

export function vertexAt(positions, cols, ix, iy) {
  const i = (iy * cols + ix) * 3
  return { x: positions[i], y: positions[i + 1], z: positions[i + 2] }
}

export function rowLength(positions, cols, iy) {
  let length = 0
  for (let ix = 1; ix < cols; ix += 1) {
    const a = vertexAt(positions, cols, ix - 1, iy)
    const b = vertexAt(positions, cols, ix, iy)
    length += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
  }
  return length
}
