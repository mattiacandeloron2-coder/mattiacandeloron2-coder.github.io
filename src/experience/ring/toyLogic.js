// Layout numbers come from the assembled illustration (1024×1536).
// The stick runs from y 100 to y 1460. Hole positions are packed so the
// bodies touch, in the same order as that drawing, bottom to top.

export const TOY_STICK_TOP = 100
export const TOY_STICK_HEIGHT = 1361
export const TOY_STICK_WIDTH = 96
export const TOY_SWING = 100
export const TOY_TOLERANCE = 30

// Side to side at one speed. Long enough that a drop while the stick is
// lined up with the hole still meets the wood.
export const TOY_PERIOD = 12000

export const TOY_READY = 'READY'
export const TOY_PLAYING = 'PLAYING'
export const TOY_DROPPING = 'DROPPING'
export const TOY_STACKED = 'STACKED'
export const TOY_FAILED = 'FAILED'
export const TOY_COMPLETED = 'COMPLETED'
export const TOY_WAVE = 'WAVE_TRANSITION'
export const TOY_REVEAL = 'REVEAL'

const ASSET = '/progetti/Ring monster/gioco'

export const TOY_PIECES = [
  {
    id: 'triangle',
    src: `${ASSET}/triangle.png`,
    w: 281,
    h: 227,
    holeX: 139.6,
    holeY: 136.2,
    holeBottom: 174,
    span: 221,
    holeAt: 1254,
  },
  {
    id: 'pink',
    src: `${ASSET}/ring-pink.png`,
    w: 402,
    h: 155,
    holeX: 200.7,
    holeY: 76.4,
    holeBottom: 113,
    span: 273,
    holeAt: 1102,
  },
  {
    id: 'yellow',
    src: `${ASSET}/ring-yellow.png`,
    w: 373,
    h: 155,
    holeX: 185.8,
    holeY: 76.9,
    holeBottom: 114,
    span: 274,
    holeAt: 1000,
  },
  {
    id: 'brown',
    src: `${ASSET}/leg-brown.png`,
    w: 459,
    h: 304,
    holeX: 259.2,
    holeY: 208.2,
    holeBottom: 245,
    span: 331,
    holeAt: 883,
  },
  {
    id: 'disc',
    src: `${ASSET}/disc.png`,
    w: 421,
    h: 166,
    holeX: 210.5,
    holeY: 84.5,
    holeBottom: 124,
    span: 315,
    holeAt: 680,
  },
  {
    id: 'green',
    src: `${ASSET}/legs-green.png`,
    w: 568,
    h: 310,
    holeX: 282.6,
    holeY: 223.3,
    holeBottom: 260,
    span: 469,
    holeAt: 554,
  },
]

export const TOY_STICK_SRC = `${ASSET}/stick.png`

export const TOY_SHEET =
  '/progetti/Ring monster/Gioco ringmonster/ChatGPT Image 12 ott 2026, 12_30_33.png'

export const TOY_RENDERS = [
  '/progetti/Ring monster/Gioco ringmonster/Immagine ChatGPT 12 ott 2026, 17_31_49.png',
  '/progetti/Ring monster/Gioco ringmonster/Immagine ChatGPT 12 ott 2026, 17_32_01.png',
  '/progetti/Ring monster/Gioco ringmonster/Immagine ChatGPT 12 ott 2026, 17_32_12.png',
  '/progetti/Ring monster/Gioco ringmonster/Immagine ChatGPT 12 ott 2026, 17_32_21.png',
]

export const TOY_INK = ['#8FBF8A', '#E36B58', '#E4B4D0', '#E3C15A', '#A9C8D4', '#C4A07A']

export function toyScale(width, height) {
  if (!(width > 0) || !(height > 0)) return 1
  const byHeight = (height * 0.7) / TOY_STICK_HEIGHT
  const green = 469 * byHeight
  const cap = Math.min(width * 0.46, height * 0.36)
  if (green > cap && green > 0) return byHeight * (cap / green)
  return byHeight
}

const REFERENCE_SCALE = toyScale(1920, 1080)

export function toyAmplitude(scale) {
  return TOY_SWING * (scale / REFERENCE_SCALE)
}

