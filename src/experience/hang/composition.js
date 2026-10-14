export const HANG_DESKTOP = [
  { id: 'left-outer', left: -0.06, right: 0.18, drop: 0.74, bias: 0.46, girth: 1.08, z: 1 },
  { id: 'left-inner', left: 0.04, right: 0.3, drop: 0.46, bias: 0.58, girth: 0.9, z: 4 },
  { id: 'mid-high', left: 0.16, right: 0.42, drop: 0.34, bias: 0.5, girth: 0.86, z: 6 },
  { id: 'center-long', left: 0.26, right: 0.58, drop: 0.98, bias: 0.48, girth: 1.12, z: 2 },
  { id: 'center-front', left: 0.38, right: 0.64, drop: 0.58, bias: 0.62, girth: 1, z: 7 },
  { id: 'narrow', left: 0.52, right: 0.68, drop: 0.82, bias: 0.44, girth: 0.82, z: 5 },
  { id: 'right-asym', left: 0.6, right: 0.92, drop: 0.66, bias: 0.36, girth: 1.02, z: 3 },
  { id: 'right-long', left: 0.78, right: 1.08, drop: 0.92, bias: 0.55, girth: 1.14, z: 2 },
]

export const HANG_TABLET = [
  { id: 'left-outer', left: -0.08, right: 0.28, drop: 0.7, bias: 0.48, girth: 1.05, z: 1 },
  { id: 'left-inner', left: 0.06, right: 0.42, drop: 0.42, bias: 0.55, girth: 0.9, z: 4 },
  { id: 'center-long', left: 0.22, right: 0.62, drop: 0.94, bias: 0.5, girth: 1.1, z: 2 },
  { id: 'center-front', left: 0.36, right: 0.7, drop: 0.55, bias: 0.6, girth: 0.95, z: 6 },
  { id: 'narrow', left: 0.5, right: 0.74, drop: 0.78, bias: 0.42, girth: 0.86, z: 5 },
  { id: 'right-long', left: 0.62, right: 1.1, drop: 0.88, bias: 0.4, girth: 1.08, z: 3 },
]

export const HANG_PHONE = [
  { id: 'left-outer', left: -0.12, right: 0.46, drop: 0.58, bias: 0.5, girth: 1, z: 2 },
  { id: 'center-long', left: 0.08, right: 0.78, drop: 0.9, bias: 0.46, girth: 1.08, z: 1 },
  { id: 'center-front', left: 0.28, right: 0.7, drop: 0.42, bias: 0.58, girth: 0.9, z: 5 },
  { id: 'narrow', left: 0.42, right: 0.88, drop: 0.7, bias: 0.4, girth: 0.92, z: 4 },
  { id: 'right-long', left: 0.55, right: 1.14, drop: 0.8, bias: 0.52, girth: 1.05, z: 3 },
]

export function hangSpecs(width) {
  if (width < 700) return HANG_PHONE
  if (width < 1100) return HANG_TABLET
  return HANG_DESKTOP
}

export function hangDiameter(width) {
  if (width < 700) return Math.max(28, Math.min(40, width * 0.09))
  return Math.max(34, Math.min(56, width * 0.038))
}

function curvePoint(leftX, rightX, anchorY, dropY, bias, t) {
  const x = leftX + (rightX - leftX) * t
  const sag = t <= bias ? Math.sin((t / Math.max(bias, 0.05)) * Math.PI * 0.5) : Math.sin(((1 - t) / Math.max(1 - bias, 0.05)) * Math.PI * 0.5)
  return { x, y: anchorY + (dropY - anchorY) * sag }
}

function resample(poly, spacing) {
  const points = [poly[0]]
  let remain = spacing
  for (let i = 1; i < poly.length; i += 1) {
    let sx = poly[i - 1].x
    let sy = poly[i - 1].y
    const tx = poly[i].x
    const ty = poly[i].y
    let dist = Math.hypot(tx - sx, ty - sy)
    while (dist >= remain) {
      const t = remain / dist
      sx += (tx - sx) * t
      sy += (ty - sy) * t
      points.push({ x: sx, y: sy })
      dist = Math.hypot(tx - sx, ty - sy)
      remain = spacing
    }
    remain -= dist
  }
  const last = poly[poly.length - 1]
  const end = points[points.length - 1]
  if (Math.hypot(last.x - end.x, last.y - end.y) > spacing * 0.35) points.push(last)
  else points[points.length - 1] = last
  return points
}

