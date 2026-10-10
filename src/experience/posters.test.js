import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cardShift, posterStack } from './posters.js'

describe('posterStack', () => {
  const rest = ['tonno', 'petrolio', 'ambra']

  it('keeps the resting order until a poster is opened', () => {
    assert.deepEqual(posterStack(rest, null), rest)
    assert.deepEqual(posterStack(rest, 'missing'), rest)
  })

  it('lays the opened poster back on top of the other two', () => {
    assert.deepEqual(posterStack(rest, 'tonno'), ['petrolio', 'ambra', 'tonno'])
    const afterTonno = posterStack(rest, 'tonno')
    assert.deepEqual(posterStack(afterTonno, 'petrolio'), ['ambra', 'tonno', 'petrolio'])
  })
})

describe('cardShift', () => {
  it('lifts a card a little when the pointer is at its center', () => {
    assert.deepEqual(cardShift(0, 0, 100, 200), { x: 0, y: -8, rot: 0 })
  })

  it('leans toward the pointer and stops at the edge', () => {
    const right = cardShift(100, 0, 100, 200)
    assert.equal(right.x, 14)
    assert.equal(right.rot, 3.5)
    assert.deepEqual(cardShift(400, -400, 100, 200).x, 14)
    assert.equal(cardShift(0, 0, 0, 0).x, 0)
  })
})
