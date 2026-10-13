import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bootInk, bootPercent } from './bootProgress.js'

describe('boot percent', () => {
  it('starts at zero', () => {
    assert.equal(bootPercent(), 0)
  })

  it('counts a finished download before the figure is built', () => {
    assert.equal(bootPercent({ downloaded: true }), 62)
  })

  it('follows the bytes while the model is still arriving', () => {
    assert.equal(bootPercent({ loaded: 50, total: 100 }), 31)
  })

  it('reaches the painted frame only at the end', () => {
    const almost = bootPercent({ downloaded: true, built: 100, count: 100, fonts: true })
    assert.equal(almost, 95)
    assert.equal(bootPercent({ downloaded: true, built: 100, count: 100, fonts: true, painted: true }), 100)
  })

  it('never passes 100', () => {
    assert.equal(bootPercent({ loaded: 9, total: 1, downloaded: true, built: 40, count: 10, fonts: true, painted: true }), 100)
  })
})

describe('boot ink', () => {
  it('starts gray and ends black', () => {
    assert.equal(bootInk(0), 'rgb(158, 158, 152)')
    assert.equal(bootInk(100), 'rgb(17, 17, 17)')
  })

  it('darkens as the percentage climbs', () => {
    const mid = bootInk(50).match(/\d+/g).map(Number)
    assert.ok(mid[0] < 158 && mid[0] > 17)
    assert.ok(mid[0] > bootInk(80).match(/\d+/)[0])
  })
})
