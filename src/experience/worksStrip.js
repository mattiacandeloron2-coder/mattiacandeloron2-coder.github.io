import { cvContactIcon, cvContacts } from './cvSheet.js'
import { hangFrame } from './hang/frame.js'
import { lerp, smoothstep } from './math.js'
import { PosterFan } from './posters.js'
import { toyFrame } from './ring/toyFrame.js'
import { SnailTurn } from './snailTurn.js'
import { StickerAdhesion } from './sticker/StickerAdhesion.js'

export function worksProgress(scrollProgress) {
  return Math.max(0, scrollProgress - 1)
}

export function worksTravel(scrollProgress, viewportHeight, distance) {
  if (viewportHeight <= 0 || distance <= 0) return 0
  return worksProgress(scrollProgress) * (distance / viewportHeight)
}

export function scrollMax(_projectCount, viewportHeight, distance) {
  if (distance <= 0) return 1
  return 1 + viewportHeight / distance
}

export function slideOffset(worksTravelValue, index) {
  return index + 1 - worksTravelValue
}

export function sceneLift(_worksTravelValue) {
  return 0
}

export function slidePin(offset, index = 0, worksTravelValue = 1) {
  if (index === 0 && worksTravelValue < 1) return 0
  return -offset
}

export function projectFrames(project) {
  if (Array.isArray(project?.frames) && project.frames.length) return project.frames
  return [{ src: project?.image || '', role: 'cover', caption: true }]
}

export function lensHoldsMedia(lens, opening) {
  return Boolean(lens) && !opening
}

export function storyScrolls(project) {
  return projectFrames(project).length > 1
}

export const storySpan = 0.42

export function storyVisual(scroll) {
  return Math.min(1, Math.max(0, scroll / storySpan))
}

export function storyScroll(current, delta, frameCount) {
  const max = Math.max(0, frameCount - 1) * storySpan
  return Math.min(max, Math.max(0, current + delta))
}

export function storyShift(scroll) {
  return storyTrackShift(scroll, false)
}

export function storyTrackShift(scroll, overlay = false) {
  if (!scroll) return 0
  const slides = scroll / storySpan
  return -(overlay ? Math.min(1, slides) : slides)
}

export function storyZoomVisual(scroll) {
  const start = storySpan * 2
  return Math.min(1, Math.max(0, (scroll - start) / storySpan))
}

export function storyZoom(scroll) {
  return 1 + 0.14 * storyZoomVisual(scroll)
}

export function storyArrive(scroll) {
  const visual = storyZoomVisual(scroll)
  return visual >= 1 ? 0 : (1 - visual) * -20
}

export function storyNoteOpacity(progress, role, index) {
  const start = role === 'title' ? 0.05 + index * 0.28 : 0.2 + index * 0.28
  const span = role === 'title' ? 0.24 : 0.36
  if (progress <= start) return 0
  if (progress >= start + span) return 1
  return smoothstep(start, start + span, progress)
}

export function storyGrow(scroll) {
  return 0.96 + 0.42 * storyVisual(scroll)
}

export function storyDelta(deltaY, deltaMode, viewportHeight) {
  let delta = deltaY
  if (deltaMode === 1) delta *= 16
  else if (deltaMode === 2) delta *= viewportHeight
  if (!viewportHeight) return 0
  return delta / viewportHeight
}

export function storyBoardShift(scroll) {
  const t = scroll / storySpan
  if (t <= 0) return 0
  if (t <= 2) return -t
  if (t <= 3) return -2
  if (t <= 4) return -2 - (t - 3)
  if (t <= 5) return -3
  if (t <= 6) return -3 - (t - 5)
  if (t <= 7) return -4
  if (t <= 8) return -4 - (t - 7)
  if (t <= 9) return -5
  if (t <= 10) return -5 - (t - 9)
  if (t <= 16) return -6
  if (t <= 17) return -6 - (t - 16)
  return -7
}

export function storyScentVisual(scroll) {
  const start = storySpan * 6
  return Math.min(1, Math.max(0, (scroll - start) / storySpan))
}

export function storyShellVisual(scroll) {
  const start = storySpan * 8
  return Math.min(1, Math.max(0, (scroll - start) / storySpan))
}

export function storyShellSpread(scroll) {
  return 0.82 + 0.44 * storyShellVisual(scroll)
}

export function storyPhasesText(scroll) {
  const start = storySpan * 10
  return Math.min(1, Math.max(0, (scroll - start) / storySpan))
}

export function storyPhasesStep(scroll) {
  const start = storySpan * 11
  return Math.min(5, Math.max(0, (scroll - start) / storySpan))
}

export function storyPhaseFade(step, index) {
  const progress = Math.min(1, Math.max(0, step - index))
  if (progress <= 0.08) return 0
  if (progress >= 0.9) return 1
  return smoothstep(0.08, 0.9, progress)
}

export function storyPhaseArrowFade(step, index) {
  const progress = step - (index + 1)
  if (progress <= 0.12) return 0
  if (progress >= 0.48) return 1
  return smoothstep(0.12, 0.48, progress)
}

export function storyFinaleVisual(scroll) {
  const start = storySpan * 16
  return Math.min(1, Math.max(0, (scroll - start) / (storySpan * 3)))
}

export function storyFinalePiece(visual, index) {
  const start = index / 3
  const end = (index + 1) / 3
  if (visual <= start) return 0
  if (visual >= end) return 1
  return smoothstep(start, end, visual)
}

export function storyScrollCue(scroll) {
  const step = storyPhasesStep(scroll)
  const finale = storyFinaleVisual(scroll)
  if (step <= 0.08) return 1
  if (step < 0.35) return 1 - smoothstep(0.08, 0.35, step)
  if (step < 4.55) return 0
  const back = smoothstep(4.55, 5, step)
  const leave = 1 - smoothstep(0.08, 0.42, finale)
  return back * leave
}

export function storyMeasuresVisual(scroll) {
  const start = storySpan * 19
  return Math.min(1, Math.max(0, (scroll - start) / storySpan))
}

export function storyEndChrome(scroll) {
  return storyMeasuresVisual(scroll)
}

export function projectContacts() {
  const contacts = cvContacts()
  const phone = contacts.find((item) => item.icon === 'phone')
  const mail = contacts.find((item) => item.icon === 'mail')
  return [phone, mail].filter(Boolean)
}

export function storyEndNav(roles) {
  const show =
    roles.includes('finale') ||
    roles.includes('still') ||
    roles.includes('board') ||
    roles.includes('layer') ||
    roles.includes('evolve')
  if (!show) return null
  const nav = {
    previous: roles.includes('still') || roles.includes('board') || roles.includes('layer') || roles.includes('evolve'),
    finale: roles.includes('finale'),
    photo: roles.includes('still'),
  }
  if (roles.includes('evolve')) nav.refresh = true
  return nav
}

export function editorialHold(role) {
  if (
    role === 'concept' ||
    role === 'stage' ||
    role === 'materials' ||
    role === 'parterre' ||
    role === 'samples' ||
    role === 'idea' ||
    role === 'process' ||
    role === 'supports' ||
    role === 'sticker' ||
    role === 'posters' ||
    role === 'totem' ||
    role === 'layer' ||
    role === 'product' ||
    role === 'evolve'
  ) {
    return 2
  }
  if (role === 'still' || role === 'board') return 1
  return 0
}

export function editorialRead(dwell) {
  const fadeIn = smoothstep(0.06, 0.28, dwell)
  const fadeOut = 1 - smoothstep(0.72, 0.96, dwell)
  return fadeIn * fadeOut
}

export function editorialIn(dwell, start, end) {
  if (dwell <= start) return 0
  if (dwell >= end) return 1
  return smoothstep(start, end, dwell)
}

export function totemFade(dwell) {
  return editorialIn(dwell, 0, 0.9)
}

export function layerStepsFade(dwell) {
  return editorialIn(dwell, 0.02, 0.42)
}

export function layerPhoneFade(dwell) {
  return editorialIn(dwell, 0.48, 0.92)
}

export function productRush(dwell) {
  if (dwell <= 0) return 0
  if (dwell >= 0.14) return 1
  return dwell / 0.14
}

export function evolveIn(dwell, index) {
  const start = 0.22 + index * 0.15
  return editorialIn(dwell, start, start + 0.16)
}

export function evolveLine(dwell) {
  return editorialIn(dwell, 0.22, 0.83)
}

export const reelTrailLife = 1200

