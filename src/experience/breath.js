export function lowBandAlpha(sampleRate = 48000) {
  const rate = Math.max(8000, Number(sampleRate) || 48000)
  return 1 - Math.exp((-2 * Math.PI * 70) / rate)
}

export function breathEnergy(
  samples,
  { prevX = 0, prevY = 0, prevLow = 0, highAlpha = 0.8, lowAlpha = 0.008 } = {},
) {
  let x1 = prevX
  let y1 = prevY
  let low = prevLow
  let highAcc = 0
  let lowAcc = 0
  let counted = 0
  const skip = Math.min(32, Math.max(0, (samples.length / 8) | 0))
  for (let i = 0; i < samples.length; i += 1) {
    const x = samples[i]
    const y = highAlpha * (y1 + x - x1)
    low += lowAlpha * (x - low)
    if (i >= skip) {
      highAcc += y * y
      lowAcc += low * low
      counted += 1
    }
    x1 = x
    y1 = y
  }
  const n = counted || 1
  return {
    high: Math.sqrt(highAcc / n),
    low: Math.sqrt(lowAcc / n),
    prevX: x1,
    prevY: y1,
    prevLow: low,
  }
}

export function highpassRms(samples, state = {}) {
  const out = breathEnergy(samples, state)
  return { rms: out.high, prevX: out.prevX, prevY: out.prevY }
}

export function isClearBlow(high, low = 0, { highMin = 0.14, lowMin = 0.32 } = {}) {
  return Number(high) >= highMin || Number(low) >= lowMin
}

export function fiatoListens({ coarse, hoverNone, reducedMotion } = {}) {
  return Boolean(coarse) && Boolean(hoverNone) && !reducedMotion
}

// A blow unhinges every point into a cloud around the figure. The scatter
// is larger than the gentle outward drift, so the pose comes apart instead
// of launching away from its centre.
export const fiatoScatter = 0.36
export const fiatoExpand = 0.18
export const fiatoEnvelope = { coast: 1.15, returnSeconds: 7.6, peak: 1 }

export function fiatoCloudOffset(origin, seed, amount = 1) {
  const gain = Number(amount) || 0
  if (!gain) return { x: 0, y: 0, z: 0 }
  const sx = (Number(seed?.[0]) || 0) - 0.5
  const sy = (Number(seed?.[1]) || 0) - 0.5
  const sz = (Number(seed?.[2]) || 0) - 0.5
  const ox = Number(origin?.[0]) || 0
  const oy = Number(origin?.[1]) || 0
  const oz = Number(origin?.[2]) || 0
  return {
    x: (sx * fiatoScatter + ox * fiatoExpand) * gain,
    y: (sy * fiatoScatter + oy * fiatoExpand) * gain,
    z: (sz * fiatoScatter + oz * fiatoExpand) * gain,
  }
}

export class BreathMic {
  constructor() {
    this.ready = false
    this.denied = false
    this.filter = { prevX: 0, prevY: 0 }
    this.buf = null
    this.lastBlowAt = 0
    this.stream = null
    this.ctx = null
    this.analyser = null
  }

  prime() {
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext
    if (!AudioCtx) return false
    if (!this.ctx) this.ctx = new AudioCtx()
    this.ctx.resume?.()
    return true
  }

  async start() {
    if (this.ready) return true
    if (!navigator.mediaDevices?.getUserMedia) {
      this.denied = true
      return false
    }
    this.prime()
    if (!this.ctx) {
      this.denied = true
      return false
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      })
      const src = this.ctx.createMediaStreamSource(this.stream)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 1024
      this.analyser.smoothingTimeConstant = 0.12
      src.connect(this.analyser)
      this.buf = new Float32Array(this.analyser.fftSize)
      this.ready = true
      this.denied = false
      return true
    } catch {
      this.denied = true
      return false
    }
  }

  async resume() {
    if (this.ctx?.state === 'suspended') await this.ctx.resume()
  }

  poll(now) {
    if (!this.ready || !this.analyser || !this.buf) return false
    this.analyser.getFloatTimeDomainData(this.buf)
    const out = breathEnergy(this.buf, {
      ...this.filter,
      lowAlpha: lowBandAlpha(this.ctx?.sampleRate),
    })
    this.filter = { prevX: out.prevX, prevY: out.prevY, prevLow: out.prevLow }
    if (!isClearBlow(out.high, out.low)) return false
    if (now - this.lastBlowAt < 1100) return false
    this.lastBlowAt = now
    return true
  }

  dispose() {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.ctx?.close?.()
    this.ready = false
  }
}
