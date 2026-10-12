import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  TOY_COMPLETED,
  TOY_DROPPING,
  TOY_FAILED,
  TOY_PERIOD,
  TOY_REVEAL,
  TOY_PIECES,
  TOY_PLAYING,
  TOY_STACKED,
  pickRender,
  toyAfterCatch,
  toyAmplitude,
  toyCanDrop,
  toyArrival,
  toyCaught,
  toyCornerHit,
  toyCornerY,
  toyFallFrame,
  toyFrontClip,
  toyLayout,
  toyLetters,
  toyScale,
  toySpaceAction,
  toySwing,
  toyTolerance,
  waveCoverRatio,
} from './toyLogic.js'

describe('ring toy pieces', () => {
  it('stacks the six pieces from the bottom, without the blue one', () => {
    assert.deepEqual(
      TOY_PIECES.map((piece) => piece.id),
      ['triangle', 'pink', 'yellow', 'brown', 'disc', 'green'],
    )
    assert.equal(TOY_PIECES.some((piece) => piece.id === 'blue'), false)
    for (let i = 1; i < TOY_PIECES.length; i += 1) {
      assert.ok(TOY_PIECES[i].holeAt < TOY_PIECES[i - 1].holeAt)
    }
  })

  it('leaves the near lip of each stacked piece in front of the stick', () => {
    for (const piece of TOY_PIECES) {
      const clip = toyFrontClip(piece)
      const lip = 1 - clip
      assert.ok(clip > 0.7 && clip < 0.9, piece.id)
      assert.ok(lip > 0.14 && lip < 0.3, piece.id)
    }
  })
})

describe('ring toy motion', () => {
  it('travels from side to side at one steady speed', () => {
    assert.ok(Math.abs(toySwing(0, TOY_PERIOD, 100) + 100) < 0.001)
    assert.ok(Math.abs(toySwing(TOY_PERIOD / 4, TOY_PERIOD, 100)) < 0.001)
    assert.ok(Math.abs(toySwing(TOY_PERIOD / 2, TOY_PERIOD, 100) - 100) < 0.001)
    assert.ok(Math.abs(toySwing((TOY_PERIOD * 3) / 4, TOY_PERIOD, 100)) < 0.001)
    const cruise = []
    for (let t = 0; t < TOY_PERIOD; t += 40) {
      const step = Math.abs(toySwing(t + 40, TOY_PERIOD, 100) - toySwing(t, TOY_PERIOD, 100))
      if (step > 0.2) cruise.push(step)
    }
    assert.ok(cruise.length > 20)
    const min = Math.min(...cruise)
    const max = Math.max(...cruise)
    assert.ok(max - min < 0.05)
  })

  it('uses a 100px swing and a 30px catch on a 1920 desktop', () => {
    const scale = toyScale(1920, 1080)
    assert.ok(Math.abs(toyAmplitude(scale) - 100) < 0.01)
    assert.ok(Math.abs(toyTolerance(scale) - 30) < 0.01)
  })

  it('catches only when the hole meets the stick', () => {
    assert.equal(toyCaught(0, 30), true)
    assert.equal(toyCaught(30, 30), true)
    assert.equal(toyCaught(-30, 30), true)
    assert.equal(toyCaught(31, 30), false)
  })
})

describe('ring toy states', () => {
  it('drops only while a piece is waiting', () => {
    assert.equal(toyCanDrop(TOY_PLAYING), true)
    assert.equal(toyCanDrop(TOY_DROPPING), false)
    assert.equal(toyCanDrop(TOY_STACKED), false)
    assert.equal(toyCanDrop(TOY_FAILED), false)
    assert.equal(toyCanDrop(TOY_COMPLETED), false)
  })

  it('finishes on the sixth piece and waits before that', () => {
    assert.deepEqual(toyAfterCatch(0, 6), { stacked: 1, state: TOY_STACKED })
    assert.deepEqual(toyAfterCatch(4, 6), { stacked: 5, state: TOY_STACKED })
    assert.deepEqual(toyAfterCatch(5, 6), { stacked: 6, state: TOY_COMPLETED })
  })
})

