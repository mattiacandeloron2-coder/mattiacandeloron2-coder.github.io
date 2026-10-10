export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function damp(current, target, lambda, delta) {
  return lerp(current, target, 1 - Math.exp(-lambda * delta))
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * 1 when a label sits beside the figure, 0 when it would cover it
 * (in front or behind) along the camera view.
 */
export function labelOcclusionOpacity(cam, look, label, figureRadius = 0.4) {
  const ax = cam[0] - look[0]
  const ay = cam[1] - look[1]
  const az = cam[2] - look[2]
  const camLen = Math.hypot(ax, ay, az) || 1
  const ux = ax / camLen
  const uy = ay / camLen
  const uz = az / camLen
  const lx = label[0] - look[0]
  const ly = label[1] - look[1]
  const lz = label[2] - look[2]
  const along = lx * ux + ly * uy + lz * uz
  const perp = Math.hypot(lx - ux * along, ly - uy * along, lz - uz * along)
  return smoothstep(figureRadius * 0.72, figureRadius * 1.55, perp)
}

export function sectionOpacity(progress, appear, focus, disappear) {
  if (progress <= appear || progress >= disappear) return 0
  if (progress < focus) return smoothstep(appear, lerp(appear, focus, 0.55), progress)
  return 1 - smoothstep(lerp(focus, disappear, 0.45), disappear, progress)
}

export function introOpacity(progress, { peak, end }) {
  if (progress <= peak) return 1
  if (progress >= end) return 0
  return 1 - smoothstep(peak, end, progress)
}

export function outroOpacity(progress, { start, peak }) {
  if (progress <= start) return 0
  if (progress >= peak) return 1
  return smoothstep(start, peak, progress)
}
