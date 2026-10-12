import { WaveSheetPlayer } from './WaveSheetPlayer.js'
import {
  TOY_COMPLETED,
  TOY_DROPPING,
  TOY_FAILED,
  TOY_PIECES,
  TOY_PLAYING,
  TOY_READY,
  TOY_RENDERS,
  TOY_REVEAL,
  TOY_SHEET,
  TOY_STACKED,
  TOY_STICK_SRC,
  TOY_WAVE,
  pickRender,
  toyAfterCatch,
  toyCanDrop,
  toyFallFrame,
  toyFrontClip,
  toyLayout,
  toyLetters,
  toySpaceAction,
  toySwing,
} from './toyLogic.js'

const WAVE_FRAME_MS = 62
const WAVE_HOLD_MS = 160

function loadImage(src) {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
  return image
}

function letterButton(className, text) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = className
  for (const item of toyLetters(text)) {
    if (!item.color) {
      button.append(item.char)
      continue
    }
    const span = document.createElement('span')
    span.textContent = item.char
    span.style.color = item.color
    button.append(span)
  }
  return button
}

class ToyGame {
  constructor(section, { reducedMotion = false, onAdvance } = {}) {
    this.section = section
    this.reduced = reducedMotion
    this.onAdvance = onAdvance
    this.coarse = window.matchMedia('(pointer: coarse)').matches
    this.shown = false
    this.interactive = false
    this.listening = false
    this.raf = 0
    this.last = 0
    this.clock = 0
    this.width = 0
    this.height = 0
    this.metrics = null
    this.state = TOY_READY
    this.swing = 0
    this.stacked = 0
    this.stackedPieces = []
    this.holeY = 0
    this.missed = false
    this.settle = 0
    this.hold = 0
    this.pending = TOY_STACKED
    this.waveHold = 0
    this.reversing = false
    this.press = null

    this.stage = document.createElement('div')
    this.stage.className = 'works-toy'

    this.group = document.createElement('div')
    this.group.className = 'works-toy-group'

    this.stick = document.createElement('img')
    this.stick.className = 'works-toy-stick'
    this.stick.src = TOY_STICK_SRC
    this.stick.alt = ''
    this.stick.draggable = false
    this.group.append(this.stick)

    this.fall = document.createElement('img')
    this.fall.className = 'works-toy-fall'
    this.fall.alt = ''
    this.fall.draggable = false
    this.fall.hidden = true
    this.clearFlight()

    this.hint = document.createElement('p')
    this.hint.className = 'works-toy-hint'
    this.hint.textContent = this.coarse ? 'TAP TO DROP' : 'SPACE TO DROP'
    this.hint.hidden = true

    this.stage.append(this.group, this.fall, this.hint)

    this.fail = document.createElement('div')
    this.fail.className = 'works-toy-fail'
    this.fail.hidden = true
    this.retry = document.createElement('button')
    this.retry.type = 'button'
    this.retry.className = 'works-toy-retry'
    this.retry.textContent = 'Retry'
    this.failMore = letterButton('works-toy-more', 'scroll to see more')
    this.fail.append(this.retry, this.failMore)

    this.reveal = document.createElement('div')
    this.reveal.className = 'works-toy-reveal'
    this.reveal.hidden = true
    this.revealImg = document.createElement('img')
    this.revealImg.alt = ''
    this.revealImg.draggable = false
    this.again = document.createElement('button')
    this.again.type = 'button'
    this.again.className = 'works-toy-again'
    this.again.textContent = 'Play again'
    this.revealMore = letterButton('works-toy-more', 'scroll to see more')
    const revealEnd = document.createElement('div')
    revealEnd.className = 'works-toy-reveal-end'
    revealEnd.append(this.again, this.revealMore)
    this.reveal.append(this.revealImg, revealEnd)

    this.cover = document.createElement('div')
    this.cover.className = 'works-toy-cover'

    this.canvas = document.createElement('canvas')
    this.canvas.className = 'works-toy-wave'
    this.canvas.hidden = true

    section.append(this.stage, this.fail, this.reveal, this.cover, this.canvas)

    this.sheet = loadImage(TOY_SHEET)
    TOY_RENDERS.forEach((src) => loadImage(src))
    TOY_PIECES.forEach((piece) => loadImage(piece.src))

    this.player = new WaveSheetPlayer(this.canvas, {
      columns: 5,
      rows: 3,
      // Solid body of the last cell. The sheet has empty margins; fitting the
      // body (not the cell) lets the wave cover the slide and leave downward.
      fit: { x: 20, y: 44, w: 356, h: 198 },
      onCovered: () => this.coverScene(),
      onDone: () => this.finishWave(),
    })

    this.onKey = this.onKey.bind(this)
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.tick = this.tick.bind(this)

    this.stage.addEventListener('pointerdown', this.onPointerDown)
    this.stage.addEventListener('pointerup', this.onPointerUp)
    this.stage.addEventListener('pointercancel', this.onPointerUp)
    this.retry.addEventListener('click', (event) => {
      event.stopPropagation()
      this.reset()
    })
    this.failMore.addEventListener('click', (event) => {
      event.stopPropagation()
      this.onAdvance?.()
    })
    this.again.addEventListener('click', (event) => {
      event.stopPropagation()
      this.reset()
    })
    this.revealMore.addEventListener('click', (event) => {
      event.stopPropagation()
      this.onAdvance?.()
    })
  }