describe('ring toy words', () => {
  it('colors each letter and keeps the spaces', () => {
    const letters = toyLetters('scroll to see more')
    assert.equal(letters.map((letter) => letter.char).join(''), 'scroll to see more')
    assert.equal(letters.filter((letter) => letter.char === ' ').every((letter) => letter.color == null), true)
    const colors = letters.filter((letter) => letter.color).map((letter) => letter.color)
    assert.equal(colors.length, 15)
    assert.notEqual(colors[0], colors[1])
    assert.equal(new Set(colors).size, 6)
  })
})

describe('ring toy wave', () => {
  it('covers the slide only on the last frame', () => {
    assert.ok(waveCoverRatio(0, 15) < 0.2)
    assert.ok(waveCoverRatio(7, 15) > 0.4 && waveCoverRatio(7, 15) < 0.8)
    assert.equal(waveCoverRatio(14, 15), 1)
  })

  it('picks one render from the list', () => {
    const renders = ['a', 'b', 'c', 'd']
    assert.equal(pickRender(renders, () => 0), 'a')
    assert.equal(pickRender(renders, () => 0.99), 'd')
  })
})

describe('ring toy miss', () => {
  const piece = { pieceWidth: 100, pieceHeight: 80, holeX: 50, holeY: 40 }
  const sceneBase = {
    gravity: 6800,
    stickTop: 100,
    stickHeight: 800,
    stickWidth: 96,
    tolerance: 30,
    slot: 700,
    piece,
    scale: toyScale(1920, 1080),
    period: TOY_PERIOD,
    amplitude: 100,
  }

  function run(clock, frames = 180) {
    let flight = {
      holeX: 0,
      holeY: 0,
      vx: 0,
      vy: 0,
      spin: 0,
      angle: 0,
      checked: false,
      missed: false,
      committed: false,
      willLand: false,
      hold: 0,
      kickVx: 0,
      kickVy: 0,
      kickSpin: 0,
      originX: 50,
      originY: 50,
    }
    let impact = null
    let time = clock
    for (let i = 0; i < frames; i += 1) {
      time += 16
      flight = toyFallFrame(flight, 0.016, {
        ...sceneBase,
        clock: time,
        swing: toySwing(time, sceneBase.period, sceneBase.amplitude),
      })
      if (flight.missed && !impact) impact = { ...flight }
      if (flight.landed) break
    }
    return { flight, impact }
  }

  it('restarts from the keyboard after a loss or a win', () => {
    assert.equal(toySpaceAction(TOY_PLAYING), 'drop')
    assert.equal(toySpaceAction(TOY_FAILED), 'reset')
    assert.equal(toySpaceAction(TOY_REVEAL), 'reset')
    assert.equal(toySpaceAction(TOY_DROPPING), 'idle')
    assert.equal(toySpaceAction(TOY_STACKED), 'idle')
  })

  it('puts a short piece on the near shoulder and kicks it off that side', () => {
    const right = toyCornerHit({ swing: 100, stickWidth: 96, piece, holeX: 0, scale: sceneBase.scale })
    const edge = right.holeX + piece.pieceWidth - piece.holeX
    assert.ok(edge >= right.cornerX)
    assert.ok(right.vx < 0)
    assert.ok(right.spin < 0)
    assert.equal(right.originY, 100)

    const covered = toyCornerHit({ swing: 40, stickWidth: 96, piece, holeX: 0, scale: sceneBase.scale })
    assert.equal(covered.holeX, 0)
    assert.ok(covered.vx < 0)

    const left = toyCornerHit({ swing: -100, stickWidth: 96, piece, holeX: 0, scale: sceneBase.scale })
    assert.ok(left.vx > 0)
    assert.ok(left.holeX < 0)
  })

  it('hits the cap and falls aside when the stick will not be under the hole', () => {
    let peakAt = 0
    let peak = 0
    for (let t = 0; t <= sceneBase.period; t += 16) {
      const swing = toySwing(t, sceneBase.period, sceneBase.amplitude)
      if (swing > peak) {
        peak = swing
        peakAt = t
      }
    }
    const { flight, impact } = run(peakAt)
    assert.equal(flight.missed, true)
    assert.equal(flight.landed, false)
    assert.ok(impact.holeY < 200)
    assert.ok(flight.holeY > impact.holeY)
    assert.ok(flight.holeX < impact.holeX)
    assert.ok(flight.holeX < -30)
    assert.ok(flight.angle < 0)
  })

  it('still lands on the seat when the stick arrives with the hole', () => {
    const t = toyArrival(0, 0, sceneBase.slot, sceneBase.gravity)
    const { flight } = run(sceneBase.period / 4 - t * 1000)
    assert.equal(flight.missed, false)
    assert.equal(flight.landed, true)
    assert.equal(flight.holeY, sceneBase.slot)
    assert.equal(flight.holeX, 0)
  })

  it('does not knock the piece off while the stick is still in the hole', () => {
    let found = null
    for (let t = 0; t < sceneBase.period; t += 20) {
      const { flight, impact } = run(t, 240)
      if (flight.missed && impact && impact.holeY > 400 && Math.abs(flight.holeX) > 20) {
        found = { flight, impact }
        break
      }
    }
    assert.ok(found, 'a late miss still leaves from the seat')
    assert.equal(found.flight.landed, false)
    assert.equal(found.flight.missed, true)
    assert.ok(found.impact.holeY > 400)
  })

  it('keeps the shoulder below the top of the stick', () => {
    const y = toyCornerY(100, 800)
    assert.ok(y > 100)
    assert.ok(y < 130)
  })
})

