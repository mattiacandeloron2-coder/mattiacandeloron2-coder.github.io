import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { breathEnergy, fiatoListens, highpassRms, isClearBlow, lowBandAlpha } from './breath.js'

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

function tone(freq, amp, n = 1024, sampleRate = 48000) {
  return Float32Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * freq * i) / sampleRate) * amp)
}

function noise(amp, n = 1024) {
  let seed = 1
  return Float32Array.from({ length: n }, () => {
    seed = (seed * 16807) % 2147483647
    return (seed / 2147483647) * 2 - 1
  }).map((sample) => sample * amp)
}

describe('a close blow on the microphone', () => {
  const alpha = lowBandAlpha(48000)

  function energy(samples) {
    return breathEnergy(samples, { lowAlpha: alpha })
  }

  it('scatters the figure for a low roar and still ignores a voice', () => {
    const blow = energy(tone(45, 0.95).map((sample, i) => sample + noise(0.08)[i]))
    const voice = energy(tone(220, 0.85))
    assert.equal(isClearBlow(blow.high, blow.low), true)
    assert.equal(isClearBlow(voice.high, voice.low), false)
  })

  it('still hears a hissy blow', () => {
    const hiss = energy(noise(0.35))
    assert.equal(isClearBlow(hiss.high, hiss.low), true)
  })
})

describe('fiatoListens', () => {
  it('listens on a phone, including the horizontal layout, and stays quiet on a computer', () => {
    assert.equal(fiatoListens({ coarse: true, hoverNone: true, reducedMotion: false }), true)
    assert.equal(fiatoListens({ coarse: false, hoverNone: true, reducedMotion: false }), false)
    assert.equal(fiatoListens({ coarse: true, hoverNone: true, reducedMotion: true }), false)
  })
})