export function reelStillBox(frameWidth, frameHeight, videoWidth, videoHeight) {
  const ratio = videoWidth > 0 && videoHeight > 0 ? videoWidth / videoHeight : 720 / 900
  let width = frameWidth
  let height = frameWidth / ratio
  if (height > frameHeight) {
    height = frameHeight
    width = frameHeight * ratio
  }
  return { width: width / 3, height: height / 3 }
}

export function reelTrailFade(age, life, reducedMotion = false) {
  if (!(life > 0)) return 0
  const t = age / life
  if (t <= 0 || t >= 1) return 0
  if (reducedMotion) return 1
  const fadeIn = Math.min(1, t / 0.14)
  const fadeOut = t < 0.58 ? 1 : 1 - (t - 0.58) / 0.42
  return fadeIn * Math.max(0, fadeOut)
}

export function reelTrailBlocked(x, y) {
  return x > 0.78 && y < 0.2
}

export function reelTrailStep(drops, pointer, now, sources, pickIndex, { life = reelTrailLife, gap = 0.08 } = {}) {
  const last = drops.at(-1)
  const alive = drops.filter((drop) => now - drop.born < (drop.seen === false ? 4000 : life))
  if (!pointer || !sources.length || reelTrailBlocked(pointer.x, pointer.y)) {
    return { drops: alive, pick: pickIndex }
  }
  if (last && Math.hypot(pointer.x - last.x, pointer.y - last.y) < gap) {
    return { drops: alive, pick: pickIndex }
  }
  const count = sources.length
  let pick = ((pickIndex % count) + count) % count
  if (last && sources[pick] === last.src) pick = (pick + 1) % count
  alive.push({ x: pointer.x, y: pointer.y, born: now, seen: false, src: sources[pick] })
  return { drops: alive, pick: pick + 1 }
}

function reelDeck(sources) {
  const copy = [...sources]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = copy[i]
    copy[i] = copy[j]
    copy[j] = swap
  }
  return copy
}

export function skyTrailStep(trail, pointer, inside, reducedMotion = false) {
  const follow = reducedMotion ? 1 : 0.22
  const fade = reducedMotion ? 1 : 0.08
  let leadX = pointer?.x ?? 0.5
  let leadY = pointer?.y ?? 0.5
  return trail.map((light) => {
    const snap = !light.placed && pointer
    const x = snap ? pointer.x : light.x + (leadX - light.x) * follow
    const y = snap ? pointer.y : light.y + (leadY - light.y) * follow
    const on = light.on + ((inside ? 1 : 0) - light.on) * fade
    leadX = x
    leadY = y
    return { x, y, on, placed: light.placed || Boolean(pointer) }
  })
}

// Tubes keep swinging for the whole time their frame is still on screen.
// The next slide's halfway mark is too early: they freeze while still visible.
export function hangInView(shift, index = 0) {
  return shift > -index - 1 && shift < 1 - index
}

export function editorialTimeline(scroll, holds) {
  const t = scroll / storySpan
  let cursor = 0
  const frames = holds.map((hold, index) => {
    let arrive = 1
    if (index > 0) {
      arrive = Math.min(1, Math.max(0, t - cursor))
      cursor += 1
    }
    const into = t - cursor
    const dwell = hold > 0 ? Math.min(1, Math.max(0, into / hold)) : into >= 0 ? 1 : 0
    cursor += hold
    return { arrive, dwell }
  })
  const shift = -frames.reduce((sum, frame, index) => sum + (index === 0 ? 0 : frame.arrive), 0)
  return { shift, frames }
}

export function editorialOnPaper(scroll, holds, roles) {
  const { frames } = editorialTimeline(scroll, holds)
  let index = 0
  frames.forEach((frame, i) => {
    if (frame.arrive >= 0.5) index = i
  })
  const role = roles[index]
  return (
    role === 'concept' ||
    role === 'stage' ||
    role === 'parterre' ||
    role === 'samples' ||
    role === 'idea' ||
    role === 'process' ||
    role === 'supports' ||
    role === 'board' ||
    role === 'sticker' ||
    role === 'posters' ||
    role === 'totem' ||
    role === 'layer' ||
    role === 'product' ||
    role === 'evolve'
  )
}

export function filtersRise(scroll) {
  const start = storySpan * 4
  return Math.min(1, Math.max(0, (scroll - start) / storySpan))
}

export function storyPaper(scroll) {
  return storyVisual(scroll) > 0.45
}

export function worksCaptionLines(project) {
  return (project.lines ?? []).filter((line) => String(line).trim() !== '')
}

export function worksImageFocus(project) {
  return project.imageFocus || 'center center'
}

function contextCopy(copy) {
  const block = document.createElement('div')
  block.className = 'works-context'
  const label = document.createElement('p')
  label.className = 'works-context-label'
  label.textContent = copy.label
  const body = document.createElement('div')
  body.className = 'works-context-body'
  String(copy.body)
    .split(/\n\n+/)
    .forEach((part) => {
      const p = document.createElement('p')
      p.innerHTML = part
      body.appendChild(p)
    })
  block.append(label, body)
  return block
}

function scrollCue() {
  const cue = document.createElement('div')
  cue.className = 'works-cue'
  cue.setAttribute('aria-hidden', 'true')
  const arrow = document.createElement('span')
  arrow.className = 'works-cue-arrow'
  cue.appendChild(arrow)
  return cue
}

function contactBand() {
  const band = document.createElement('div')
  band.className = 'works-contacts'
  const label = document.createElement('p')
  label.className = 'works-contacts-label'
  label.textContent = 'contacts'
  band.appendChild(label)
  projectContacts().forEach((contact) => {
    const link = document.createElement('a')
    link.href = contact.href
    link.innerHTML = `${cvContactIcon(contact.icon)}<span>${contact.label}</span>`
    band.appendChild(link)
  })
  return band
}

function storyEnd(strip, { previous = false, refresh = false } = {}) {
  const bar = document.createElement('div')
  bar.className = 'works-end'
  bar.setAttribute('aria-hidden', 'true')
  bar.appendChild(contactBand())

  const compact = document.createElement('button')
  compact.type = 'button'
  compact.className = 'works-compact'
  const ball = document.createElement('span')
  ball.className = 'works-compact-ball'
  ball.setAttribute('aria-hidden', 'true')
  const compactLabel = document.createElement('span')
  compactLabel.textContent = 'go to the compact version'
  compact.append(ball, compactLabel)
  compact.addEventListener('click', () => strip.onCompact?.())

  const nav = document.createElement('div')
  nav.className = 'works-end-nav'

  if (previous) {
    const prev = document.createElement('button')
    prev.type = 'button'
    prev.className = 'works-prev'
    const prevArrow = document.createElement('span')
    prevArrow.className = 'works-prev-arrow'
    prevArrow.setAttribute('aria-hidden', 'true')
    const prevLabel = document.createElement('span')
    prevLabel.textContent = 'previous project'
    prev.append(prevArrow, prevLabel)
    prev.addEventListener('click', () => strip.onPrevious?.())
    nav.appendChild(prev)
  }

  const next = document.createElement('button')
  next.type = 'button'
  next.className = 'works-next'
  const nextLabel = document.createElement('span')
  nextLabel.textContent = refresh ? 'refresh all the website' : 'next project'
  next.appendChild(nextLabel)
  if (refresh) {
    next.classList.add('is-refresh')
    next.appendChild(refreshMark())
    next.addEventListener('click', () => strip.onRefresh?.())
    bar.append(compact, nav, next)
  } else {
    const arrow = document.createElement('span')
    arrow.className = 'works-next-arrow'
    arrow.setAttribute('aria-hidden', 'true')
    next.appendChild(arrow)
    next.addEventListener('click', () => strip.onNext?.())
    nav.appendChild(next)
    bar.append(compact, nav)
  }
  return bar
}

function refreshMark() {
  const mark = document.createElement('span')
  mark.className = 'works-refresh-mark'
  mark.setAttribute('aria-hidden', 'true')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  const stroke = 'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'
  svg.innerHTML = `<path d="M6.4 12.1a5.7 5.7 0 1 0 5.7-5.7 6.1 6.1 0 0 0-4.2 1.7L6.4 9.5" ${stroke}/><path d="M6.4 6.2v3.5h3.5" ${stroke}/>`
  mark.appendChild(svg)
  return mark
}

