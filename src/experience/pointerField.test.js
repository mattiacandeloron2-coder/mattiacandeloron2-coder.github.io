import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  appendStrokePoints,
  applyStroke,
  classifyMouse,
  classifyTouch,
  decayEnvelope,
  framePointerSpeed,
  isSameSlash,
  liveStroke,
  pointerEventPoints,
  resamplePath,
  rollingSpeed,
  spaceEnvelope,
  strongestWound,
  touchModeFromMove,
  blowScale,
  cutScaleFromTravel,
  gustScaleFromSpeed,
  pathNet,
  pathTail,
  pathTravel,
  passScaleFromShape,
  liquidPush,
  liquidWave,
} from './pointerField.js'

function circlePoints(n = 24, radius = 40, cx = 400, cy = 300) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }
  })
}

describe('classifyMouse', () => {
  it('does nothing off the figura', () => {
    assert.equal(classifyMouse({ overFigure: false, speed: 10 }), 'none')
    assert.equal(classifyMouse({ overFigure: false, speed: 800 }), 'none')
  })

  it('is soffio when the cursor rests on the figura', () => {
    assert.equal(classifyMouse({ overFigure: true, speed: 8 }), 'soffio')
  })

  it('is taglio when the cursor passes over the figura', () => {
    assert.equal(classifyMouse({ overFigure: true, speed: 420 }), 'taglio')
  })

  it('is taglio on a real 1px-per-frame mouse pass', () => {
    assert.equal(classifyMouse({ overFigure: true, speed: 62 }), 'taglio')
  })

  it('stays soffio on a parked cursor', () => {
    assert.equal(classifyMouse({ overFigure: true, speed: 6 }), 'soffio')
  })

  it('is taglio on a slow pass, not only a flick', () => {
    assert.equal(classifyMouse({ overFigure: true, speed: 24 }), 'taglio')
  })

  it('does not drop a cut when speed dips a little during the pass', () => {
    assert.equal(
      classifyMouse({ overFigure: true, speed: 40, prev: 'taglio' }),
      'taglio',
    )
  })
})

describe('touchModeFromMove', () => {
  it('stays pending through a short still contact', () => {
    assert.equal(touchModeFromMove({ moved: 3, stillElapsed: 40 }), 'pending')
  })

  it('becomes still after a beat without travel', () => {
    assert.equal(touchModeFromMove({ moved: 4, stillElapsed: 200 }), 'still')
  })

  it('becomes scroll as soon as the finger travels', () => {
    assert.equal(touchModeFromMove({ moved: 20, stillElapsed: 30 }), 'scroll')
  })
})

describe('classifyTouch', () => {
  it('is soffio when the finger rests on the figura', () => {
    assert.equal(classifyTouch({ overFigure: true, mode: 'still', speed: 6 }), 'soffio')
    assert.equal(classifyTouch({ overFigure: true, mode: 'pending', speed: 6 }), 'none')
    assert.equal(classifyTouch({ overFigure: false, mode: 'still', speed: 6 }), 'none')
  })

  it('is taglio when the finger passes quickly over the figura', () => {
    assert.equal(classifyTouch({ overFigure: true, mode: 'scroll', speed: 480 }), 'taglio')
  })
})

describe('decayEnvelope', () => {
  it('is full at the start and empty after the return window', () => {
    assert.equal(decayEnvelope(0, 2), 1)
    assert.equal(decayEnvelope(1, 2), 0.5)
    assert.equal(decayEnvelope(2, 2), 0)
    assert.equal(decayEnvelope(4, 2), 0)
  })

  it('never goes below zero', () => {
    assert.ok(decayEnvelope(-1, 2) <= 1)
    assert.ok(decayEnvelope(0.2, 2) > 0.8)
  })
})

describe('spaceEnvelope', () => {
  it('keeps going outward during the coast, then is empty after the magnet', () => {
    const opts = { coast: 0.5, returnSeconds: 3, peak: 1.4 }
    assert.equal(spaceEnvelope(0, opts), 1)
    assert.ok(spaceEnvelope(0.5, opts) > 1.35)
    assert.ok(spaceEnvelope(0.5, opts) <= 1.4)
    assert.ok(spaceEnvelope(3.5, opts) < 0.02)
  })

  it('never crosses below casa and eases into the pose', () => {
    const opts = { coast: 0.4, returnSeconds: 2, peak: 1.3 }
    assert.ok(spaceEnvelope(-1, opts) >= 0)
    assert.ok(spaceEnvelope(0.4, opts) >= spaceEnvelope(0.8, opts))
    assert.ok(spaceEnvelope(1.2, opts) >= spaceEnvelope(2.0, opts))
    const late = spaceEnvelope(2.2, opts)
    const later = spaceEnvelope(2.35, opts)
    assert.ok(late >= later)
    assert.ok(later >= 0)
  })
})

