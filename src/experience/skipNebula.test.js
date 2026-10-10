import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { colors } from '../config.js'
import { worksTravel } from './worksStrip.js'
import {
  NEBULA_COLORS,
  nebulaCount,
  nebulaGrainSize,
  nebulaPoint,
  nebulaScale,
  nebulaSpeed,
  skipScrollTarget,
  skipVisible,
} from './skipNebula.js'

function rgb(hex) {
  const value = hex.replace('#', '')
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
}

function saturation(hex) {
  const [r, g, b] = rgb(hex).map((channel) => channel / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === 0) return 0
  return (max - min) / max
}

describe('nebulaSpeed', () => {
  it('is lively at rest and much slower when the cursor is about to click', () => {
    assert.ok(nebulaSpeed(0) > 0.5)
    assert.ok(nebulaSpeed(0) < 0.75)
    assert.ok(nebulaSpeed(1) < nebulaSpeed(0) * 0.25)
  })
})

describe('nebulaScale', () => {
  it('grows a little under the cursor', () => {
    assert.equal(nebulaScale(0), 1)
    assert.ok(nebulaScale(1) > 1.08)
    assert.ok(nebulaScale(1) < 1.2)
  })
})

describe('nebulaPoint', () => {
  const seed = { theta: 0.6, phi: 1.15, radius: 0.82, spin: 0.55, tilt: 0.12 }

  it('turns instead of traveling in a straight line', () => {
    const p0 = nebulaPoint(seed, 0, 1)
    const p1 = nebulaPoint(seed, 0.45, 1)
    const p2 = nebulaPoint(seed, 0.9, 1)
    const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x)
    assert.ok(Math.abs(cross) > 1e-4)
  })

  it('fills a rounded mass with depth, not a flat ribbon', () => {
    const point = nebulaPoint(seed, 0, 1)
    assert.ok(Math.abs(point.z) > 0.15)
  })

  it('breaks the perfect sphere into an irregular gel blob', () => {
    const rim = (theta) => {
      const point = nebulaPoint({ theta, phi: 1.12, radius: 0.94 }, 1.6, 1)
      return Math.hypot(point.x, point.y, point.z)
    }
    const radii = [0, 0.9, 1.8, 2.7, 3.6].map(rim)
    assert.ok(Math.max(...radii) - Math.min(...radii) > 0.22)
  })

  const wander = {
    theta: 0.6,
    phi: 1.15,
    radius: 0.82,
    spin: 0.7,
    tilt: 0.18,
    wobble: 1.9,
    drift: 2.4,
    weave: 1.1,
    amp1: 0.55,
    amp2: 0.4,
    wR: 1.3,
    axisA: { x: 0.12, y: 0.96, z: 0.25 },
    axisB: { x: 0.88, y: -0.1, z: 0.46 },
  }

  it('stays one gel mass instead of flying apart', () => {
    for (const time of [0, 0.4, 1.1, 2.6]) {
      const point = nebulaPoint(wander, time, 1)
      assert.ok(Math.hypot(point.x, point.y, point.z) <= 1.28)
    }
  })

  it('lets a grain drift in and out instead of skating on a fixed ring', () => {
    const r0 = Math.hypot(...Object.values(nebulaPoint(wander, 0, 1)))
    const r1 = Math.hypot(...Object.values(nebulaPoint(wander, 0.7, 1)))
    assert.ok(Math.abs(r1 - r0) > 0.02)
  })

  it('settles and slows when the cursor is on it', () => {
    const rim = (theta, hover) => {
      const point = nebulaPoint({ theta, phi: 1.12, radius: 0.94 }, 1.6, 1, hover)
      return Math.hypot(point.x, point.y, point.z)
    }
    const spread = (hover) => {
      const radii = [0, 0.9, 1.8, 2.7, 3.6].map((theta) => rim(theta, hover))
      return Math.max(...radii) - Math.min(...radii)
    }
    assert.ok(spread(1) < spread(0) * 0.7)

    const travel = (hover) => {
      const speed = nebulaSpeed(hover)
      const a = nebulaPoint(wander, 1.1, speed, hover)
      const b = nebulaPoint(wander, 1.4, speed, hover)
      return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
    }
    assert.ok(travel(1) < travel(0) * 0.45)
  })

  it('does not skate at a clock-steady speed', () => {
    const times = [0, 0.22, 0.44, 0.66]
    const points = times.map((time) => nebulaPoint(wander, time, 1))
    const chords = [0, 1, 2].map((index) => {
      const a = points[index]
      const b = points[index + 1]
      return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
    })
    assert.ok(Math.abs(chords[0] - chords[1]) + Math.abs(chords[1] - chords[2]) > 0.012)
  })

  it('streams smoothly like nebula gas instead of buzzing in place', () => {
    const vel = (time) => {
      const a = nebulaPoint(wander, time, 1)
      const b = nebulaPoint(wander, time + 0.05, 1)
      return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }
    }
    const v0 = vel(0.4)
    const v1 = vel(0.5)
    const n0 = Math.hypot(v0.x, v0.y, v0.z) || 1
    const n1 = Math.hypot(v1.x, v1.y, v1.z) || 1
    const dot = (v0.x * v1.x + v0.y * v1.y + v0.z * v1.z) / (n0 * n1)
    assert.ok(dot > 0.7)
  })

  it('moves nearby grains together like a gas cloud, not as separate random orbits', () => {
    const base = {
      radius: 0.7,
      spin: 0.8,
      tilt: 0.35,
      wobble: 1.9,
      drift: 2.4,
      weave: 1.1,
      amp1: 0.55,
      amp2: 0.4,
      wR: 1.3,
    }
    const a = {
      ...base,
      theta: 0.6,
      phi: 1.15,
      axisA: { x: 0.12, y: 0.96, z: 0.25 },
      axisB: { x: 0.88, y: -0.1, z: 0.46 },
    }
    const b = {
      ...base,
      theta: 0.66,
      phi: 1.2,
      spin: -0.9,
      axisA: { x: -0.74, y: 0.18, z: 0.65 },
      axisB: { x: 0.08, y: 0.99, z: 0.1 },
    }
    const vel = (seed) => {
      const p0 = nebulaPoint(seed, 0.4, 1)
      const p1 = nebulaPoint(seed, 0.55, 1)
      return { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z }
    }
    const va = vel(a)
    const vb = vel(b)
    const na = Math.hypot(va.x, va.y, va.z) || 1
    const nb = Math.hypot(vb.x, vb.y, vb.z) || 1
    const dot = (va.x * vb.x + va.y * vb.y + va.z * vb.z) / (na * nb)
    assert.ok(dot > 0.6)
  })
})

