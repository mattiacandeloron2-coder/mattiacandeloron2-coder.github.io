// Plays a spritesheet as a grid of equal cells, left to right, top to bottom.
// The Ring Monster sheet is five columns by three rows.

export class WaveSheetPlayer {
  constructor(canvas, { columns = 5, rows = 3, fit = null, onCovered, onDone } = {}) {
    this.canvas = canvas
    this.columns = columns
    this.rows = rows
    this.fit = fit
    this.onCovered = onCovered
    this.onDone = onDone
    this.image = null
    this.frame = 0
    this.direction = 1
    this.playing = false
    this.covered = false
    this.done = false
    this.elapsed = 0
    this.ctx = canvas.getContext('2d')
  }

  setImage(image) {
    this.image = image
  }

  get frameCount() {
    return this.columns * this.rows
  }

  playForward() {
    this.direction = 1
    this.frame = 0
    this.elapsed = 0
    this.playing = true
    this.covered = false
    this.done = false
    this.draw()
  }

  playBackward() {
    this.direction = -1
    this.frame = this.frameCount - 1
    this.elapsed = 0
    this.playing = true
    this.done = false
    this.draw()
  }

  stop() {
    this.playing = false
    this.covered = false
    this.done = false
    this.frame = 0
    this.direction = 1
    this.elapsed = 0
  }

  clear() {
    const ctx = this.ctx
    if (!ctx) return
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  tick(dt, frameMs) {
    if (!this.playing || !this.image) return this.frame
    const step = frameMs > 0 ? frameMs : 60
    this.elapsed += dt
    while (this.playing && this.elapsed >= step) {
      this.elapsed -= step
      const next = this.frame + this.direction
      const last = this.frameCount - 1
      if (next > last) {
        this.frame = last
        this.playing = false
        if (!this.covered) {
          this.covered = true
          this.onCovered?.()
        }
        break
      }
      if (next < 0) {
        this.frame = 0
        this.playing = false
        if (!this.done) {
          this.done = true
          this.onDone?.()
        }
        break
      }
      this.frame = next
    }
    this.draw()
    return this.frame
  }

  draw() {
    const canvas = this.canvas
    const ctx = this.ctx
    const image = this.image
    if (!ctx || !image?.width) return
    const box = canvas.getBoundingClientRect()
    const cssW = box.width || canvas.parentElement?.clientWidth || 1
    const cssH = box.height || canvas.parentElement?.clientHeight || 1
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(cssW * dpr))
    const height = Math.max(1, Math.round(cssH * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    ctx.clearRect(0, 0, width, height)
    const cellW = Math.floor(image.width / this.columns)
    const cellH = Math.floor(image.height / this.rows)
    const col = this.frame % this.columns
    const row = Math.floor(this.frame / this.columns)
    const fit = this.fit
    const boxW = fit?.w > 0 ? fit.w : cellW
    const boxH = fit?.h > 0 ? fit.h : cellH
    const boxX = fit?.x || 0
    const boxY = fit?.y || 0
    const scale = Math.max(width / boxW, height / boxH)
    const dw = cellW * scale
    const dh = cellH * scale
    const dx = (width - boxW * scale) / 2 - boxX * scale
    const dy = height - (boxY + boxH) * scale
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(image, col * cellW, row * cellH, cellW, cellH, dx, dy, dw, dh)
  }
}