  sync(showing, { interactive = false } = {}) {
    this.shown = showing
    this.setInteractive(Boolean(showing && interactive))
    if (showing) this.ensure()
    else this.pause()
  }

  reset() {
    this.clearPieces()
    this.player.stop()
    this.player.clear()
    this.canvas.hidden = true
    this.cover.style.height = '0%'
    this.stage.hidden = false
    this.fail.hidden = true
    this.reveal.hidden = true
    this.fall.hidden = true
    this.hint.hidden = true
    this.group.style.opacity = '0'
    this.group.style.transform = 'translateX(0px)'
    this.state = TOY_READY
    this.clock = 0
    this.last = 0
    this.swing = 0
    this.stacked = 0
    this.clearFlight()
    this.holeY = 0
    this.missed = false
    this.settle = 0
    this.hold = 0
    this.pending = TOY_STACKED
    this.waveHold = 0
    this.reversing = false
    this.press = null
    if (this.shown) this.ensure()
  }

  setInteractive(on) {
    if (on === this.listening) {
      this.interactive = on
      return
    }
    this.interactive = on
    this.listening = on
    if (on) window.addEventListener('keydown', this.onKey)
    else window.removeEventListener('keydown', this.onKey)
  }

  ensure() {
    if (this.raf) return
    this.last = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  pause() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.last = 0
  }

  onKey(event) {
    if (event.code !== 'Space' && event.key !== ' ') return
    if (!this.interactive) return
    event.preventDefault()
    if (event.repeat) return
    const action = toySpaceAction(this.state)
    if (action === 'drop') this.release()
    else if (action === 'reset') this.reset()
  }

  onPointerDown(event) {
    if (!this.interactive) return
    this.press = { x: event.clientX, y: event.clientY }
  }

