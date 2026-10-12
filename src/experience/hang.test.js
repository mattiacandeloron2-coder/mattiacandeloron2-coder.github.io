import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createHangRopes, hangSpecs } from './hang/composition.js'
import {
  hangConfig,
  measureLength,
  pickTube,
  restLength,
  restRopes,
  settleRopes,
  stepRopes,
} from './hang/physics.js'

function cloneRopes(ropes) {
  return ropes.map((rope) => ({
    ...rope,
    points: rope.points.map((point) => ({ ...point })),
    rest: [...rope.rest],
  }))
}

describe('hanging tubes', () => {
  it('uses eight tubes on a desktop, fewer on a phone', () => {
    assert.equal(hangSpecs(1440).length, 8)
    assert.equal(hangSpecs(800).length, 6)
    assert.equal(hangSpecs(390).length, 5)
  })

  it('hangs from fixed anchors above the page and keeps its length', () => {
    const ropes = settleRopes(createHangRopes(1440, 900), 80)
    assert.equal(ropes.length, 8)
    for (const rope of ropes) {
      const first = rope.points[0]
      const last = rope.points[rope.points.length - 1]
      assert.equal(first.fixed, true)
      assert.equal(last.fixed, true)
      assert.equal(first.y, first.ay)
      assert.ok(first.y < 0)
      assert.ok(last.y < 0)
      const ratio = measureLength(rope) / restLength(rope)
      assert.ok(ratio > 0.97 && ratio < 1.03, `${rope.id} length ratio ${ratio}`)
    }
    const lowest = Math.max(...ropes.flatMap((rope) => rope.points.map((point) => point.y)))
    assert.ok(lowest > 700)
  })

  it('brushes a tube only while the pointer is moving nearby', () => {
    const [rope] = settleRopes(createHangRopes(1440, 900), 40)
    const mid = rope.points[Math.floor(rope.points.length / 2)]
    const still = cloneRopes([rope])
    stepRopes(still, hangConfig.fixedDt, { ...hangConfig, gravity: 0 }, {
      pointer: { x: mid.x, y: mid.y, vx: 0, vy: 0 },
    })
    const index = Math.floor(rope.points.length / 2)
    assert.ok(Math.abs(still[0].points[index].x - mid.x) < 0.5)

    const brushed = cloneRopes([rope])
    const before = brushed[0].points[index].x
    const moved = stepRopes(brushed, hangConfig.fixedDt, { ...hangConfig, gravity: 0 }, {
      pointer: { x: mid.x, y: mid.y, vx: 900, vy: 0 },
    })
    assert.equal(moved, undefined)
    assert.ok(brushed[0].points[index].x > before)
    assert.equal(brushed[0].points[0].x, rope.points[0].ax)

    const far = cloneRopes([rope])
    stepRopes(far, hangConfig.fixedDt, { ...hangConfig, gravity: 0 }, {
      pointer: { x: mid.x + 400, y: mid.y, vx: 900, vy: 0 },
    })
    assert.ok(Math.abs(far[0].points[index].x - before) < 0.5)
  })

  it('pulls the grabbed section without moving the anchors or stretching the tube', () => {
    const [rope] = createHangRopes(1440, 900)
    const index = Math.floor(rope.points.length / 2)
    const startX = rope.points[index].x
    const startY = rope.points[index].y
    const hit = pickTube([rope], startX, startY + rope.diameter * 0.2)
    assert.equal(hit.id, rope.id)
    const miss = pickTube([rope], startX + 400, startY)
    assert.equal(miss, null)
    for (let i = 0; i < 30; i += 1) {
      stepRopes([rope], hangConfig.fixedDt, { ...hangConfig, gravity: 200 }, {
        grab: { id: rope.id, index, x: startX + 160, y: startY + 80, vx: 240, vy: 80 },
      })
    }
    assert.equal(rope.points[0].x, rope.points[0].ax)
    assert.equal(rope.points[0].y, rope.points[0].ay)
    assert.ok(rope.points[index].x > startX)
    const ratio = measureLength(rope) / restLength(rope)
    assert.ok(ratio > 0.96 && ratio < 1.07, `stretched ${ratio}`)
  })

  it('stops hopping once a tube is nearly still', () => {
    const ropes = settleRopes(createHangRopes(1440, 900), 80)
    let prev = ropes.map((rope) => rope.points.map((point) => ({ x: point.x, y: point.y })))
    let maxStep = 0
    for (let i = 0; i < 180; i += 1) {
      stepRopes(ropes, hangConfig.fixedDt, hangConfig)
      restRopes(ropes)
      ropes.forEach((rope, ropeIndex) => {
        rope.points.forEach((point, index) => {
          maxStep = Math.max(maxStep, Math.hypot(point.x - prev[ropeIndex][index].x, point.y - prev[ropeIndex][index].y))
        })
      })
      prev = ropes.map((rope) => rope.points.map((point) => ({ x: point.x, y: point.y })))
    }
    assert.ok(maxStep < 0.45, `step ${maxStep}`)
  })

  it('stops completely once the pointer has been still', () => {
    const ropes = settleRopes(createHangRopes(1440, 900), 48)
    const still = { pointer: { x: 720, y: 400, vx: 0, vy: 0 } }
    for (let i = 0; i < hangConfig.restFrames + 5; i += 1) {
      stepRopes(ropes, hangConfig.fixedDt, hangConfig, still)
      restRopes(ropes)
    }
    const mark = ropes.map((rope) => rope.points.map((point) => ({ x: point.x, y: point.y })))
    for (let i = 0; i < 180; i += 1) {
      stepRopes(ropes, hangConfig.fixedDt, hangConfig, still)
      restRopes(ropes)
    }
    ropes.forEach((rope, ropeIndex) => {
      rope.points.forEach((point, index) => {
        const drift = Math.hypot(point.x - mark[ropeIndex][index].x, point.y - mark[ropeIndex][index].y)
        assert.ok(drift < 0.05, `${rope.id} drift ${drift}`)
      })
    })
  })

  it('comes back after a short pull', () => {
    const [rope] = settleRopes(createHangRopes(1440, 900), 48)
    const index = Math.floor(rope.points.length / 2)
    const startX = rope.points[index].x
    const startY = rope.points[index].y
    for (let i = 0; i < 20; i += 1) {
      stepRopes([rope], hangConfig.fixedDt, hangConfig, {
        grab: { id: rope.id, index, x: startX + 40, y: startY + 50, vx: 0, vy: 0 },
      })
    }
    const pulledY = rope.points[index].y
    assert.ok(pulledY > startY + 15, `pulled ${pulledY} from ${startY}`)
    for (let i = 0; i < 40; i += 1) {
      stepRopes([rope], hangConfig.fixedDt, hangConfig)
      restRopes([rope])
    }
    const back = Math.abs(rope.points[index].y - startY)
    assert.ok(back < Math.abs(pulledY - startY), `still ${rope.points[index].y}, pulled ${pulledY}, start ${startY}`)
  })
})
