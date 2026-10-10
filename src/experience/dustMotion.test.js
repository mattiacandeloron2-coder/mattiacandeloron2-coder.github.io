import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { driftScale } from './dustMotion.js'

describe('driftScale', () => {
  it('is full dust when idle', () => {
    assert.equal(driftScale(0), 1)
  })

  it('calms to 40% at full scroll energy', () => {
    assert.equal(driftScale(1), 0.4)
  })

  it('lerps in between', () => {
    assert.equal(driftScale(0.5), 0.7)
  })

  it('clamps energy', () => {
    assert.equal(driftScale(-1), 1)
    assert.equal(driftScale(3), 0.4)
  })

  it('stays almost still with reduced motion', () => {
    assert.equal(driftScale(0, { reducedMotion: true }), 0.08)
    assert.equal(driftScale(1, { reducedMotion: true }), 0.08)
  })
})