  onPointerUp(event) {
    const press = this.press
    this.press = null
    if (!press || !this.interactive) return
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 14) return
    this.release()
  }

  readFlight() {
    return {
      holeX: this.holeX,
      holeY: this.holeY,
      vx: this.vx,
      vy: this.vy,
      spin: this.spin,
      angle: this.angle,
      checked: this.checked,
      missed: this.missed,
      committed: this.committed,
      willLand: this.willLand,
      hold: this.hitHold,
      kickVx: this.kickVx,
      kickVy: this.kickVy,
      kickSpin: this.kickSpin,
      originX: this.originX,
      originY: this.originY,
    }
  }

  writeFlight(flight) {
    this.holeX = flight.holeX
    this.holeY = flight.holeY
    this.vx = flight.vx
    this.vy = flight.vy
    this.spin = flight.spin
    this.angle = flight.angle
    this.checked = flight.checked
    this.missed = flight.missed
    this.committed = flight.committed
    this.willLand = flight.willLand
    this.hitHold = flight.hold
    this.kickVx = flight.kickVx
    this.kickVy = flight.kickVy
    this.kickSpin = flight.kickSpin
    this.originX = flight.originX
    this.originY = flight.originY
  }

  offscreen() {
    return this.holeY > this.height + 180 || Math.abs(this.holeX) > this.width * 0.5 + 240
  }

  clearFlight() {
    this.vy = 0
    this.vx = 0
    this.spin = 0
    this.angle = 0
    this.holeX = 0
    this.checked = false
    this.committed = false
    this.willLand = false
    this.hitHold = 0
    this.kickVx = 0
    this.kickVy = 0
    this.kickSpin = 0
    this.originX = 50
    this.originY = 50
    if (this.fall) {
      this.fall.style.transform = ''
      this.fall.style.transformOrigin = '50% 50%'
    }
  }

  release() {
    if (!toyCanDrop(this.state)) return
    this.state = TOY_DROPPING
    this.clearFlight()
    this.hint.hidden = true
  }

  layout() {
    const width = this.section.clientWidth
    const height = this.section.clientHeight
    if (!width || !height) return
    if (width === this.width && height === this.height && this.metrics) return
    this.width = width
    this.height = height
    this.metrics = toyLayout(width, height)
    this.place()
  }

  place() {
    const metrics = this.metrics
    if (!metrics) return
    this.group.style.left = `${this.width / 2}px`
    this.group.style.top = `${metrics.stickTop}px`
    this.stick.style.width = `${metrics.stickWidth}px`
    this.stick.style.height = `${metrics.stickHeight}px`
    this.stick.style.left = `${-metrics.stickWidth / 2}px`
    this.stick.style.top = '0px'
    this.stackedPieces.forEach((img, index) => {
      const piece = metrics.pieces[index]
      if (!piece) return
      this.paintPiece(img, piece)
    })
    this.placeFall()
  }

  placeFall() {
    const piece = this.metrics?.pieces[this.stacked]
    if (!piece || this.fall.hidden) return
    this.fall.style.width = `${piece.pieceWidth}px`
    this.fall.style.height = `${piece.pieceHeight}px`
    this.fall.style.left = `${this.width / 2 + this.holeX - piece.holeX}px`
    this.fall.style.top = `${this.holeY - piece.holeY}px`
    if (this.angle) {
      this.fall.style.transform = `rotate(${this.angle}deg)`
      this.fall.style.transformOrigin = `${this.originX}% ${this.originY}%`
    } else {
      this.fall.style.transform = ''
    }
    const pieceBottom = this.holeY - piece.holeY + piece.pieceHeight
    const mid = pieceBottom + Math.max(0, this.metrics.stickTop - pieceBottom) / 2
    this.hint.style.top = `${mid}px`
  }

  spawn() {
    const piece = this.metrics?.pieces[this.stacked]
    if (!piece) return
    this.fall.src = piece.src
    this.fall.hidden = false
    this.clearFlight()
    this.holeY = this.metrics.dropY
    this.hint.hidden = false
    this.placeFall()
  }

  paintPiece(img, piece) {
    img.style.width = `${piece.pieceWidth}px`
    img.style.height = `${piece.pieceHeight}px`
    img.style.left = `${-piece.holeX}px`
    img.style.top = `${piece.rest - piece.holeY}px`
    if (!img.front) return
    this.paintPiece(img.front, piece)
    img.front.style.clipPath = `inset(${(toyFrontClip(piece) * 100).toFixed(2)}% 0 0 0)`
  }

  land(piece) {
    const img = document.createElement('img')
    img.className = 'works-toy-piece'
    img.src = piece.src
    img.alt = ''
    img.draggable = false
    const front = img.cloneNode()
    front.classList.add('is-front')
    img.front = front
    this.paintPiece(img, piece)
    this.group.insertBefore(img, this.stick)
    this.group.append(front)
    this.stackedPieces.push(img)
    this.fall.hidden = true
    const result = toyAfterCatch(this.stacked)
    this.stacked = result.stacked
    this.pending = result.state
    this.state = TOY_STACKED
    this.settle = 0
  }

  showFail() {
    if (!this.fail.hidden) return
    this.fall.hidden = true
    this.hint.hidden = true
    this.fail.hidden = false
  }

  beginWave() {
    if (this.state === TOY_WAVE) return
    this.state = TOY_WAVE
    this.hint.hidden = true
    this.canvas.hidden = false
    this.reversing = false
    this.waveHold = WAVE_HOLD_MS
    const start = () => {
      this.player.setImage(this.sheet)
      if (this.state === TOY_WAVE) this.player.playForward()
    }
    if (this.sheet.complete && this.sheet.naturalWidth) start()
    else this.sheet.addEventListener('load', start, { once: true })
  }

  coverScene() {
    this.stage.hidden = true
    this.reveal.hidden = false
    this.cover.style.height = '0%'
    this.waveHold = WAVE_HOLD_MS
    this.reversing = false
  }

  finishWave() {
    this.state = TOY_REVEAL
    this.cover.style.height = '0%'
    this.canvas.hidden = true
    this.player.clear()
  }

  clearPieces() {
    this.stackedPieces.forEach((img) => {
      img.front?.remove()
      img.remove()
    })
    this.stackedPieces = []
  }

  step(dt) {
    this.layout()
    const metrics = this.metrics
    if (!metrics) return
    this.clock += dt * 1000
    const moving =
      !this.missed &&
      this.state !== TOY_FAILED &&
      this.state !== TOY_REVEAL &&
      this.state !== TOY_WAVE
    if (moving) this.swing = toySwing(this.clock, metrics.period, metrics.amplitude)

    if (this.state === TOY_READY) {
      const span = this.reduced ? 180 : 680
      const t = Math.min(1, this.clock / span)
      this.group.style.opacity = String(t)
      const rise = this.reduced ? 0 : (1 - t) * 32
      this.group.style.transform = `translate3d(${this.swing}px, ${rise}px, 0)`
      if (t >= 1) {
        this.state = TOY_PLAYING
        this.spawn()
      }
      return
    }

    if (this.state !== TOY_WAVE && this.state !== TOY_REVEAL) {
      this.group.style.opacity = '1'
      this.group.style.transform = `translate3d(${this.swing}px, 0, 0)`
    }

    const falling = this.state === TOY_DROPPING || (this.state === TOY_FAILED && this.fail.hidden && !this.fall.hidden)
    if (falling) {
      const piece = metrics.pieces[this.stacked]
      const flight = toyFallFrame(this.readFlight(), dt, {
        gravity: metrics.gravity,
        stickTop: metrics.stickTop,
        stickHeight: metrics.stickHeight,
        stickWidth: metrics.stickWidth,
        tolerance: metrics.tolerance,
        swing: this.swing,
        slot: piece ? metrics.stickTop + piece.rest : this.holeY,
        piece,
        scale: metrics.scale,
        clock: this.clock,
        period: metrics.period,
        amplitude: metrics.amplitude,
      })
      this.writeFlight(flight)
      if (flight.landed && piece) {
        this.land(piece)
        return
      }
      if (flight.missed) this.state = TOY_FAILED
      this.placeFall()
      if (this.state === TOY_FAILED && this.offscreen()) this.showFail()
      return
    }

    if (this.state === TOY_FAILED) {
      if (this.offscreen()) this.showFail()
      return
    }

    if (this.state === TOY_STACKED) {
      this.settle += dt
      const last = this.stackedPieces.at(-1)
      const dip =
        this.settle < 0.22 ? Math.sin((this.settle / 0.22) * Math.PI) * (8 * metrics.amplitude / 100) : 0
      const shift = dip ? `translateY(${dip}px)` : ''
      if (last) last.style.transform = shift
      if (last?.front) last.front.style.transform = shift
      if (this.settle >= 0.48) {
        if (last) last.style.transform = ''
        if (last?.front) last.front.style.transform = ''
        if (this.pending === TOY_COMPLETED) {
          this.state = TOY_COMPLETED
          this.hold = 0
          this.revealImg.src = pickRender(TOY_RENDERS)
        } else {
          this.state = TOY_PLAYING
          this.spawn()
        }
      }
      return
    }

    if (this.state === TOY_COMPLETED) {
      this.hold += dt
      if (this.hold >= 0.75) this.beginWave()
      return
    }

    if (this.state === TOY_WAVE) {
      if (!this.player.image && this.sheet.complete) this.player.setImage(this.sheet)
      if (this.player.playing) {
        this.player.tick(dt * 1000, WAVE_FRAME_MS)
        return
      }
      if (this.player.covered && !this.reversing) {
        this.waveHold -= dt * 1000
        if (this.waveHold <= 0) {
          this.reversing = true
          this.player.playBackward()
        }
      }
    }
  }

  tick(now) {
    this.raf = requestAnimationFrame(this.tick)
    if (!this.last) {
      this.last = now
      return
    }
    let left = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    while (left > 0) {
      const step = Math.min(left, 0.016)
      this.step(step)
      left -= step
    }
  }
}

export function toyFrame(_frame, options = {}) {
  const section = document.createElement('section')
  section.className = 'works-frame is-toy'
  section.toy = new ToyGame(section, options)
  return section
}
