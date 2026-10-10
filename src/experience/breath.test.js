import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { highpassRms, isClearBlow } from './breath.js'

describe('highpassRms', () => {
  it('is near zero for a low hum (voice-like)', () => {
    const samples = Float32Array.from({ length: 256 }, (_, i) => Math.sin((i / 256) * Math.PI * 2) * 0.4)
    const { rms } = highpassRms(samples)
    assert.ok(rms < 0.08, `hum rms ${rms}`)
  })

  it('stays loud for noisy high-frequency energy (blow-like)', () => {
    const samples = Float32Array.from({ length: 256 }, (_, i) => ((i * 17) % 10) / 5 - 1)
    const { rms } = highpassRms(samples)
    assert.ok(rms > 0.2, `noise rms ${rms}`)
  })
})

describe('isClearBlow', () => {
  it('rejects quiet air and speech-level hum', () => {
    assert.equal(isClearBlow(0.02), false)
    assert.equal(isClearBlow(0.06), false)
  })

  it('accepts a strong puff', () => {
    assert.equal(isClearBlow(0.22), true)
  })
})