describe('framePointerSpeed', () => {
  it('reads a 1px-step burst by how far the pointer traveled this frame', () => {
    const speed = framePointerSpeed({ lastX: 640, lastY: 400, x: 720, y: 400, dt: 0.016 })
    assert.equal(Math.round(speed), 5000)
    assert.equal(classifyMouse({ overFigure: true, speed }), 'taglio')
  })

  it('is slow when the pointer barely moved this frame', () => {
    const speed = framePointerSpeed({ lastX: 640, lastY: 400, x: 641, y: 400, dt: 0.016 })
    assert.ok(speed < 80)
    assert.ok(speed > 50)
  })
})

describe('rollingSpeed', () => {
  it('is taglio for a 1px-per-frame pass like a real mouse', () => {
    const marks = Array.from({ length: 16 }, (_, i) => ({
      x: 600 + i,
      y: 400,
      t: 1000 + i * 16,
    }))
    const speed = rollingSpeed(marks, 1000 + 15 * 16, 80)
    assert.ok(speed > 50)
    assert.ok(speed < 80)
    assert.equal(classifyMouse({ overFigure: true, speed }), 'taglio')
  })

  it('does not blow sand for a one-pixel twitch', () => {
    const marks = [
      { x: 600, y: 400, t: 1000 },
      { x: 601, y: 400, t: 1040 },
    ]
    const speed = rollingSpeed(marks, 1080, 80)
    assert.ok(speed < 40)
    assert.equal(cutScaleFromTravel(pathTravel(marks)), 0)
  })
})

describe('pointerEventPoints', () => {
  it('uses coalesced points when the browser provides them', () => {
    const event = {
      clientX: 120,
      clientY: 40,
      getCoalescedEvents() {
        return [
          { clientX: 100, clientY: 40 },
          { clientX: 110, clientY: 40 },
          { clientX: 120, clientY: 40 },
        ]
      },
    }
    assert.deepEqual(pointerEventPoints(event), [
      { x: 100, y: 40 },
      { x: 110, y: 40 },
      { x: 120, y: 40 },
    ])
  })

  it('falls back to the event position', () => {
    assert.deepEqual(pointerEventPoints({ clientX: 8, clientY: 3 }), [{ x: 8, y: 3 }])
  })
})

describe('resamplePath', () => {
  it('keeps a short path intact', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 4 },
    ]
    assert.deepEqual(resamplePath(points, 16), points)
  })

  it('covers the whole slash when many 1px steps land in one frame', () => {
    const points = Array.from({ length: 81 }, (_, i) => ({ x: 580 + i, y: 340 }))
    const sampled = resamplePath(points, 16)
    assert.equal(sampled.length, 16)
    assert.equal(sampled[0].x, 580)
    assert.equal(sampled[sampled.length - 1].x, 660)
  })

  it('still covers the middle when early 1px steps were dropped from the path', () => {
    const start = { x: 580, y: 340 }
    const tail = Array.from({ length: 64 }, (_, i) => ({ x: 1160 + i, y: 340 }))
    const sampled = resamplePath([start, ...tail], 16)
    assert.equal(sampled[0].x, 580)
    assert.equal(sampled[sampled.length - 1].x, 1223)
    assert.equal(
      sampled.filter((pt) => pt.x > 800 && pt.x < 1000).length > 0,
      true,
    )
  })
})

describe('appendStrokePoints', () => {
  it('keeps the whole pass, not only the last nick', () => {
    const first = appendStrokePoints([], [{ x: 10, y: 20 }], 1000)
    const next = appendStrokePoints(first, [{ x: 80, y: 20 }], 1080)
    assert.equal(next.length, 2)
    assert.equal(next[0].x, 10)
    assert.equal(next[1].x, 80)
    assert.equal(next[1].t, 1080)
  })

  it('ignores jitter smaller than half a pixel', () => {
    const stroke = appendStrokePoints([{ x: 10, y: 20, t: 1000 }], [{ x: 10.2, y: 20 }], 1016)
    assert.equal(stroke.length, 1)
  })
})

describe('liveStroke', () => {
  it('drops points after the magnet has finished', () => {
    const envelope = { coast: 0.5, returnSeconds: 3, peak: 1.4 }
    const stroke = [
      { x: 0, y: 0, t: 0 },
      { x: 40, y: 0, t: 400 },
    ]
    const living = liveStroke(stroke, 4000, envelope)
    assert.equal(living.length, 0)
  })

  it('keeps a fresh cut while it is still flying', () => {
    const envelope = { coast: 0.5, returnSeconds: 3, peak: 1.4 }
    const living = liveStroke([{ x: 0, y: 0, t: 1000 }], 1200, envelope)
    assert.equal(living.length, 1)
  })

  it('does not drop the start of a long pass while the mouse is still cutting', () => {
    const envelope = { coast: 0.5, returnSeconds: 3, peak: 1.4 }
    const stroke = [
      { x: 0, y: 0, t: 0 },
      { x: 80, y: 0, t: 4000 },
    ]
    const living = liveStroke(stroke, 4100, envelope)
    assert.equal(living.length, 2)
  })
})