function scentMark(kind) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('works-palette-mark')
  svg.setAttribute('viewBox', '0 0 48 36')
  svg.setAttribute('aria-hidden', 'true')
  const stroke = 'stroke="#111111" stroke-width="1.15" fill="none" stroke-linecap="round"'
  svg.innerHTML = kind === 'day'
    ? `<circle cx="24" cy="13" r="4.5" ${stroke}/><path d="M24 4.5v2.6M15.2 13H12.4M35.6 13H33M17.2 6.6l1.8 1.8M30.8 6.6l-1.8 1.8M17.2 19.4l1.8-1.8M30.8 19.4l-1.8-1.8" ${stroke}/><path d="M11 27.5h26M15 31.5h18" ${stroke}/>`
    : `<path d="M30 7.5a9 9 0 1 0 0 16.5 7 7 0 1 1 0-16.5z" ${stroke}/><path d="M10 29c2.2-3.2 4.2-3.2 6.2 0 2-3.2 4-3.2 6.2 0" ${stroke}/>`
  return svg
}

function paletteColumn(kind, lines) {
  const col = document.createElement('div')
  col.className = 'works-palette-col'
  col.appendChild(scentMark(kind))
  lines.forEach((line) => {
    const p = document.createElement('p')
    p.textContent = line
    col.appendChild(p)
  })
  return col
}

function scentCopy(blocks) {
  const wrap = document.createElement('div')
  wrap.className = 'works-scent-copy'
  blocks.forEach((block) => {
    const note = document.createElement('section')
    note.className = 'works-scent-note'
    const label = document.createElement('p')
    label.className = `works-note-label is-${block.tone || 'rose'}`
    label.textContent = block.label
    const body = document.createElement('div')
    body.className = 'works-note-body'
    if (block.day || block.night) {
      body.classList.add('works-palette')
      body.append(paletteColumn('day', block.day || []), paletteColumn('night', block.night || []))
    } else {
      String(block.body || '')
        .split(/\n\n+/)
        .forEach((part) => {
          const p = document.createElement('p')
          p.innerHTML = part
          body.appendChild(p)
        })
    }
    note.append(label, body)
    wrap.appendChild(note)
  })
  return wrap
}

function shellCopy(copy) {
  const block = document.createElement('div')
  block.className = 'works-shell-copy'
  const label = document.createElement('p')
  label.className = 'works-note-label is-rose'
  label.textContent = copy.label
  const body = document.createElement('div')
  body.className = 'works-note-body'
  String(copy.body || '')
    .split(/\n\n+/)
    .forEach((part) => {
      const p = document.createElement('p')
      p.innerHTML = part
      body.appendChild(p)
    })
  block.append(label, body)
  return block
}

function phasesStory(frame) {
  const flow = document.createElement('div')
  flow.className = 'works-phases-flow'
  const copy = document.createElement('div')
  copy.className = 'works-phases-copy works-phases-screen'
  const label = document.createElement('p')
  label.className = 'works-note-label is-ink'
  label.textContent = frame.copy?.label || ''
  const body = document.createElement('div')
  body.className = 'works-note-body'
  String(frame.copy?.body || '')
    .split(/\n\n+/)
    .forEach((part) => {
      const p = document.createElement('p')
      p.innerHTML = part
      body.appendChild(p)
    })
  copy.append(label, body)
  flow.appendChild(copy)
  frame.steps.forEach((src) => {
    const screen = document.createElement('div')
    screen.className = 'works-phase works-phases-screen'
    const image = document.createElement('img')
    image.src = src
    image.alt = ''
    image.draggable = false
    screen.appendChild(image)
    flow.appendChild(screen)
  })
  for (let index = 0; index < frame.steps.length - 1; index += 1) {
    const arrow = document.createElement('div')
    arrow.className = 'works-phases-arrow'
    arrow.setAttribute('aria-hidden', 'true')
    const shaft = document.createElement('span')
    shaft.className = 'works-phases-arrow-shaft'
    const head = document.createElement('span')
    head.className = 'works-phases-arrow-head'
    arrow.append(shaft, head)
    flow.appendChild(arrow)
  }
  return flow
}

function finaleStory(frame) {
  const board = document.createElement('div')
  board.className = 'works-finale-board'
  frame.shots.forEach((shot) => {
    const figure = document.createElement('figure')
    figure.className = `works-finale-shot is-${shot.place}`
    const image = document.createElement('img')
    image.src = shot.src
    image.alt = ''
    image.draggable = false
    figure.appendChild(image)
    board.appendChild(figure)
  })
  const wrap = document.createElement('div')
  wrap.className = 'works-finale'
  wrap.appendChild(board)
  if (frame.measures) {
    const sheet = document.createElement('figure')
    sheet.className = 'works-finale-sheet'
    const drawing = document.createElement('img')
    drawing.src = frame.measures
    drawing.alt = ''
    drawing.draggable = false
    sheet.appendChild(drawing)
    wrap.appendChild(sheet)
  }
  return wrap
}

function frameHolds(frame) {
  const dwell = editorialHold(frame.role)
  if (dwell) return dwell
  if (frame.role === 'phases') return 1 + frame.steps.length
  if (frame.role === 'finale') return 3
  if (frame.role === 'zoom' || frame.role === 'filters' || frame.role === 'scent' || frame.role === 'shell') return 1
  return 0
}

function notesCopy(blocks) {
  const wrap = document.createElement('div')
  wrap.className = 'works-notes'
  blocks.forEach((block) => {
    const note = document.createElement('section')
    note.className = 'works-note'
    const label = document.createElement('p')
    label.className = `works-note-label is-${block.tone || 'rose'}`
    label.textContent = block.label
    const body = document.createElement('p')
    body.className = 'works-note-body'
    body.innerHTML = block.body
    note.append(label, body)
    wrap.appendChild(note)
  })
  return wrap
}

function readingCopy(className, copy) {
  const block = document.createElement('div')
  block.className = className
  const label = document.createElement('p')
  label.className = `works-note-label is-${copy.tone || 'rose'}`
  label.textContent = copy.label
  const body = document.createElement('div')
  body.className = 'works-note-body'
  String(copy.body || '')
    .split(/\n\n+/)
    .forEach((part) => {
      const p = document.createElement('p')
      p.innerHTML = part
      body.appendChild(p)
    })
  block.append(label, body)
  return block
}

function plainImage(src, className) {
  const img = document.createElement('img')
  img.src = src
  img.alt = ''
  img.draggable = false
  if (className) img.className = className
  return img
}

function materialsFrame(frame) {
  const section = document.createElement('section')
  section.className = 'works-frame is-materials'
  const kicker = document.createElement('p')
  kicker.className = 'works-materials-kicker'
  kicker.textContent = frame.label || 'Materials used'
  const list = document.createElement('div')
  list.className = 'works-materials-list'
  frame.items.forEach((item) => {
    const row = document.createElement('div')
    row.className = 'works-materials-row'
    const caption = document.createElement('p')
    caption.className = 'works-materials-caption'
    caption.textContent = item.text
    const photo = plainImage(item.src)
    if (item.fit) photo.style.objectFit = item.fit
    row.append(photo, caption)
    list.appendChild(row)
  })
  const sketches = document.createElement('div')
  sketches.className = 'works-materials-sketches'
  frame.sketches.forEach((sketch) => {
    sketches.appendChild(plainImage(sketch.src, `is-${sketch.place}`))
  })
  section.append(kicker, list, sketches)
  return section
}

function samplesFrame(frame) {
  const section = document.createElement('section')
  section.className = 'works-frame is-samples'
  const wrap = document.createElement('div')
  wrap.className = 'works-samples'
  const label = document.createElement('p')
  label.className = 'works-note-label is-rose'
  label.textContent = frame.label || 'Materials used'
  const grid = document.createElement('div')
  grid.className = 'works-samples-grid'
  frame.items.forEach((item) => {
    const card = document.createElement('div')
    card.className = 'works-samples-item'
    const copy = document.createElement('div')
    copy.className = 'works-samples-copy'
    const name = document.createElement('p')
    name.className = 'works-samples-name'
    name.textContent = item.name
    copy.appendChild(name)
    if (item.detail) {
      const detail = document.createElement('p')
      detail.className = 'works-samples-detail'
      detail.textContent = item.detail
      copy.appendChild(detail)
    }
    card.append(plainImage(item.src), copy)
    grid.appendChild(card)
  })
  wrap.append(label, grid)
  section.appendChild(wrap)
  return section
}

function ideaFrame(frame, { reducedMotion = false } = {}) {
  const section = document.createElement('section')
  section.className = 'works-frame is-idea'
  const stage = document.createElement('div')
  stage.className = 'works-idea-stage'
  stage.tabIndex = 0
  stage.setAttribute('aria-label', 'Spiraluma, drag to turn')
  section.appendChild(stage)
  if (frame.copy) section.appendChild(readingCopy('works-idea-copy', frame.copy))
  section.turn = new SnailTurn(stage, frame.model, { reducedMotion })
  return section
}

