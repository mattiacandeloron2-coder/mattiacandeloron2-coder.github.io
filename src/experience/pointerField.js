export const STILL_SPEED = 12
export const GUST_SPEED_SOFT = 140
export const GUST_SPEED_FULL = 420
export const GUST_SOFT_PEAK = 0.08
export const TRAIL_MAX = 16
export const SPEED_WINDOW_MS = 80

export function framePointerSpeed({ lastX, lastY, x, y, dt } = {}) {
  if (lastX == null || lastY == null || !Number.isFinite(x) || !Number.isFinite(y)) return 0
  const span = Math.max(Number(dt) || 0, 1 / 240)
  return Math.hypot(x - lastX, y - lastY) / span
}

export function rollingSpeed(marks, now, windowMs = SPEED_WINDOW_MS) {
  if (!marks?.length) return 0
  const cutoff = Number(now) - Math.max(Number(windowMs) || 0, 1)
  let start = 0
  while (start < marks.length && marks[start].t < cutoff) start += 1
  if (start > 0) start -= 1
  const pts = marks.slice(start)
  if (pts.length < 2) return 0
  let dist = 0
  for (let i = 1; i < pts.length; i += 1) {
    dist += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  }
  const span = Math.max((pts[pts.length - 1].t - pts[0].t) / 1000, 1 / 120)
  return dist / span
}

export function pointerEventPoints(event) {
  if (!event) return []
  let list = []
  try {
    if (typeof event.getCoalescedEvents === 'function') {
      list = event.getCoalescedEvents()
    }
  } catch {
    list = []
  }
  if (!list?.length) list = [event]
  return list.map((entry) => ({ x: entry.clientX, y: entry.clientY }))
}

export function resamplePath(points, max = TRAIL_MAX) {
  if (!points?.length) return []
  if (points.length <= max) return points.slice()

  const dist = [0]
  for (let i = 1; i < points.length; i += 1) {
    dist.push(
      dist[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y),
    )
  }
  const total = dist[dist.length - 1]
  if (total < 1e-6) return points.slice(0, max)

  const out = []
  let j = 0
  for (let i = 0; i < max; i += 1) {
    const target = (i / (max - 1)) * total
    while (j < dist.length - 2 && dist[j + 1] < target) j += 1
    const span = dist[j + 1] - dist[j]
    const f = span < 1e-9 ? 0 : (target - dist[j]) / span
    const a = points[j]
    const b = points[j + 1]
    out.push({
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      ...(a.t != null && b.t != null ? { t: a.t + (b.t - a.t) * f } : null),
    })
  }
  return out
}

export function classifyMouse({
  overFigure,
  speed,
  stillSpeed = STILL_SPEED,
  prev = 'none',
  exitSpeed,
} = {}) {
  if (!overFigure) return 'none'
  const leave = exitSpeed ?? stillSpeed * 0.65
  if (prev === 'taglio' && Number(speed) > leave) return 'taglio'
  return Number(speed) <= stillSpeed ? 'soffio' : 'taglio'
}

export function touchModeFromMove({ moved, stillElapsed, moveThreshold = 14, stillMs = 180 } = {}) {
  if (Number(moved) >= moveThreshold) return 'scroll'
  if (Number(stillElapsed) >= stillMs) return 'still'
  return 'pending'
}

export function classifyTouch({ overFigure, mode, speed, stillSpeed = STILL_SPEED, prev = 'none' } = {}) {
  if (mode === 'none' || mode === 'pending') return 'none'
  return classifyMouse({ overFigure, speed, stillSpeed, prev })
}

export function decayEnvelope(age, seconds = 2) {
  const span = Math.max(Number(seconds) || 0, 0.0001)
  const t = Math.max(0, Number(age) || 0)
  return Math.max(0, 1 - t / span)
}

function easeInOutCubic(u) {
  const x = Math.min(1, Math.max(0, u))
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

export function spaceEnvelope(age, { coast = 0.5, returnSeconds = 3.2, peak = 1.4 } = {}) {
  const t = Math.max(0, Number(age) || 0)
  const c = Math.max(0, Number(coast) || 0)
  const r = Math.max(Number(returnSeconds) || 0, 0.0001)
  const p = Math.max(Number(peak) || 1, 1)
  if (t <= c) {
    const u = c === 0 ? 1 : t / c
    return 1 + (p - 1) * u
  }
  const u = Math.min(1, (t - c) / r)
  return Math.max(0, p * (1 - easeInOutCubic(u)))
}

export function appendStrokePoints(stroke, points, now, minDist = 0.5) {
  const next = Array.isArray(stroke) ? stroke.slice() : []
  if (!points?.length) return next
  for (const pt of points) {
    if (!Number.isFinite(pt?.x) || !Number.isFinite(pt?.y)) continue
    const prev = next[next.length - 1]
    if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) < minDist) continue
    next.push({ x: pt.x, y: pt.y, t: now })
  }
  return next
}

export function liveStroke(stroke, now, envelope) {
  if (!stroke?.length) return []
  const last = stroke[stroke.length - 1]
  if (spaceEnvelope((now - last.t) / 1000, envelope) <= 0.02) return []
  return stroke.slice()
}