describe('isSameSlash', () => {
  it('treats the next 1px frame as the same pass', () => {
    const stroke = [{ x: 100, y: 40, t: 1000 }]
    assert.equal(isSameSlash(stroke, [{ x: 101, y: 40 }], 1016), true)
  })

  it('is a new slash when the pointer jumps elsewhere after a pause', () => {
    const stroke = [{ x: 100, y: 40, t: 1000 }]
    assert.equal(isSameSlash(stroke, [{ x: 420, y: 280 }], 1400), false)
  })

  it('does not glue a later pass just because the chain still starts at the last pixel', () => {
    const stroke = [{ x: 640, y: 450, t: 1000 }]
    const chain = [
      { x: 640, y: 450 },
      { x: 300, y: 320 },
    ]
    assert.equal(isSameSlash(stroke, chain, 1400), false)
  })
})

describe('applyStroke', () => {
  const envelope = { coast: 0.5, returnSeconds: 3, peak: 1.4 }

  it('extends one continuous mouse pass', () => {
    const first = applyStroke({
      stroke: [],
      gesture: 'taglio',
      chain: [{ x: 10, y: 20 }],
      now: 1000,
      envelope,
    })
    const next = applyStroke({
      stroke: first.points,
      gesture: 'taglio',
      chain: [{ x: 40, y: 20 }],
      now: 1016,
      envelope,
    })
    assert.equal(next.action, 'extend')
    assert.equal(next.points.length, 2)
    assert.equal(next.points[0].x, 10)
    assert.equal(next.points[1].x, 40)
  })

  it('does not start a second slash while dust is still flying', () => {
    const first = applyStroke({
      stroke: [],
      gesture: 'taglio',
      chain: [{ x: 10, y: 20 }, { x: 80, y: 20 }],
      now: 1000,
      envelope,
    })
    const later = applyStroke({
      stroke: first.points,
      gesture: 'taglio',
      chain: [{ x: 400, y: 260 }],
      now: 1600,
      envelope,
    })
    assert.equal(later.action, 'lock')
    assert.equal(later.points.length, first.points.length)
    assert.equal(later.points.some((pt) => pt.x === 400), false)
  })

  it('allows a new slash after the magnet has finished', () => {
    const first = applyStroke({
      stroke: [],
      gesture: 'taglio',
      chain: [{ x: 10, y: 20 }],
      now: 1000,
      envelope,
    })
    const next = applyStroke({
      stroke: first.points,
      gesture: 'taglio',
      chain: [{ x: 400, y: 260 }],
      now: 5000,
      envelope,
    })
    assert.equal(next.action, 'start')
    assert.equal(next.points.length, 1)
    assert.equal(next.points[0].x, 400)
  })

  it('does not lock a real pass after a tiny twitch', () => {
    const twitch = applyStroke({
      stroke: [],
      gesture: 'taglio',
      chain: [
        { x: 10, y: 20 },
        { x: 16, y: 20 },
      ],
      now: 1000,
      envelope,
    })
    const later = applyStroke({
      stroke: twitch.points,
      gesture: 'taglio',
      chain: [
        { x: 400, y: 260 },
        { x: 480, y: 260 },
      ],
      now: 1600,
      envelope,
    })
    assert.equal(later.action, 'start')
    assert.ok(later.points.some((pt) => pt.x === 400))
  })

  it('does not lock a real pass after circling the chest', () => {
    const loop = applyStroke({
      stroke: [],
      gesture: 'taglio',
      chain: circlePoints(),
      now: 1000,
      envelope,
    })
    const later = applyStroke({
      stroke: loop.points,
      gesture: 'taglio',
      chain: [
        { x: 120, y: 80 },
        { x: 280, y: 80 },
      ],
      now: 1600,
      envelope,
    })
    assert.equal(later.action, 'start')
    assert.ok(later.points.some((pt) => pt.x === 120))
  })
})

describe('pathTravel', () => {
  it('is zero for a single point', () => {
    assert.equal(pathTravel([{ x: 10, y: 20 }]), 0)
  })

  it('adds the whole mouse path', () => {
    assert.equal(pathTravel([{ x: 0, y: 0 }, { x: 30, y: 40 }]), 50)
  })
})