function makeRope(spec, width, height, baseDiameter) {
  const diameter = baseDiameter * spec.girth
  const leftX = spec.left * width
  const rightX = spec.right * width
  const anchorY = -diameter * 0.85
  const dropY = spec.drop * height
  const poly = []
  for (let i = 0; i <= 96; i += 1) poly.push(curvePoint(leftX, rightX, anchorY, dropY, spec.bias, i / 96))
  let span = 0
  for (let i = 1; i < poly.length; i += 1) span += Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y)
  const spacing = Math.min(Math.max(12, diameter * 0.46), span / 12)
  const samples = resample(poly, spacing)
  const points = samples.map((point, index) => ({
    x: point.x,
    y: point.y,
    px: point.x,
    py: point.y,
    ax: point.x,
    ay: point.y,
    fixed: index === 0 || index === samples.length - 1,
  }))
  const rest = []
  for (let i = 1; i < points.length; i += 1) {
    rest.push(Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  }
  return { id: spec.id, diameter, z: spec.z, points, rest }
}

export function createHangRopes(width, height) {
  const diameter = hangDiameter(width)
  return hangSpecs(width).map((spec) => makeRope(spec, width, height, diameter))
}

export function hangInkBounds(ropes) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const rope of ropes) {
    const pad = rope.diameter * 0.72
    const drop = rope.diameter * 0.12
    for (const point of rope.points) {
      minX = Math.min(minX, point.x - pad)
      maxX = Math.max(maxX, point.x + pad)
      minY = Math.min(minY, point.y - pad)
      maxY = Math.max(maxY, point.y + pad + drop)
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  return { minX, minY, maxX, maxY }
}

export function hangViewFit(bounds, width, height, margin = 36) {
  const bw = Math.max(1, bounds.maxX - bounds.minX)
  const bh = Math.max(1, bounds.maxY - bounds.minY)
  const innerW = Math.max(1, width - margin * 2)
  const innerH = Math.max(1, height - margin * 2)
  const scale = Math.min(1, innerW / bw, innerH / bh)
  return {
    scale,
    x: margin + (innerW - bw * scale) / 2 - bounds.minX * scale,
    y: margin + (innerH - bh * scale) / 2 - bounds.minY * scale,
  }
}

export function hangApplyFit(ropes, fit) {
  const scale = fit?.scale > 0 ? fit.scale : 1
  const ox = fit?.x || 0
  const oy = fit?.y || 0
  if (scale === 1 && ox === 0 && oy === 0) return ropes
  for (const rope of ropes) {
    for (const point of rope.points) {
      point.x = point.x * scale + ox
      point.y = point.y * scale + oy
      point.px = point.x
      point.py = point.y
      point.ax = point.ax * scale + ox
      point.ay = point.ay * scale + oy
    }
    rope.rest = rope.rest.map((span) => span * scale)
    rope.diameter *= scale
  }
  return ropes
}

export function hangLocalPoint(clientX, clientY, box, layoutWidth, layoutHeight, fit) {
  const width = box?.width > 0 ? box.width : layoutWidth
  const height = box?.height > 0 ? box.height : layoutHeight
  const sx = layoutWidth > 0 && width > 0 ? layoutWidth / width : 1
  const sy = layoutHeight > 0 && height > 0 ? layoutHeight / height : 1
  const x = (clientX - (box?.left || 0)) * sx
  const y = (clientY - (box?.top || 0)) * sy
  const scale = fit?.scale > 0 ? fit.scale : 1
  return {
    x: (x - (fit?.x || 0)) / scale,
    y: (y - (fit?.y || 0)) / scale,
  }
}