function processFrame(frame) {
  const section = document.createElement('section')
  section.className = 'works-frame is-process'
  const shot = document.createElement('figure')
  shot.className = 'works-process-shot'
  const img = document.createElement('img')
  img.src = frame.src
  img.alt = ''
  img.draggable = false
  if (frame.focus) img.style.objectPosition = frame.focus
  shot.appendChild(img)
  section.appendChild(shot)
  if (frame.copy) section.appendChild(readingCopy('works-process-copy', frame.copy))
  return section
}

function stickerFrame(frame, options = {}) {
  const section = document.createElement('section')
  section.className = 'works-frame is-sticker'
  const mark = document.createElement('figure')
  mark.className = 'works-sticker'
  const img = document.createElement('img')
  img.src = frame.src
  img.alt = ''
  img.draggable = false
  mark.appendChild(img)
  section.appendChild(mark)
  if (frame.copy) section.appendChild(readingCopy('works-sticker-copy', frame.copy))
  section.adhesion = new StickerAdhesion(mark, frame.src, {
    reducedMotion: Boolean(options.reducedMotion),
  })
  return section
}

function postersFrame(frame) {
  const section = document.createElement('section')
  section.className = 'works-frame is-posters'
  if (frame.copy) section.appendChild(readingCopy('works-posters-copy', frame.copy))
  ;(frame.shots || []).forEach((shot) => {
    const card = document.createElement('div')
    card.className = 'works-poster'
    card.dataset.poster = shot.id
    card.tabIndex = 0
    card.setAttribute('role', 'button')
    card.setAttribute('aria-label', shot.label || 'Open poster')
    card.setAttribute('aria-expanded', 'false')
    const sheet = document.createElement('div')
    sheet.className = 'works-poster-sheet'
    const img = document.createElement('img')
    img.src = shot.src
    img.alt = ''
    img.draggable = false
    sheet.appendChild(img)
    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'works-poster-close'
    close.setAttribute('aria-label', 'Close')
    close.hidden = true
    close.textContent = '×'
    card.append(sheet, close)
    section.appendChild(card)
  })
  section.fan = new PosterFan(section)
  return section
}

function totemFrame(frame) {
  const section = document.createElement('section')
  section.className = 'works-frame is-totem'
  if (frame.copy) section.appendChild(readingCopy('works-totem-copy', frame.copy))
  const shot = document.createElement('figure')
  shot.className = 'works-totem'
  const img = document.createElement('img')
  img.src = frame.src
  img.alt = ''
  img.draggable = false
  shot.appendChild(img)
  section.appendChild(shot)
  return section
}

function layerFrame(frame) {
  const section = document.createElement('section')
  section.className = 'works-frame is-layer'
  if (frame.copy) section.appendChild(readingCopy('works-layer-copy', frame.copy))
  const steps = document.createElement('figure')
  steps.className = 'works-layer-steps'
  const stepsImg = document.createElement('img')
  stepsImg.src = frame.steps
  stepsImg.alt = ''
  stepsImg.draggable = false
  steps.appendChild(stepsImg)
  const phone = document.createElement('figure')
  phone.className = 'works-layer-phone'
  const phoneImg = document.createElement('img')
  phoneImg.src = frame.phone
  phoneImg.alt = ''
  phoneImg.draggable = false
  phone.appendChild(phoneImg)
  section.append(steps, phone)
  return section
}

function evolveFrame(frame, options = {}) {
  const section = document.createElement('section')
  section.className = 'works-frame is-evolve'
  if (options.reducedMotion) section.classList.add('is-calm')
  const stage = document.createElement('div')
  stage.className = 'works-evolve-stage'
  ;(frame.phases || []).forEach((phase, index) => {
    const piece = document.createElement('figure')
    piece.className = 'works-evolve-piece'
    piece.style.left = phase.left
    piece.style.top = phase.top
    piece.style.width = phase.width
    piece.style.setProperty('--i', String(index))
    piece.appendChild(plainImage(phase.src))
    stage.appendChild(piece)
  })
  section.appendChild(stage)
  if (frame.copy) section.appendChild(readingCopy('works-evolve-copy', frame.copy))
  return section
}

function productFrame(frame) {
  const section = document.createElement('section')
  section.className = 'works-frame is-product'
  const sketches = plainImage(frame.sketches, 'works-product-sketches')
  const boltsClip = document.createElement('div')
  boltsClip.className = 'works-product-bolts-clip'
  const bolts = document.createElement('figure')
  bolts.className = 'works-product-bolts'
  bolts.appendChild(plainImage(frame.bolts))
  boltsClip.appendChild(bolts)
  const animal = document.createElement('figure')
  animal.className = 'works-product-animal'
  animal.appendChild(plainImage(frame.animal))
  section.append(sketches, boltsClip, animal)
  if (frame.copy) section.appendChild(readingCopy('works-product-copy', frame.copy))
  return section
}

function boardFrame(frame) {
  const section = document.createElement('section')
  section.className = 'works-frame is-board'
  const sheet = document.createElement('figure')
  sheet.className = 'works-board'
  const img = document.createElement('img')
  img.src = frame.src
  img.alt = ''
  img.draggable = false
  sheet.appendChild(img)
  section.appendChild(sheet)
  return section
}

function supportsFrame(frame) {
  const section = document.createElement('section')
  section.className = 'works-frame is-supports'
  if (frame.copy) section.appendChild(readingCopy('works-supports-copy', frame.copy))
  const train = document.createElement('div')
  train.className = 'works-supports-train'
  ;(frame.shots || []).forEach((shot) => {
    const figure = document.createElement('figure')
    figure.className = 'works-supports-shot'
    const img = document.createElement('img')
    img.src = shot.src
    img.alt = ''
    img.draggable = false
    if (shot.focus) img.style.objectPosition = shot.focus
    figure.appendChild(img)
    train.appendChild(figure)
  })
  section.appendChild(train)
  return section
}

const SKY_GLOWS = [
  { x: 16, y: 28, size: 28 },
  { x: 76, y: 16, size: 22 },
  { x: 86, y: 64, size: 30 },
  { x: 24, y: 78, size: 24 },
  { x: 60, y: 74, size: 18 },
]

function skyGlow(className) {
  const glow = document.createElement('span')
  glow.className = `works-sky-glow ${className}`
  glow.setAttribute('aria-hidden', 'true')
  return glow
}

function skyFrame(frame, options = {}) {
  const section = document.createElement('section')
  section.className = 'works-frame is-sky'
  if (options.reducedMotion) section.classList.add('is-calm')
  const field = document.createElement('div')
  field.className = 'works-sky-field'
  SKY_GLOWS.forEach((light, index) => {
    const glow = skyGlow('is-awake')
    glow.style.left = `${light.x}%`
    glow.style.top = `${light.y}%`
    glow.style.width = `${light.size}vmin`
    glow.style.animationDelay = `${-index * 1.35}s`
    field.appendChild(glow)
  })
  const trail = Array.from({ length: 4 }, (_, index) => {
    const glow = skyGlow('is-trail')
    glow.style.width = `${20 - index * 2.4}vmin`
    field.appendChild(glow)
    return { el: glow, x: 0.5, y: 0.5, on: 0, placed: false }
  })
  const title = document.createElement('p')
  title.className = 'works-sky-title'
  title.textContent = frame.title || 'Firmamento'
  section.append(field, title)
  section.sky = { pointer: null, inside: false, trail }
  const place = (event) => {
    const box = section.getBoundingClientRect()
    if (!box.width || !box.height) return
    section.sky.pointer = {
      x: (event.clientX - box.left) / box.width,
      y: (event.clientY - box.top) / box.height,
    }
    section.sky.inside = true
  }
  section.addEventListener('pointerdown', place)
  section.addEventListener('pointermove', place)
  section.addEventListener('pointerleave', () => {
    section.sky.inside = false
  })
  return section
}

function paintSky(frame) {
  if (!frame?.sky) return
  const next = skyTrailStep(
    frame.sky.trail,
    frame.sky.pointer,
    frame.sky.inside,
    frame.classList.contains('is-calm'),
  )
  next.forEach((light, index) => {
    const node = frame.sky.trail[index]
    node.x = light.x
    node.y = light.y
    node.on = light.on
    node.placed = light.placed
    node.el.style.left = `${light.x * 100}%`
    node.el.style.top = `${light.y * 100}%`
    node.el.style.opacity = (light.on * (0.9 - index * 0.14)).toFixed(3)
  })
}