describe('gustScaleFromSpeed', () => {
  it('is zero when the pointer is parked', () => {
    assert.equal(gustScaleFromSpeed(0), 0)
    assert.equal(gustScaleFromSpeed(8), 0)
  })

  it('is a light blow on a slow pass', () => {
    const slow = gustScaleFromSpeed(28)
    assert.ok(slow > 0)
    assert.ok(slow < 0.08)
  })

  it('does not jump to a full blow at 1px per frame', () => {
    const frame = gustScaleFromSpeed(62)
    assert.ok(frame > gustScaleFromSpeed(28))
    assert.ok(frame < 0.12)
  })

  it('is full only on a fast pass', () => {
    assert.ok(gustScaleFromSpeed(200) > gustScaleFromSpeed(62))
    assert.ok(gustScaleFromSpeed(200) < 0.55)
    assert.equal(gustScaleFromSpeed(420), 1)
    assert.equal(gustScaleFromSpeed(800), 1)
  })
})

describe('cutScaleFromTravel', () => {
  it('is zero for a short twitch so unrelated dust does not jump', () => {
    assert.equal(cutScaleFromTravel(4), 0)
    assert.equal(cutScaleFromTravel(10), 0)
    assert.equal(cutScaleFromTravel(40), 0)
  })

  it('is full for a real pass across the figura', () => {
    assert.equal(cutScaleFromTravel(160), 1)
    assert.equal(cutScaleFromTravel(240), 1)
  })

  it('grows after the twitch, before a full slash', () => {
    const mid = cutScaleFromTravel(90)
    assert.ok(mid > 0)
    assert.ok(mid < 1)
  })
})

describe('pathNet', () => {
  it('is the start-to-end distance, not the scribbled length', () => {
    assert.equal(pathNet([{ x: 0, y: 0 }, { x: 30, y: 40 }]), 50)
    assert.ok(pathNet(circlePoints()) < 20)
  })
})

describe('pathTail', () => {
  it('keeps only the recent stretch of a long pass', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 320, y: 0 },
    ]
    const tail = pathTail(points, 140)
    assert.equal(tail[tail.length - 1].x, 320)
    assert.ok(pathTravel(tail) <= 141)
    assert.ok(pathTravel(tail) >= 120)
  })
})

describe('passScaleFromShape', () => {
  it('is full for a straight pass across the figura', () => {
    assert.ok(passScaleFromShape([{ x: 0, y: 0 }, { x: 180, y: 0 }]) > 0.95)
  })

  it('is zero when circling in place', () => {
    assert.equal(passScaleFromShape(circlePoints()), 0)
  })
})

describe('blowScale', () => {
  it('does not lift grains on a fidget', () => {
    const fidget = [
      { x: 400, y: 300 },
      { x: 412, y: 304 },
      { x: 418, y: 301 },
    ]
    assert.equal(blowScale({ speed: 40, points: fidget }), 0)
  })

  it('is barely there on a slow straight pass', () => {
    const pass = [
      { x: 200, y: 240 },
      { x: 360, y: 240 },
    ]
    const scale = blowScale({ speed: 28, points: pass })
    assert.ok(scale > 0)
    assert.ok(scale < 0.08)
  })

  it('does not cut in every direction when circling the chest', () => {
    assert.equal(blowScale({ speed: 220, points: circlePoints() }), 0)
  })

  it('is strong only on a fast straight pass', () => {
    const pass = [
      { x: 120, y: 200 },
      { x: 320, y: 200 },
    ]
    assert.ok(blowScale({ speed: 420, points: pass }) > 0.95)
  })
})

describe('strongestWound', () => {
  it('keeps one blade, not the sum of overlapping samples', () => {
    assert.equal(strongestWound([0.2, 0.8, 0.5, 0.8]), 0.8)
    assert.ok(strongestWound([0.2, 0.8, 0.5]) < 0.2 + 0.8 + 0.5)
  })
})

describe('liquidWave', () => {
  it('is strongest on the path and softer to the sides', () => {
    assert.ok(liquidWave(0, 0.04) > 0.95)
    assert.ok(liquidWave(0.04, 0.04) < liquidWave(0, 0.04))
    assert.ok(liquidWave(0.04, 0.04) > liquidWave(0.12, 0.04))
  })

  it('leaves grains far from the path almost still', () => {
    assert.ok(liquidWave(0.1, 0.028) < 0.02)
  })
})

describe('liquidPush', () => {
  it('parts like a wave, not a knife: zero on the path, opposite sides, quiet far away', () => {
    assert.equal(liquidPush(0, 0.04), 0)
    assert.ok(liquidPush(0.03, 0.04) > 0)
    assert.ok(liquidPush(-0.03, 0.04) < 0)
    assert.ok(Math.abs(liquidPush(0.2, 0.04)) < 0.05)
  })
})
