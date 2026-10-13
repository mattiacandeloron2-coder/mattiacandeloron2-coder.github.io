import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { config } from '../config.js'
import { holdStep } from './ScrollController.js'

describe('holdStep', () => {
  it('advances at a steady medium pace while the arrow is held', () => {
    const rate = config.scroll.holdRate
    const secondsForTheFigure = 1 / rate
    assert.ok(secondsForTheFigure >= 10 && secondsForTheFigure <= 16)

    let target = 0
    const frames = 60
    for (let i = 0; i < frames; i += 1) {
      target = holdStep(target, 1 / 60, rate, 2, { armed: true, locked: false })
    }
    assert.ok(target > rate * 0.85 && target < rate * 1.05)
  })

  it('does not jump when a single frame stalls', () => {
    const jumped = holdStep(0, 2, config.scroll.holdRate, 2, { armed: true, locked: false })
    assert.ok(jumped < 0.02)
  })

  it('stops at the end of the scroll', () => {
    let target = 1.96
    for (let i = 0; i < 40; i += 1) {
      target = holdStep(target, 1 / 60, config.scroll.holdRate, 2, { armed: true, locked: false })
    }
    assert.equal(target, 2)
  })

  it('stays put until the page is revealed, and while a project has the wheel', () => {
    assert.equal(holdStep(0.4, 0.5, config.scroll.holdRate, 2, { armed: false, locked: false }), 0.4)
    assert.equal(holdStep(0.4, 0.5, config.scroll.holdRate, 2, { armed: true, locked: true }), 0.4)
  })
})