export const STROKE_GAP_MS = 150
export const CUT_LOCK = 0.12
export const CUT_TRAVEL_MIN = 52
export const CUT_TRAVEL_FULL = 140
export const PASS_STRAIGHT_MIN = 0.52
export const PASS_STRAIGHT_FULL = 0.85

export function pathTravel(points) {
  if (!points?.length || points.length < 2) return 0
  let dist = 0
  for (let i = 1; i < points.length; i += 1) {
    dist += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return dist
}

export function pathNet(points) {
  if (!points?.length || points.length < 2) return 0
  const a = points[0]
  const b = points[points.length - 1]
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function pathTail(points, maxDist = CUT_TRAVEL_FULL) {
  if (!points?.length) return []
  if (points.length === 1) return points.slice()
  const cap = Math.max(Number(maxDist) || 0, 1)
  let dist = 0
  let i = points.length - 1
  while (i > 0) {
    const step = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    if (dist > 0 && dist + step > cap) break
    dist += step
    i -= 1
    if (dist >= cap) break
  }
  return points.slice(i)
}

export function passScaleFromShape(
  points,
  min = PASS_STRAIGHT_MIN,
  full = PASS_STRAIGHT_FULL,
) {
  const travel = pathTravel(points)
  if (travel <= 0) return 0
  const straight = pathNet(points) / travel
  const a = Math.max(0, Math.min(1, Number(min) || 0))
  const b = Math.max(a + 0.0001, Math.min(1, Number(full) || a + 0.0001))
  if (straight <= a) return 0
  if (straight >= b) return 1
  const u = (straight - a) / (b - a)
  return u * u * (3 - 2 * u)
}

export function blowScale({ speed, points } = {}) {
  const tail = pathTail(points)
  return (
    cutScaleFromTravel(pathTravel(tail)) *
    gustScaleFromSpeed(speed) *
    Math.min(passScaleFromShape(points), passScaleFromShape(tail))
  )
}

export function cutScaleFromTravel(travel, min = CUT_TRAVEL_MIN, full = CUT_TRAVEL_FULL) {
  const d = Math.max(0, Number(travel) || 0)
  const a = Math.max(0, Number(min) || 0)
  const b = Math.max(a + 0.0001, Number(full) || a + 1)
  if (d <= a) return 0
  if (d >= b) return 1
  const u = (d - a) / (b - a)
  return u * u * (3 - 2 * u)
}

export function gustScaleFromSpeed(
  speed,
  min = STILL_SPEED,
  soft = GUST_SPEED_SOFT,
  full = GUST_SPEED_FULL,
  softPeak = GUST_SOFT_PEAK,
) {
  const s = Math.max(0, Number(speed) || 0)
  const a = Math.max(0, Number(min) || 0)
  const b = Math.max(a + 0.0001, Number(soft) || a + 1)
  const c = Math.max(b + 0.0001, Number(full) || b + 1)
  const peak = Math.min(1, Math.max(0, Number(softPeak) || 0.3))
  if (s <= a) return 0
  if (s >= c) return 1
  if (s <= b) {
    const u = (s - a) / (b - a)
    return peak * Math.sqrt(u)
  }
  const u = (s - b) / (c - b)
  return peak + (1 - peak) * u * u * (3 - 2 * u)
}

export function strongestWound(influences) {
  let best = 0
  for (const value of influences ?? []) {
    const n = Number(value)
    if (Number.isFinite(n) && n > best) best = n
  }
  return best
}

export function liquidWave(across, blade) {
  const w = Math.max(Number(blade) || 0, 0.001)
  const u = Number(across) / w
  return Math.exp(-2.0 * u * u)
}

export function liquidPush(across, blade) {
  const w = Math.max(Number(blade) || 0, 0.001)
  const u = Number(across) / w
  return Math.tanh(u) * Math.exp(-0.5 * u * u)
}

export function isSameSlash(stroke, chain, now, gapMs = STROKE_GAP_MS) {
  const last = stroke?.[stroke.length - 1]
  if (!last || !chain?.length) return false
  return now - last.t <= gapMs
}

export function strokeHasCut(stroke) {
  const tail = pathTail(stroke)
  return (
    cutScaleFromTravel(pathTravel(tail)) *
      Math.min(passScaleFromShape(stroke), passScaleFromShape(tail)) >
    0.02
  )
}

export function strokeStillFlying(stroke, now, envelope, lock = CUT_LOCK) {
  if (!strokeHasCut(stroke)) return false
  if (!stroke?.length) return false
  const last = stroke[stroke.length - 1]
  return spaceEnvelope((now - last.t) / 1000, envelope) > lock
}

export function applyStroke({
  stroke = [],
  gesture,
  chain,
  now,
  envelope,
  gapMs = STROKE_GAP_MS,
} = {}) {
  const living = liveStroke(stroke, now, envelope)
  const active = strokeHasCut(living) ? living : []
  if (gesture !== 'taglio' || !chain?.length) {
    return { points: active, action: active.length ? 'idle' : 'none' }
  }
  if (isSameSlash(living, chain, now, gapMs)) {
    return {
      points: liveStroke(appendStrokePoints(living, chain, now), now, envelope),
      action: living.length ? 'extend' : 'start',
    }
  }
  if (strokeStillFlying(living, now, envelope)) {
    return { points: living, action: 'lock' }
  }
  return {
    points: liveStroke(appendStrokePoints([], chain, now), now, envelope),
    action: 'start',
  }
}