describe('nebulaCount', () => {
  it('is a dense grain cloud like the figure, not a handful of glows', () => {
    assert.ok(nebulaCount(false) >= 1800)
    assert.ok(nebulaCount(false) <= 2800)
    assert.ok(nebulaCount(true) < nebulaCount(false))
    assert.ok(nebulaCount(true) >= 700)
  })
})

describe('nebulaGrainSize', () => {
  it('is a fine grain like the figure, not a fat glow', () => {
    assert.ok(nebulaGrainSize(0.5, 1) > 1.2)
    assert.ok(nebulaGrainSize(0.5, 1) < 2.4)
  })
})

describe('NEBULA_COLORS', () => {
  it('uses dusty space violets that sit on the paper grey', () => {
    const banned = [colors.green, colors.carmine, colors.greenLight, colors.greenDark].map((value) =>
      value.toLowerCase(),
    )
    assert.ok(NEBULA_COLORS.length >= 5)
    let violets = 0
    for (const color of NEBULA_COLORS) {
      assert.ok(saturation(color) < 0.28, color)
      const [r, g, b] = rgb(color)
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      assert.ok(luma > 30 && luma < 170, color)
      assert.ok(!banned.includes(color.toLowerCase()), color)
      if (b > g && r >= g * 0.92) violets += 1
    }
    assert.ok(violets >= 3)
  })
})

describe('skipScrollTarget', () => {
  it('opens the first project full screen', () => {
    const target = skipScrollTarget(900, 5800)
    assert.ok(Math.abs(worksTravel(target, 900, 5800) - 1) < 1e-10)
  })
})

describe('skipVisible', () => {
  it('is present on the figure and gone once selected works have started', () => {
    assert.equal(skipVisible(0), 1)
    assert.equal(skipVisible(0.35), 0)
    assert.equal(skipVisible(1), 0)
  })
})