function reelFrame(frame, options = {}) {
  const section = document.createElement('section')
  section.className = 'works-frame is-reel'
  const video = document.createElement('video')
  video.className = 'works-reel'
  video.src = frame.src
  video.autoplay = true
  video.loop = true
  video.playsInline = true
  video.muted = false
  video.preload = 'auto'
  video.tabIndex = -1
  video.setAttribute('playsinline', '')
  video.disablePictureInPicture = true

  const field = document.createElement('div')
  field.className = 'works-reel-trail'
  const sources = Array.isArray(frame.stills) ? frame.stills : []
  let deck = reelDeck(sources)
  let drops = []
  let pick = 0
  let pointer = null
  const nodes = new Map()

  const clearTrail = () => {
    drops = []
    pointer = null
    nodes.forEach((img) => img.remove())
    nodes.clear()
  }

  const trace = (now) => {
    const box = section.getBoundingClientRect()
    const still = reelStillBox(box.width, box.height, video.videoWidth, video.videoHeight)
    const gap = box.width > 0 ? (still.width / box.width) * 0.62 : 0.12
    const step = reelTrailStep(drops, pointer, now, deck, pick, { life: reelTrailLife, gap })
    drops = step.drops
    pick = step.pick
    const keep = new Set(drops)
    nodes.forEach((img, drop) => {
      if (keep.has(drop)) return
      img.remove()
      nodes.delete(drop)
    })
    drops.forEach((drop) => {
      let img = nodes.get(drop)
      if (!img) {
        img = document.createElement('img')
        img.className = 'works-reel-still'
        img.alt = ''
        img.draggable = false
        img.decoding = 'async'
        img.src = drop.src
        field.appendChild(img)
        nodes.set(drop, img)
      }
      const ready = img.complete && img.naturalWidth > 0
      if (ready && !drop.seen) {
        drop.seen = true
        drop.born = now
      }
      const fade = drop.seen ? reelTrailFade(now - drop.born, reelTrailLife, options.reducedMotion) : 0
      img.style.width = `${still.width}px`
      img.style.height = `${still.height}px`
      img.style.left = `${drop.x * 100}%`
      img.style.top = `${drop.y * 100}%`
      img.style.opacity = fade.toFixed(3)
    })
  }

  section.addEventListener('pointermove', (event) => {
    const box = section.getBoundingClientRect()
    if (!box.width || !box.height) return
    pointer = {
      x: (event.clientX - box.left) / box.width,
      y: (event.clientY - box.top) / box.height,
    }
  })
  section.addEventListener('pointerleave', () => {
    pointer = null
  })

  let held = Boolean(options.reducedMotion)

  const start = () => {
    const pending = video.play()
    if (!pending?.catch) return
    pending.catch(() => {
      if (video.muted) return
      video.muted = true
      video.play().catch(() => {})
    })
  }

  section.reel = {
    sync(showing) {
      if (!showing) clearTrail()
      if (showing && !held) {
        if (video.paused) start()
      } else if (!video.paused) {
        video.pause()
      }
    },
    paint(now) {
      trace(now)
    },
    reset() {
      held = Boolean(options.reducedMotion)
      video.muted = false
      video.pause()
      try {
        video.currentTime = 0
      } catch {
        /* the file may not be ready yet */
      }
      deck = reelDeck(sources)
      pick = 0
      clearTrail()
    },
  }

  const hint = document.createElement('p')
  hint.className = 'works-reel-hint'
  hint.textContent = 'move your cursor to see more pics of the event'
  section.append(video, field, hint)
  return section
}

function filmIcon(muted) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  const add = (tag, attrs) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag)
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value))
    svg.appendChild(node)
  }
  add('path', { d: 'M4.5 9.4h3.1L12.2 5.6v12.8l-4.6-3.8H4.5z', fill: 'currentColor' })
  if (muted) {
    add('path', {
      d: 'M16 8.4l5 7.2M21 8.4l-5 7.2',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
    })
  } else {
    add('path', {
      d: 'M15.6 9.1c1.5 1.1 1.5 4.7 0 5.8',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
    })
  }
  return svg
}

function filmFrame(frame, options = {}) {
  const section = document.createElement('section')
  section.className = 'works-frame is-film'
  const video = document.createElement('video')
  video.className = 'works-film'
  video.src = frame.src
  video.autoplay = true
  video.loop = true
  video.playsInline = true
  video.muted = true
  video.preload = 'auto'
  video.tabIndex = -1
  video.setAttribute('playsinline', '')
  video.disablePictureInPicture = true

  const mute = document.createElement('button')
  mute.type = 'button'
  mute.className = 'works-film-mute'

  const paint = () => {
    mute.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Mute')
    mute.setAttribute('aria-pressed', video.muted ? 'true' : 'false')
    mute.replaceChildren(filmIcon(video.muted))
  }

  let held = Boolean(options.reducedMotion)

  const start = () => {
    const pending = video.play()
    if (!pending?.catch) return
    pending.catch(() => {
      if (video.muted) return
      video.muted = true
      paint()
      video.play().catch(() => {})
    })
  }

  mute.addEventListener('click', (event) => {
    event.stopPropagation()
    video.muted = !video.muted
    if (!video.muted && !held) start()
    paint()
  })

  section.film = {
    sync(showing) {
      if (showing && !held) {
        if (video.paused) start()
      } else if (!video.paused) {
        video.pause()
      }
    },
    reset() {
      held = Boolean(options.reducedMotion)
      video.muted = true
      video.pause()
      try {
        video.currentTime = 0
      } catch {
        /* the file may not be ready yet */
      }
      paint()
    },
  }

  section.append(video, mute)
  paint()
  return section
}

