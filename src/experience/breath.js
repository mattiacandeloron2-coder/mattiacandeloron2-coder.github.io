export function highpassRms(samples, { prevX = 0, prevY = 0, alpha = 0.8 } = {}) {
  let x1 = prevX
  let y1 = prevY
  let acc = 0
  let counted = 0
  const skip = Math.min(32, Math.max(0, (samples.length / 8) | 0))
  for (let i = 0; i < samples.length; i += 1) {
    const x = samples[i]
    const y = alpha * (y1 + x - x1)
    if (i >= skip) {
      acc += y * y
      counted += 1
    }
    x1 = x
    y1 = y
  }
  const n = counted || 1
  return { rms: Math.sqrt(acc / n), prevX: x1, prevY: y1 }
}

export function isClearBlow(rms, { min = 0.14 } = {}) {
  return Number(rms) >= min
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

  async start() {
    if (this.ready) return true
    if (!navigator.mediaDevices?.getUserMedia) {
      this.denied = true
      return false
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      })
      this.ctx = new AudioContext()
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
    const out = highpassRms(this.buf, this.filter)
    this.filter = { prevX: out.prevX, prevY: out.prevY }
    if (!isClearBlow(out.rms)) return false
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
