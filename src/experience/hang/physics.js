export const hangConfig = {
  gravity: 900,
  distanceIterations: 28,
  bendIterations: 5,
  bend: 0.35,
  damping: 0.985,
  fixedDt: 1 / 60,
  maxSubsteps: 4,
  hoverRadius: 75,
  hoverGain: 0.62,
  hoverMax: 16,
  hoverMinSpeed: 36,
  grabFollow: 0.72,
  grabReach: 4,
}

export function measureLength(rope) {
  let length = 0
  for (let i = 1; i < rope.points.length; i += 1) {
    length += Math.hypot(rope.points[i].x - rope.points[i - 1].x, rope.points[i].y - rope.points[i - 1].y)
  }
  return length
}

export function restLength(rope) {
  return rope.rest.reduce((sum, span) => sum + span, 0)
}

export function pickTube(ropes, x, y) {
  let best = null
  for (const rope of ropes) {
    const limit = rope.diameter * 0.62
    for (let index = 0; index < rope.points.length; index += 1) {
      const point = rope.points[index]
      if (point.fixed) continue
      const distance = Math.hypot(point.x - x, point.y - y)
      if (distance > limit) continue
      if (!best || distance < best.distance) best = { id: rope.id, index, distance }
    }
  }
  return best
}

export function applyBrush(ropes, pointer, config, dt, heldId = null) {
  const speed = Math.hypot(pointer.vx, pointer.vy)
  if (speed < config.hoverMinSpeed) return false
  const reach = 4
  let touched = false
  for (const rope of ropes) {
    if (rope.id === heldId) continue
    let best = -1
    let bestDistance = config.hoverRadius
    for (let index = 0; index < rope.points.length; index += 1) {
      const point = rope.points[index]
      if (point.fixed) continue
      const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y)
      if (distance < bestDistance) {
        bestDistance = distance
        best = index
      }
    }
    if (best < 0) continue
    touched = true
    const falloff = (1 - bestDistance / config.hoverRadius) ** 2
    const push = Math.min(config.hoverMax, speed * dt * config.hoverGain) * falloff
    const nx = pointer.vx / speed
    const ny = pointer.vy / speed
    for (let index = best - reach; index <= best + reach; index += 1) {
      const point = rope.points[index]
      if (!point || point.fixed) continue
      const weight = 1 - Math.abs(index - best) / (reach + 1)
      point.x += nx * push * weight
      point.y += ny * push * weight
    }
  }
  return touched
}

export function pullPoint(rope, index, targetX, targetY, vx, vy, follow, dt, reach = hangConfig.grabReach) {
  const origin = rope.points[index]
  if (!origin || origin.fixed) return
  const dx = (targetX - origin.x) * follow
  const dy = (targetY - origin.y) * follow
  for (let i = index - reach; i <= index + reach; i += 1) {
    const point = rope.points[i]
    if (!point || point.fixed) continue
    const along = 1 - Math.abs(i - index) / (reach + 1)
    point.x += dx * along
    point.y += dy * along
    point.px = point.x - vx * along * dt
    point.py = point.y - vy * along * dt
  }
}

function constrainDistance(rope) {
  const points = rope.points
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy)
    if (dist < 1e-4) continue
    const diff = (dist - rope.rest[i]) / dist
    if (!a.fixed && !b.fixed) {
      const half = diff * 0.5
      a.x += dx * half
      a.y += dy * half
      b.x -= dx * half
      b.y -= dy * half
    } else if (!a.fixed) {
      a.x += dx * diff
      a.y += dy * diff
    } else if (!b.fixed) {
      b.x -= dx * diff
      b.y -= dy * diff
    }
  }
  lockAnchors(rope)
}

function constrainBend(rope, amount) {
  const points = rope.points
  for (let i = 1; i < points.length - 1; i += 1) {
    const point = points[i]
    if (point.fixed) continue
    const prev = points[i - 1]
    const next = points[i + 1]
    const ax = point.x - prev.x
    const ay = point.y - prev.y
    const bx = next.x - point.x
    const by = next.y - point.y
    const al = Math.hypot(ax, ay) || 1
    const bl = Math.hypot(bx, by) || 1
    const cos = (ax * bx + ay * by) / (al * bl)
    if (cos > 0.45) continue
    point.x += ((prev.x + next.x) * 0.5 - point.x) * amount
    point.y += ((prev.y + next.y) * 0.5 - point.y) * amount
  }
}

function lockAnchors(rope) {
  for (const point of rope.points) {
    if (!point.fixed) continue
    point.x = point.ax
    point.y = point.ay
    point.px = point.ax
    point.py = point.ay
  }
}

function enforce(ropes, config, distanceIterations, bendIterations) {
  const rounds = Math.max(distanceIterations, bendIterations)
  for (let n = 0; n < rounds; n += 1) {
    if (n < distanceIterations) {
      for (const rope of ropes) constrainDistance(rope)
    }
    if (n < bendIterations) {
      for (const rope of ropes) constrainBend(rope, config.bend)
    }
  }
  for (let n = 0; n < 8; n += 1) {
    for (const rope of ropes) constrainDistance(rope)
  }
  for (const rope of ropes) lockAnchors(rope)
}

export function stepRopes(ropes, dt, config = hangConfig, input = {}) {
  const gravity = config.gravity * dt * dt
  for (const rope of ropes) {
    for (const point of rope.points) {
      if (point.fixed) continue
      const vx = (point.x - point.px) * config.damping
      const vy = (point.y - point.py) * config.damping
      point.px = point.x
      point.py = point.y
      point.x += vx
      point.y += vy + gravity
    }
  }
  if (input.pointer) applyBrush(ropes, input.pointer, config, dt, input.grab?.id ?? null)
  const grabbed = input.grab ? ropes.find((rope) => rope.id === input.grab.id) : null
  if (grabbed) {
    pullPoint(
      grabbed,
      input.grab.index,
      input.grab.x,
      input.grab.y,
      input.grab.vx,
      input.grab.vy,
      config.grabFollow,
      dt,
      config.grabReach,
    )
  }
  enforce(ropes, config, config.distanceIterations, config.bendIterations)
}

export function settleRopes(ropes, frames = 140, config = hangConfig) {
  for (let i = 0; i < frames; i += 1) stepRopes(ropes, config.fixedDt, config)
  for (const rope of ropes) {
    for (const point of rope.points) {
      point.px = point.x
      point.py = point.y
    }
  }
  return ropes
}