function storyFrame(frame, options = {}) {
  if (frame.role === 'toy') return toyFrame(frame, options)
  if (frame.role === 'hang') return hangFrame(options)
  if (frame.role === 'reel') return reelFrame(frame, options)
  if (frame.role === 'film') return filmFrame(frame, options)
  if (frame.role === 'sky') return skyFrame(frame, options)
  if (frame.role === 'idea') return ideaFrame(frame, options)
  if (frame.role === 'process') return processFrame(frame)
  if (frame.role === 'supports') return supportsFrame(frame)
  if (frame.role === 'board') return boardFrame(frame)
  if (frame.role === 'sticker') return stickerFrame(frame, options)
  if (frame.role === 'posters') return postersFrame(frame)
  if (frame.role === 'totem') return totemFrame(frame)
  if (frame.role === 'layer') return layerFrame(frame)
  if (frame.role === 'product') return productFrame(frame)
  if (frame.role === 'evolve') return evolveFrame(frame, options)
  const section = document.createElement('section')
  section.className = `works-frame is-${frame.role}`
  if (frame.role === 'phases') {
    section.appendChild(phasesStory(frame))
    return section
  }
  if (frame.role === 'finale') {
    section.appendChild(finaleStory(frame))
    return section
  }
  if (frame.role === 'materials') return materialsFrame(frame)
  if (frame.role === 'samples') return samplesFrame(frame)
  const img = document.createElement('img')
  img.src = frame.src
  img.alt = ''
  img.draggable = false
  if (frame.focus) img.style.objectPosition = frame.focus
  if (frame.role === 'object') {
    const turn = document.createElement('div')
    turn.className = 'works-turn'
    const applyTurn = () => {
      if (!img.naturalWidth || !img.naturalHeight) return
      turn.style.setProperty('--aspect', String(img.naturalWidth / img.naturalHeight))
    }
    img.addEventListener('load', applyTurn)
    if (img.complete) applyTurn()
    turn.appendChild(img)
    section.appendChild(turn)
    if (frame.copy) section.appendChild(contextCopy(frame.copy))
    return section
  }
  if (frame.role === 'zoom') {
    const zoom = document.createElement('div')
    zoom.className = 'works-zoom'
    zoom.appendChild(img)
    section.appendChild(zoom)
    if (frame.blocks) section.appendChild(notesCopy(frame.blocks))
    return section
  }
  if (frame.role === 'filters') {
    const shot = document.createElement('div')
    shot.className = 'works-filters-shot'
    shot.appendChild(img)
    const pin = document.createElement('button')
    pin.type = 'button'
    pin.className = 'works-filters-pin'
    pin.setAttribute('aria-expanded', 'false')
    const pinLabel = document.createElement('span')
    pinLabel.className = 'works-filters-pin-label'
    pinLabel.textContent = 'click to see filters detail'
    const dot = document.createElement('span')
    dot.className = 'works-filters-pin-dot'
    pin.append(pinLabel, dot)
    shot.appendChild(pin)

    const detail = document.createElement('img')
    detail.className = 'works-filters-detail'
    detail.src = frame.detail
    detail.alt = ''
    detail.draggable = false

    const text = document.createElement('div')
    text.className = 'works-filters-text'
    String(frame.copy?.body || '')
      .split(/\n\n+/)
      .forEach((part, index) => {
        const p = document.createElement('p')
        if (index === 0) p.className = 'works-filters-title'
        p.innerHTML = part
        text.appendChild(p)
      })
    const side = document.createElement('div')
    side.className = 'works-filters-side'
    side.appendChild(text)

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.classList.add('works-filters-line')
    svg.setAttribute('aria-hidden', 'true')
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    svg.appendChild(line)

    const drawLine = () => {
      const frameBox = section.getBoundingClientRect()
      const dotBox = dot.getBoundingClientRect()
      const detailBox = detail.getBoundingClientRect()
      const x1 = dotBox.left + dotBox.width / 2 - frameBox.left
      const y1 = dotBox.top + dotBox.height / 2 - frameBox.top
      const x2 = detailBox.left - frameBox.left
      const y2 = detailBox.top + detailBox.height * 0.42 - frameBox.top
      line.setAttribute('x1', String(x1))
      line.setAttribute('y1', String(y1))
      line.setAttribute('x2', String(x2))
      line.setAttribute('y2', String(y2))
      const length = Math.hypot(x2 - x1, y2 - y1)
      line.style.strokeDasharray = String(length)
      line.style.strokeDashoffset = String(length)
      requestAnimationFrame(() => {
        line.style.transition = 'stroke-dashoffset 0.45s ease'
        line.style.strokeDashoffset = '0'
      })
    }

    pin.addEventListener('click', (event) => {
      event.stopPropagation()
      const open = section.classList.toggle('is-open')
      pin.setAttribute('aria-expanded', open ? 'true' : 'false')
      if (!open) {
        line.style.transition = 'none'
        line.setAttribute('x2', line.getAttribute('x1') || '0')
        line.setAttribute('y2', line.getAttribute('y1') || '0')
        return
      }
      requestAnimationFrame(drawLine)
    })

    section.append(shot, detail, side, svg)
    return section
  }
  if (frame.role === 'scent') {
    const shot = document.createElement('div')
    shot.className = 'works-scent-shot'
    shot.appendChild(img)
    section.appendChild(shot)
    if (frame.blocks) section.appendChild(scentCopy(frame.blocks))
    return section
  }
  if (frame.role === 'shell') {
    const shot = document.createElement('div')
    shot.className = 'works-shell'
    shot.appendChild(img)
    section.appendChild(shot)
    if (frame.copy) section.appendChild(shellCopy(frame.copy))
    return section
  }
  if (frame.role === 'concept') {
    const shot = document.createElement('div')
    shot.className = 'works-concept-shot'
    img.className = 'works-concept-drawing'
    shot.appendChild(img)
    if (frame.logo) shot.appendChild(plainImage(frame.logo, 'works-concept-logo'))
    section.append(shot)
    if (frame.copy) section.appendChild(readingCopy('works-concept-copy', frame.copy))
    return section
  }
  if (frame.role === 'stage') {
    if (frame.copy) section.appendChild(readingCopy('works-stage-copy', frame.copy))
    const shot = document.createElement('figure')
    shot.className = 'works-stage-shot'
    shot.appendChild(img)
    section.appendChild(shot)
    return section
  }
  if (frame.role === 'parterre') {
    const shot = document.createElement('figure')
    shot.className = 'works-parterre-shot'
    shot.appendChild(img)
    section.appendChild(shot)
    if (frame.copy) section.appendChild(readingCopy('works-parterre-copy', frame.copy))
    return section
  }
  section.appendChild(img)
  return section
}

function setFade(nodes, value) {
  const opacity = value.toFixed(3)
  nodes.forEach((node) => {
    node.style.opacity = opacity
  })
}

function paintEditorial(item, story, height) {
  const timeline = editorialTimeline(story, item.holds)
  item.videoGate = { onVideo: false, audible: false }
  item.track.style.transform = `translate3d(0, ${timeline.shift * height}px, 0)`
  const frames = [...item.track.querySelectorAll(':scope > .works-frame')]
  frames.forEach((frame, index) => {
    const state = timeline.frames[index]
    if (!state) return
    if (frame.classList.contains('is-reel') || frame.classList.contains('is-film')) {
      const next = timeline.frames[index + 1]
      const showing = state.arrive >= 0.98 && (!next || next.arrive < 0.5)
      const hold = lensHoldsMedia(
        frame.closest('.works.is-lens'),
        frame.closest('.works.is-opening'),
      )
      const onVideo = showing && !hold
      frame.reel?.sync(onVideo)
      frame.film?.sync(onVideo)
      if (onVideo) {
        const video = frame.querySelector('video')
        item.videoGate = { onVideo: true, audible: Boolean(video) && !video.muted }
        frame.reel?.paint(performance.now())
      }
      return
    }
    if (frame.classList.contains('is-hang')) {
      frame.hang?.sync(hangInView(timeline.shift, index))
      return
    }
    if (frame.classList.contains('is-idea')) {
      setFade(frame.querySelectorAll('.works-note-label, .works-note-body'), editorialIn(state.dwell, 0.08, 0.34))
      return
    }
    if (frame.classList.contains('is-process')) {
      setFade(frame.querySelectorAll('.works-note-label, .works-note-body'), editorialIn(state.dwell, 0.08, 0.34))
      const shot = frame.querySelector('.works-process-shot')
      if (shot) shot.style.setProperty('--rise', editorialIn(state.dwell, 0.1, 0.72).toFixed(4))
      return
    }
    if (frame.classList.contains('is-supports')) {
      setFade(frame.querySelectorAll('.works-note-label, .works-note-body'), editorialIn(state.dwell, 0.08, 0.34))
      const train = frame.querySelector('.works-supports-train')
      if (train) train.style.setProperty('--in', editorialIn(state.dwell, 0.16, 0.82).toFixed(4))
      return
    }
    if (frame.classList.contains('is-board')) {
      const sheet = frame.querySelector('.works-board')
      if (sheet) sheet.style.setProperty('--in', state.dwell.toFixed(4))
      return
    }
    if (frame.classList.contains('is-sticker')) {
      setFade(frame.querySelectorAll('.works-note-label, .works-note-body'), editorialIn(state.dwell, 0.06, 0.32))
      frame.adhesion?.setDwell(state.dwell)
      return
    }
    if (frame.classList.contains('is-posters')) {
      const landed = state.arrive >= 0.92 || state.dwell > 0
      frame.fan?.setLanded(landed)
      setFade(frame.querySelectorAll('.works-note-label, .works-note-body'), landed ? 1 : 0)
      return
    }
    if (frame.classList.contains('is-totem')) {
      const shot = frame.querySelector('.works-totem')
      if (shot) shot.style.setProperty('--in', totemFade(state.dwell).toFixed(4))
      setFade(frame.querySelectorAll('.works-note-label, .works-note-body'), editorialIn(state.arrive, 0.25, 1))
      return
    }
    if (frame.classList.contains('is-layer')) {
      const steps = frame.querySelector('.works-layer-steps')
      const phone = frame.querySelector('.works-layer-phone')
      if (steps) steps.style.setProperty('--in', layerStepsFade(state.dwell).toFixed(4))
      if (phone) phone.style.setProperty('--in', layerPhoneFade(state.dwell).toFixed(4))
      setFade(frame.querySelectorAll('.works-note-label, .works-note-body'), editorialIn(state.arrive, 0.25, 1))
      return
    }
    if (frame.classList.contains('is-product')) {
      const rush = productRush(state.dwell).toFixed(4)
      const bolts = frame.querySelector('.works-product-bolts')
      const animal = frame.querySelector('.works-product-animal')
      if (bolts) bolts.style.setProperty('--in', rush)
      if (animal) animal.style.setProperty('--in', rush)
      setFade(
        frame.querySelectorAll('.works-note-label, .works-note-body'),
        editorialIn(state.dwell, 0.28, 0.62),
      )
      return
    }
    if (frame.classList.contains('is-toy')) {
      const next = timeline.frames[index + 1]
      const showing = state.arrive >= 0.98 && (!next || next.arrive < 0.5)
      const lens = Boolean(frame.closest('.works.is-lens'))
      frame.toy?.sync(showing, { interactive: showing && !lens })
      return
    }
    if (frame.classList.contains('is-evolve')) {
      frame.querySelectorAll('.works-evolve-piece').forEach((piece, index) => {
        piece.style.setProperty('--in', evolveIn(state.dwell, index).toFixed(4))
      })
      setFade(
        frame.querySelectorAll('.works-note-label, .works-note-body'),
        editorialIn(state.dwell, 0.04, 0.26),
      )
      return
    }
    if (frame.classList.contains('is-concept') || frame.classList.contains('is-parterre')) {
      setFade(frame.querySelectorAll('.works-note-label, .works-note-body'), editorialRead(state.dwell))
      return
    }
    if (frame.classList.contains('is-stage')) {
      const shot = frame.querySelector('.works-stage-shot')
      if (shot) shot.style.setProperty('--in', editorialIn(state.dwell, 0.04, 0.58).toFixed(4))
      setFade(frame.querySelectorAll('.works-note-label, .works-note-body'), editorialIn(state.arrive, 0.22, 1))
      return
    }
    if (frame.classList.contains('is-materials')) {
      frame.querySelectorAll('.works-materials-caption').forEach((caption, captionIndex) => {
        const start = 0.04 + captionIndex * 0.22
        caption.style.opacity = editorialIn(state.dwell, start, start + 0.36).toFixed(3)
      })
      frame.querySelectorAll('.works-materials-sketches img').forEach((sketch, sketchIndex) => {
        const start = 0.06 + sketchIndex * 0.28
        sketch.style.setProperty('--in', editorialIn(state.dwell, start, start + 0.42).toFixed(4))
      })
      return
    }
    if (frame.classList.contains('is-samples')) {
      const title = frame.querySelector('.works-note-label')
      if (title) title.style.opacity = editorialIn(state.arrive, 0.2, 1).toFixed(3)
      frame.querySelectorAll('.works-samples-copy').forEach((copy, copyIndex) => {
        const start = 0.04 + copyIndex * 0.16
        copy.style.opacity = editorialIn(state.dwell, start, start + 0.34).toFixed(3)
      })
    }
  })
  const dwell = timeline.frames.at(-1)?.dwell ?? 0
  const end =
    item.roles.at(-1) === 'board'
      ? dwell
      : item.roles.at(-1) === 'evolve'
        ? editorialIn(dwell, 0.78, 1)
        : editorialIn(dwell, 0.12, 0.72)
  const reading = Boolean(item.track.querySelector('.works-frame.is-posters.is-reading'))
  const postersIn = Boolean(item.track.querySelector('.works-frame.is-posters.is-set'))
  item.slide.querySelectorAll('.works-cue').forEach((cue) => {
    cue.style.opacity = reading || postersIn ? '0' : (1 - end).toFixed(3)
  })
  item.slide.querySelectorAll('.works-end').forEach((bar) => {
    bar.style.opacity = end.toFixed(3)
    bar.classList.toggle('is-live', end > 0.45)
    bar.setAttribute('aria-hidden', end > 0.45 ? 'false' : 'true')
  })
  return editorialOnPaper(story, item.holds, item.roles)
}