export function toyTolerance(scale) {
  return TOY_TOLERANCE * (scale / REFERENCE_SCALE)
}

export function toyGravity(scale) {
  return 6800 * (scale / REFERENCE_SCALE)
}

export function toySwing(timeMs, periodMs = TOY_PERIOD, amplitude = TOY_SWING) {
  const period = periodMs > 0 ? periodMs : TOY_PERIOD
  let u = timeMs / period
  u -= Math.floor(u)
  const q = u * 4
  let x
  if (q < 1) x = -1 + q
  else if (q < 2) x = q - 1
  else x = 3 - q
  return x * amplitude
}

export function toyCaught(swing, tolerance) {
  return Math.abs(swing) <= tolerance
}

// Share of the piece that stays behind the stick. The lip under the hole is in front.
export function toyFrontClip(piece) {
  if (!(piece.h > 0)) return 1
  return Math.min(1, Math.max(0, piece.holeBottom / piece.h))
}

// Shoulder of the rounded cap, measured on stick.png (96×1361).
const TOY_WOOD_INSET = 31 / TOY_STICK_WIDTH
const TOY_CAP_BEND = 22 / TOY_STICK_HEIGHT

export function toyCornerY(stickTop, stickHeight) {
  return stickTop + stickHeight * TOY_CAP_BEND
}

export function toySpaceAction(state) {
  if (state === TOY_PLAYING) return 'drop'
  if (state === TOY_FAILED || state === TOY_REVEAL) return 'reset'
  return 'idle'
}

// Seconds until the hole, falling with gravity, reaches slot.
export function toyArrival(holeY, vy, slot, gravity) {
  if (!(gravity > 0) || holeY >= slot) return 0
  const a = 0.5 * gravity
  const disc = vy * vy - 4 * a * (holeY - slot)
  if (disc <= 0) return 0
  return (-vy + Math.sqrt(disc)) / (2 * a)
}

function clampPercent(value) {
  return Math.min(100, Math.max(0, value))
}

// A miss meets the near shoulder of the cap, then is kicked off that side.
export function toyCornerHit({ swing, stickWidth, piece, holeX = 0, scale = REFERENCE_SCALE }) {
  const dir = swing >= 0 ? 1 : -1
  const cornerX = swing - dir * stickWidth * TOY_WOOD_INSET
  const left = holeX - piece.holeX
  const right = left + piece.pieceWidth
  const bite = stickWidth * 0.035
  let next = holeX
  if (dir > 0 && right < cornerX) next += cornerX - right + bite
  if (dir < 0 && left > cornerX) next -= left - cornerX + bite
  const k = (scale > 0 ? scale : REFERENCE_SCALE) / REFERENCE_SCALE
  const localX = piece.pieceWidth ? piece.holeX + (cornerX - next) : 0
  return {
    holeX: next,
    vx: -dir * 860 * k,
    vy: 380 * k,
    spin: -dir * 260,
    hold: 0.1,
    originX: piece.pieceWidth ? clampPercent((localX / piece.pieceWidth) * 100) : 50,
    originY: 100,
    cornerX,
  }
}

function beginCornerHit(next, scene, piece) {
  const hit = toyCornerHit({
    swing: scene.swing,
    stickWidth: scene.stickWidth,
    piece,
    holeX: next.holeX,
    scale: scene.scale,
  })
  const cornerY = toyCornerY(scene.stickTop, scene.stickHeight)
  const contactY = cornerY - piece.pieceHeight + piece.holeY
  next.checked = true
  next.missed = true
  next.committed = true
  next.holeX = hit.holeX
  // Sit on the cap when the piece is still there. A late miss kicks off
  // from its current height instead of jumping back up the stick.
  if (Math.abs(next.holeY - contactY) < piece.pieceHeight) next.holeY = contactY
  next.vx = 0
  next.vy = 0
  next.spin = 0
  next.angle = 0
  next.hold = hit.hold
  next.kickVx = hit.vx
  next.kickVy = hit.vy
  next.kickSpin = hit.spin
  next.originX = hit.originX
  next.originY = hit.originY
  return next
}