function dropOn(layout, piece, releaseClock) {
  let flight = {
    holeX: 0,
    holeY: layout.dropY,
    vx: 0,
    vy: 0,
    spin: 0,
    angle: 0,
    checked: false,
    missed: false,
    committed: false,
    willLand: false,
    hold: 0,
    kickVx: 0,
    kickVy: 0,
    kickSpin: 0,
    originX: 50,
    originY: 50,
  }
  let time = releaseClock
  let impact = null
  for (let i = 0; i < 900; i += 1) {
    time += 16
    flight = toyFallFrame(flight, 0.016, {
      gravity: layout.gravity,
      stickTop: layout.stickTop,
      stickHeight: layout.stickHeight,
      stickWidth: layout.stickWidth,
      tolerance: layout.tolerance,
      swing: toySwing(time, layout.period, layout.amplitude),
      slot: layout.stickTop + piece.rest,
      piece,
      scale: layout.scale,
      clock: time,
      period: layout.period,
      amplitude: layout.amplitude,
    })
    if ((flight.missed || flight.landed) && !impact) impact = { ...flight }
    if (flight.landed || (flight.missed && flight.hold === 0 && Math.abs(flight.holeX) > 30)) break
  }
  return { flight, impact }
}

describe('ring toy lineup', () => {
  it('catches a piece dropped while the stick looks lined up', () => {
    for (const [width, height] of [
      [384, 762],
      [1920, 1080],
    ]) {
      const layout = toyLayout(width, height)
      for (const piece of layout.pieces) {
        let checked = 0
        for (let t = 0; t < layout.period; t += 80) {
          const swing = Math.abs(toySwing(t, layout.period, layout.amplitude))
          if (swing > layout.amplitude * 0.1) continue
          checked += 1
          const { flight } = dropOn(layout, piece, t)
          assert.equal(flight.landed, true, `${width}x${height} ${piece.id} at ${t}`)
        }
        assert.ok(checked > 4, piece.id)
      }
    }
  })

  it('clips the cap when the stick is swung out to the side', () => {
    const layout = toyLayout(384, 762)
    let peak = 0
    let peakAt = 0
    for (let t = 0; t <= layout.period; t += 16) {
      const swing = toySwing(t, layout.period, layout.amplitude)
      if (swing > peak) {
        peak = swing
        peakAt = t
      }
    }
    const { flight, impact } = dropOn(layout, layout.pieces[0], peakAt)
    assert.equal(flight.landed, false)
    assert.equal(flight.missed, true)
    assert.ok(impact.holeY < layout.stickTop + layout.stickHeight * 0.2)
    assert.ok(flight.holeX < -20)
  })
})

describe('ring toy layout', () => {
  it('keeps the stick on the screen and the pieces in order', () => {
    const layout = toyLayout(1440, 900)
    assert.ok(layout.stickTop > 40)
    assert.ok(layout.stickTop + layout.stickHeight < 900)
    assert.equal(layout.pieces.length, 6)
    assert.ok(layout.pieces[0].rest > layout.pieces[1].rest)
    assert.ok(layout.dropY < layout.stickTop + layout.pieces[5].rest)
  })
})