export class WorksStrip {
  constructor(root, projects, { reducedMotion = false, onNext, onPrevious, onCompact, onRefresh, onSoundtrack } = {}) {
    this.root = root
    this.slides = []
    this.reducedMotion = reducedMotion
    this.onNext = onNext
    this.onPrevious = onPrevious
    this.onCompact = onCompact
    this.onRefresh = onRefresh
    this.onSoundtrack = onSoundtrack
    this.openId = null
    this.lensId = null
    this.story = 0
    this.storyTarget = 0
    if (!root) return

    projects.forEach((project) => {
      const slide = document.createElement('article')
      slide.className = 'works-slide'
      slide.dataset.projectId = project.id
      slide.hidden = true

      if (storyScrolls(project)) {
        const track = document.createElement('div')
        track.className = 'works-story'
        const frames = projectFrames(project)
        frames.forEach((frame) =>
          track.appendChild(
            storyFrame(frame, {
              reducedMotion: this.reducedMotion,
              onAdvance: () => this.advance(),
            }),
          ),
        )
        slide.append(track, scrollCue())
        const roles = frames.map((frame) => frame.role)
        const endNav = storyEndNav(roles)
        if (endNav) {
          const end = storyEnd(this, { previous: endNav.previous, refresh: endNav.refresh })
          if (endNav.finale) end.classList.add('is-finale')
          if (endNav.photo) end.classList.add('is-photo')
          slide.appendChild(end)
        }
        const holds = frames.reduce((sum, frame) => sum + frameHolds(frame), 0)
        root.append(slide)
        this.slides.push({
          slide,
          track,
          id: project.id,
          story: true,
          editorial: roles.some((role) => editorialHold(role) > 0),
          holds: roles.map((role) => editorialHold(role)),
          roles,
          frameCount: frames.length,
          scrollFrames: frames.length + holds,
        })
        return
      }

      const media = document.createElement('div')
      media.className = 'works-media'
      const img = document.createElement('img')
      img.src = project.image
      img.alt = project.title
      img.draggable = false
      img.style.objectPosition = worksImageFocus(project)
      media.appendChild(img)

      const caption = document.createElement('div')
      caption.className = 'works-caption'
      const title = document.createElement('h2')
      title.className = 'works-title'
      title.textContent = project.title
      caption.append(title)
      worksCaptionLines(project).forEach((line) => {
        const p = document.createElement('p')
        p.className = 'works-line'
        p.textContent = line
        caption.append(p)
      })

      slide.append(media, caption)
      root.append(slide)
      this.slides.push({ slide, media, caption, id: project.id, story: false, frameCount: 1 })
    })
  }

  open(id) {
    if (id === this.openId && !this.lensId) return
    const continuing = Boolean(id) && id === this.lensId
    this.dismissPoster()
    this.openId = id
    this.lensId = null
    if (!continuing) {
      this.story = 0
      this.storyTarget = 0
    }
    if (!id) return
    const item = this.slides.find((slide) => slide.id === id)
    if (!continuing) {
      item?.track?.querySelectorAll('.works-frame.is-reel').forEach((frame) => frame.reel?.reset())
      item?.track?.querySelectorAll('.works-frame.is-film').forEach((frame) => frame.film?.reset())
      item?.track?.querySelectorAll('.works-frame.is-toy').forEach((frame) => frame.toy?.reset())
    }
    item?.track?.querySelectorAll('.works-frame.is-idea').forEach((frame) => frame.turn?.wake())
    item?.track?.querySelectorAll('.works-frame.is-sticker').forEach((frame) => frame.adhesion?.wake())
  }

  armLens(id) {
    if (this.lensId === id && this.openId == null) return
    this.openId = null
    this.lensId = id
    this.story = 0
    this.storyTarget = 0
    const item = this.slides.find((slide) => slide.id === id)
    item?.track?.querySelectorAll('.works-frame.is-reel').forEach((frame) => {
      frame.reel?.reset()
      const video = frame.querySelector('video')
      if (video) video.muted = true
    })
    item?.track?.querySelectorAll('.works-frame.is-film').forEach((frame) => frame.film?.reset())
    item?.track?.querySelectorAll('.works-frame.is-toy').forEach((frame) => frame.toy?.reset())
  }

  primeReel(id) {
    const item = this.slides.find((slide) => slide.id === id)
    item?.track?.querySelectorAll('.works-frame.is-reel video').forEach((video) => {
      video.muted = false
      const pending = video.play()
      pending?.catch?.(() => {
        video.muted = true
        video.play()?.catch?.(() => {})
      })
    })
    item?.track?.querySelectorAll('.works-frame.is-film video').forEach((video) => {
      if (!video.paused) return
      video.play()?.catch?.(() => {})
    })
  }

  canNudge() {
    return Boolean(this.slides.find((item) => item.id === this.openId && item.story))
  }

  advance() {
    const item = this.slides.find((slide) => slide.id === this.openId && slide.story)
    if (!item) return
    this.storyTarget = storyScroll(this.storyTarget, storySpan, item.scrollFrames || item.frameCount)
  }

  dismissPoster() {
    const item = this.slides.find((slide) => slide.id === this.openId)
    const frame = item?.track?.querySelector('.works-frame.is-posters.is-reading')
    if (!frame?.fan) return false
    return frame.fan.close()
  }

  nudge(deltaY, deltaMode = 0) {
    const item = this.slides.find((slide) => slide.id === this.openId && slide.story)
    if (!item) return false
    if (item.track?.querySelector('.works-poster.is-open')) return true
    const height = this.root?.clientHeight || window.innerHeight || 1
    this.storyTarget = storyScroll(
      this.storyTarget,
      storyDelta(deltaY, deltaMode, height),
      item.scrollFrames || item.frameCount,
    )
    return true
  }