export function toyFallFrame(flight, dt, scene) {
  const next = {
    holeX: 0,
    holeY: 0,
    vx: 0,
    vy: 0,
    spin: 0,
    angle: 0,
    checked: false,
    missed: false,
    committed: false,
    willLand: false,
    hold: 0,
    kickVx: 0,
    kickVy: 0,
    kickSpin: 0,
    originX: 50,
    originY: 50,
    landed: false,
    ...flight,
    landed: false,
  }

  if (next.hold > 0) {
    next.hold -= dt
    if (next.hold <= 0) {
      next.hold = 0
      next.vx = next.kickVx
      next.vy = next.kickVy
      next.spin = next.kickSpin
    }
    return next
  }

  next.vy += scene.gravity * dt
  next.holeY += next.vy * dt
  next.holeX += next.vx * dt
  next.angle += next.spin * dt

  const piece = scene.piece
  if (!piece || next.checked) return next

  const cornerY = toyCornerY(scene.stickTop, scene.stickHeight)
  const bottom = next.holeY - piece.holeY + piece.pieceHeight
  if (!next.committed && bottom >= cornerY) {
    next.committed = true
    const t = toyArrival(next.holeY, next.vy, scene.slot, scene.gravity)
    const arrival = toySwing(scene.clock + t * 1000, scene.period, scene.amplitude)
    next.willLand = toyCaught(arrival, scene.tolerance)
    // Only a stick that is already off the hole, and will still be off at the seat, clips the cap.
    if (!next.willLand && !toyCaught(scene.swing, scene.tolerance)) return beginCornerHit(next, scene, piece)
  }

  if (!next.missed && next.holeY >= scene.slot) {
    next.checked = true
    next.vx = 0
    next.vy = 0
    if (next.willLand || toyCaught(scene.swing, scene.tolerance)) {
      next.holeY = scene.slot
      next.landed = true
      return next
    }
    return beginCornerHit(next, scene, piece)
  }

  return next
}

export function toyCanDrop(state) {
  return state === TOY_PLAYING
}

export function toyAfterCatch(stacked, total = TOY_PIECES.length) {
  const next = stacked + 1
  if (next >= total) return { stacked: next, state: TOY_COMPLETED }
  return { stacked: next, state: TOY_STACKED }
}

export const TOY_HOLA_CYCLE = 5000
export const TOY_HOLA_STEP = 140
export const TOY_HOLA_HOP = 400

export function toyHolaDelay(index) {
  return index * TOY_HOLA_STEP
}

export function toyHolaFits(count) {
  if (count <= 0) return true
  return toyHolaDelay(Math.max(0, count - 1)) + TOY_HOLA_HOP < TOY_HOLA_CYCLE
}

export function toyLetters(text, palette = TOY_INK) {
  let ink = 0
  return [...text].map((char) => {
    if (char === ' ' || char === '\n') return { char, color: null }
    const color = palette[ink % palette.length]
    ink += 1
    return { char, color }
  })
}

export function pickRender(renders, random = Math.random) {
  if (!renders.length) return ''
  const index = Math.min(renders.length - 1, Math.floor(random() * renders.length))
  return renders[index]
}

export function waveCoverRatio(frame, count) {
  if (count <= 1) return 1
  const last = count - 1
  if (frame >= last) return 1
  return 0.12 + (frame / last) * 0.88
}

export function toyLayout(width, height) {
  const scale = toyScale(width, height)
  const stickHeight = TOY_STICK_HEIGHT * scale
  const stickWidth = TOY_STICK_WIDTH * scale
  const bottom = height * 0.09
  const stickTop = height - bottom - stickHeight
  const pieces = TOY_PIECES.map((piece) => {
    const pieceWidth = piece.span * scale
    const pieceHeight = pieceWidth * (piece.h / piece.w)
    return {
      ...piece,
      pieceWidth,
      pieceHeight,
      holeX: (piece.holeX / piece.w) * pieceWidth,
      holeY: (piece.holeY / piece.h) * pieceHeight,
      rest: (piece.holeAt - TOY_STICK_TOP) * scale,
    }
  })
  return {
    scale,
    stickTop,
    stickHeight,
    stickWidth,
    amplitude: toyAmplitude(scale),
    tolerance: toyTolerance(scale),
    gravity: toyGravity(scale),
    period: TOY_PERIOD,
    dropY: Math.max(height * 0.11, 36),
    pieces,
  }
}