  update(openId, previewId = null, opening = false) {
    if (!this.root) return
    let videoGate = { onVideo: false, audible: false }
    const lens = Boolean(previewId) && !openId
    if (openId) this.open(openId)
    else if (lens) this.armLens(previewId)
    else this.open(null)
    const shown = openId || previewId || null
    const open = Boolean(shown)
    this.root.hidden = !open
    this.root.classList.toggle('is-lens', lens)
    this.root.classList.toggle('is-opening', lens && opening)
    this.root.style.opacity = open ? '1' : '0'
    const height = this.root.clientHeight || window.innerHeight || 1
    this.story = this.reducedMotion ? this.storyTarget : lerp(this.story, this.storyTarget, 0.14)

    this.slides.forEach((item) => {
      const visible = item.id === shown
      item.slide.hidden = !visible
      if (!visible) {
        item.track?.querySelectorAll('.works-frame.is-reel').forEach((frame) => frame.reel?.sync(false))
        item.track?.querySelectorAll('.works-frame.is-film').forEach((frame) => frame.film?.sync(false))
        item.track?.querySelectorAll('.works-frame.is-hang').forEach((frame) => frame.hang?.sync(false))
        item.track?.querySelectorAll('.works-frame.is-toy').forEach((frame) => frame.toy?.sync(false))
      }
      item.slide.style.transform = 'none'
      if (item.media) item.media.style.transform = 'none'
      if (item.caption) item.caption.style.transform = 'none'
      if (item.track && visible) {
        item.track.style.height = `${item.frameCount * height}px`
        item.track.querySelectorAll('.works-frame').forEach((frame) => {
          frame.style.height = `${height}px`
        })
        if (item.editorial) {
          item.paper = paintEditorial(item, this.story, height)
          if (item.videoGate?.onVideo) videoGate = item.videoGate
          item.track.querySelectorAll('.works-frame.is-idea').forEach((frame) => frame.turn?.render())
          return
        }
        const hasSky = Boolean(item.track.querySelector('.works-frame.is-sky'))
        const hasFilters = Boolean(item.track.querySelector('.works-frame.is-filters'))
        const page = hasSky ? Math.max(0, this.story - storySpan) : this.story
        const skyIn = hasSky ? Math.min(1, this.story / storySpan) : 0
        const slides = Math.max(0, item.frameCount - 1)
        const shift = hasFilters
          ? storyBoardShift(page) - skyIn
          : this.story
            ? -Math.min(this.story / storySpan, slides)
            : 0
        item.track.style.transform = `translate3d(0, ${shift * height}px, 0)`
        if (hasSky) paintSky(item.track.querySelector('.works-frame.is-sky'))
        item.track.querySelectorAll('.works-turn').forEach((turn) => {
          turn.style.setProperty('--grow', storyGrow(page).toFixed(4))
        })
        const entrance = storyVisual(page)
        const contextVisual = Math.min(1, Math.max(0, (entrance - 0.48) / 0.52))
        item.track.querySelectorAll('.works-context').forEach((block) => {
          const label = block.querySelector('.works-context-label')
          const body = block.querySelector('.works-context-body')
          if (label) label.style.opacity = storyNoteOpacity(contextVisual, 'title', 0).toFixed(3)
          if (body) body.style.opacity = storyNoteOpacity(contextVisual, 'body', 0).toFixed(3)
        })
        const zoomVisual = storyZoomVisual(page)
        item.track.querySelectorAll('.works-zoom').forEach((zoom) => {
          zoom.style.setProperty('--zoom', storyZoom(page).toFixed(4))
          zoom.style.setProperty('--arrive', `${storyArrive(page).toFixed(2)}vw`)
        })
        item.track.querySelectorAll('.works-filters-shot').forEach((shot) => {
          shot.style.setProperty('--rise', filtersRise(page).toFixed(4))
        })
        item.track.querySelectorAll('.works-note').forEach((note, index) => {
          const label = note.querySelector('.works-note-label')
          const body = note.querySelector('.works-note-body')
          if (label) label.style.opacity = storyNoteOpacity(zoomVisual, 'title', index).toFixed(3)
          if (body) body.style.opacity = storyNoteOpacity(zoomVisual, 'body', index).toFixed(3)
        })
        const scentVisual = storyScentVisual(page)
        item.track.querySelectorAll('.works-scent-note').forEach((note, index) => {
          const label = note.querySelector('.works-note-label')
          const body = note.querySelector('.works-note-body')
          if (label) label.style.opacity = storyNoteOpacity(scentVisual, 'title', index).toFixed(3)
          if (body) body.style.opacity = storyNoteOpacity(scentVisual, 'body', index).toFixed(3)
        })
        item.track.querySelectorAll('.works-shell').forEach((shot) => {
          shot.style.setProperty('--spread', storyShellSpread(page).toFixed(4))
        })
        const shellVisual = storyShellVisual(page)
        item.track.querySelectorAll('.works-shell-copy').forEach((block) => {
          const label = block.querySelector('.works-note-label')
          const body = block.querySelector('.works-note-body')
          if (label) label.style.opacity = storyNoteOpacity(shellVisual, 'title', 0).toFixed(3)
          if (body) body.style.opacity = storyNoteOpacity(shellVisual, 'body', 0).toFixed(3)
        })
        const phasesText = storyPhasesText(page)
        const phasesStep = storyPhasesStep(page)
        item.slide.querySelectorAll('.works-cue').forEach((cue) => {
          cue.style.opacity = storyScrollCue(page).toFixed(3)
        })
        const endOpacity = storyEndChrome(page)
        item.slide.querySelectorAll('.works-end').forEach((end) => {
          end.style.opacity = endOpacity.toFixed(3)
          end.classList.toggle('is-live', endOpacity > 0.45)
          end.setAttribute('aria-hidden', endOpacity > 0.45 ? 'false' : 'true')
        })
        item.track.querySelectorAll('.works-phases-flow').forEach((flow) => {
          flow.style.transform = `translate3d(0, ${(-phasesStep * height).toFixed(2)}px, 0)`
          flow.querySelectorAll('.works-phases-screen').forEach((screen) => {
            screen.style.height = `${height}px`
          })
          const images = [...flow.querySelectorAll('.works-phase img')]
          images.forEach((img, index) => {
            img.style.opacity = storyPhaseFade(phasesStep, index).toFixed(3)
          })
          const flowTop = flow.getBoundingClientRect().top
          flow.querySelectorAll('.works-phases-arrow').forEach((arrow, index) => {
            const above = images[index]
            const below = images[index + 1]
            if (!above || !below) return
            const aboveBox = above.getBoundingClientRect()
            const belowBox = below.getBoundingClientRect()
            const gap = belowBox.top - aboveBox.bottom
            if (aboveBox.height < 2 || belowBox.height < 2 || gap < 24) {
              arrow.style.opacity = '0'
              return
            }
            const arrowHeight = Math.min(height * 0.11, gap * 0.46)
            const top = (aboveBox.bottom + belowBox.top) / 2 - arrowHeight / 2 - flowTop
            arrow.style.top = `${top.toFixed(2)}px`
            arrow.style.height = `${arrowHeight.toFixed(2)}px`
            arrow.style.opacity = storyPhaseArrowFade(phasesStep, index).toFixed(3)
          })
        })
        const finale = storyFinaleVisual(page)
        item.track.querySelectorAll('.works-finale-shot').forEach((shot, index) => {
          shot.style.setProperty('--in', storyFinalePiece(finale, index).toFixed(4))
        })
        const measures = storyMeasuresVisual(page)
        item.track.querySelectorAll('.works-finale-sheet').forEach((sheet) => {
          sheet.style.setProperty('--in', measures.toFixed(4))
        })
        item.track.querySelectorAll('.works-phases-copy').forEach((block) => {
          const label = block.querySelector('.works-note-label')
          const body = block.querySelector('.works-note-body')
          if (label) label.style.opacity = storyNoteOpacity(phasesText, 'title', 0).toFixed(3)
          if (body) body.style.opacity = storyNoteOpacity(phasesText, 'body', 0).toFixed(3)
        })
      }
    })
    const openSlide = this.slides.find((item) => item.id === openId)
    const paper = openSlide?.editorial ? Boolean(openSlide.paper) : Boolean(openId) && storyPaper(this.story)
    this.root.classList.toggle('is-paper', paper)
    this.onSoundtrack?.(videoGate)
  }
}
