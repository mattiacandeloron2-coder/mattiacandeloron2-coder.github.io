import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { config } from '../config.js'
import {
  filtersRise,
  projectFrames,
  sceneLift,
  scrollMax,
  slideOffset,
  slidePin,
  storyBoardShift,
  storyScentVisual,
  storyShellSpread,
  storyShellVisual,
  storyPhasesStep,
  storyPhasesText,
  storyPhaseFade,
  storyPhaseArrowFade,
  storyFinaleVisual,
  storyFinalePiece,
  storyMeasuresVisual,
  storyScrollCue,
  storyEndChrome,
  storyEndNav,
  skyTrailStep,
  reelStillBox,
  reelTrailFade,
  reelTrailBlocked,
  reelTrailStep,
  reelTrailLife,
  editorialHold,
  editorialRead,
  editorialIn,
  editorialTimeline,
  hangInView,
  editorialOnPaper,
  totemFade,
  layerStepsFade,
  layerPhoneFade,
  productRush,
  evolveIn,
  evolveLine,
  storyDelta,
  storyGrow,
  storyNoteOpacity,
  storyPaper,
  storyScroll,
  storyScrolls,
  storyArrive,
  storyShift,
  storySpan,
  storyTrackShift,
  storyVisual,
  storyZoom,
  storyZoomVisual,
  worksCaptionLines,
  worksImageFocus,
  worksProgress,
  worksTravel,
} from './worksStrip.js'

describe('worksProgress', () => {
  it('stays at 0 during the figure orbit', () => {
    assert.equal(worksProgress(0), 0)
    assert.equal(worksProgress(0.97), 0)
    assert.equal(worksProgress(1), 0)
  })

  it('starts after the orbit ends', () => {
    assert.equal(worksProgress(1.5), 0.5)
  })
})

describe('scrollMax', () => {
  it('adds one viewport after the figure so the index can land', () => {
    assert.equal(scrollMax(5, 900, 5800), 1 + 900 / 5800)
  })
})

describe('worksTravel', () => {
  it('is zero until the orbit ends', () => {
    assert.equal(worksTravel(1, 900, 5800), 0)
  })

  it('counts one viewport as one work', () => {
    assert.ok(Math.abs(worksTravel(1 + 900 / 5800, 900, 5800) - 1) < 1e-10)
  })

  it('lands on the index at scroll max', () => {
    const distance = 5800
    const vh = 900
    const max = scrollMax(5, vh, distance)
    const travel = worksTravel(max, vh, distance)
    assert.ok(Math.abs(travel - 1) < 1e-10)
  })
})

describe('slideOffset', () => {
  it('keeps the first work below the figure until you keep scrolling', () => {
    assert.equal(slideOffset(0, 0), 1)
  })

  it('fills the screen with the first work after one viewport', () => {
    assert.equal(slideOffset(1, 0), 0)
  })

  it('lets the next work rise as a band over the previous', () => {
    assert.equal(slideOffset(1.5, 0), -0.5)
    assert.equal(slideOffset(1.5, 1), 0.5)
  })

  it('lands the last work full-screen at the end', () => {
    assert.equal(slideOffset(5, 4), 0)
  })
})

describe('sceneLift', () => {
  it('leaves the home still while the black page covers the figure', () => {
    assert.equal(sceneLift(0), 0)
    assert.equal(sceneLift(0.4), 0)
    assert.equal(sceneLift(1), 0)
    assert.equal(sceneLift(2.3), 0)
  })
})

describe('slidePin', () => {
  it('lets the first photo rise from below with the selected-works line', () => {
    assert.equal(slidePin(0.6, 0, 0.4), 0)
  })

  it('holds later photos still while a covering band grows', () => {
    assert.equal(slidePin(0.6), -0.6)
    assert.equal(slidePin(-0.4), 0.4)
    assert.equal(slidePin(0.5, 1, 1.5), -0.5)
  })
})

describe('worksImageFocus', () => {
  it('crops toward the product so the photo can fill the band', () => {
    assert.equal(worksImageFocus({ imageFocus: '68% 80%' }), '68% 80%')
  })

  it('defaults to center when a photo has no focus', () => {
    assert.equal(worksImageFocus({}), 'center center')
  })
})

describe('projectFrames', () => {
  it('opens Firmamento on the night sky, then the station photo', () => {
    const firmamento = config.projects.find((project) => project.id === '01')
    const frames = projectFrames(firmamento)
    assert.deepEqual(
      frames.map((frame) => frame.role),
      ['sky', 'cover', 'object', 'zoom', 'filters', 'scent', 'shell', 'phases', 'finale'],
    )
    assert.equal(frames[0].title, 'Firmamento')
    assert.equal(frames[1].src, '/progetti/Firmamento/apertura.jpg')
    assert.equal(frames[2].src, '/progetti/Firmamento/esploso.png')
    assert.equal(frames[3].blocks[0].label, 'The role of the light.')
    assert.equal(frames[3].blocks[1].label, 'How?')
    assert.equal(frames[4].role, 'filters')
    assert.match(frames[4].src, /closeup filtri/)
    assert.match(frames[5].src, /atomizzatore/)
    assert.equal(frames[5].blocks[0].label, 'The Parfume as a vehicle of relax and informations.')
    assert.equal(frames[5].blocks[1].label, 'Proposed olfactory palette')
    assert.match(frames[6].src, /scocca/)
    assert.equal(frames[7].copy.label, 'How I shaped the object.')
    assert.deepEqual(
      frames[7].steps.map((src) => src.match(/(\d+)\.png$/)[1]),
      ['1', '2', '3', '4', '5'],
    )
    assert.deepEqual(
      frames[8].shots.map((shot) => shot.place),
      ['station', 'side', 'air'],
    )
    assert.equal(frames[6].copy.label, 'The shell.')
  })

  it('lights a warm trail on the cursor and lets it go dark when the cursor leaves', () => {
    const born = skyTrailStep(
      [
        { x: 0.2, y: 0.2, on: 0, placed: false },
        { x: 0.2, y: 0.2, on: 0, placed: false },
      ],
      { x: 0.7, y: 0.4 },
      true,
      true,
    )
    assert.equal(born[0].x, 0.7)
    assert.equal(born[0].y, 0.4)
    assert.equal(born[0].on, 1)
    assert.equal(born[1].x, 0.7)
    const gone = skyTrailStep(born, { x: 0.7, y: 0.4 }, false, true)
    assert.equal(gone[0].on, 0)
    const followed = skyTrailStep(
      [
        { x: 0.2, y: 0.2, on: 1, placed: true },
        { x: 0.2, y: 0.2, on: 1, placed: true },
      ],
      { x: 0.8, y: 0.2 },
      true,
      false,
    )
    assert.ok(followed[0].x > followed[1].x)
    assert.ok(followed[0].x < 0.8)
  })

  it('opens Spiraluma on the hanging tubes, then the cover', () => {
    const spiraluma = config.projects.find((project) => project.id === '03')
    const frames = projectFrames(spiraluma)
    assert.deepEqual(
      frames.map((frame) => frame.role),
      ['hang', 'cover', 'idea', 'process', 'supports', 'board'],
    )
    assert.equal(editorialHold('hang'), 0)
    assert.equal(frames[1].src, spiraluma.image)
    assert.equal(editorialTimeline(storySpan, frames.map((frame) => editorialHold(frame.role))).shift, -1)
    const leaving = editorialTimeline(storySpan * 0.65, frames.map((frame) => editorialHold(frame.role)))
    assert.ok(leaving.shift < -0.5)
    assert.ok(leaving.shift > -1)
    assert.equal(hangInView(leaving.shift, 0), true)
    assert.equal(hangInView(0, 0), true)
    assert.equal(hangInView(-1, 0), false)
    assert.match(frames[2].model, /lumaca\.obj$/)
    assert.equal(frames[2].copy.label, 'The Idea')
    assert.match(frames[2].copy.body, /industrial waste/)
    assert.match(frames[2].copy.body, /durable outdoor toy/)
    assert.equal(editorialHold('idea'), 2)
    assert.match(frames[3].src, /IMG_4995\.JPG$/)
    assert.equal(frames[3].copy.label, 'A new type of process')
    assert.match(frames[3].copy.body, /practical design process/)
    assert.equal(frames[3].copy.body.includes('<img'), false)
    assert.deepEqual(
      frames[4].shots.map((shot) => shot.src.match(/IMG_\d+/)[0]),
      ['IMG_4986', 'IMG_4999', 'IMG_4988'],
    )
    assert.equal(frames[4].copy.label, 'Custom supports, familiar touchpoints')
    assert.match(frames[5].src, /tavola\.png$/)
    assert.equal(editorialHold('process'), 2)
    assert.equal(editorialHold('supports'), 2)
    assert.equal(editorialHold('board'), 1)
    const roles = frames.map((frame) => frame.role)
    const holds = roles.map((role) => editorialHold(role))
    assert.equal(editorialOnPaper(storySpan * 10, holds, roles), true)
  })

  it('opens Look Behind on the film, then the cover, the sticker, the posters, the totem, then the layer', () => {
    const look = config.projects.find((project) => project.id === '04')
    const frames = projectFrames(look)
    assert.deepEqual(
      frames.map((frame) => frame.role),
      ['film', 'cover', 'sticker', 'posters', 'totem', 'layer'],
    )
    assert.match(frames[0].src, /POV\.mp4$/)
    assert.equal(editorialHold('film'), 0)
    assert.equal(frames[1].src, look.image)
    assert.match(frames[2].src, /LOOKBEHIND\.png$/)
    assert.equal(frames[2].copy.label, 'A way to stand against harm justified in the name of profit.')
    assert.match(frames[2].copy.body, /complete communication product/)
    assert.match(frames[2].copy.body, /tangible product/)
    assert.equal(editorialHold('sticker'), 2)
    assert.equal(editorialHold('posters'), 2)
    assert.deepEqual(
      frames[3].shots.map((shot) => shot.id),
      ['tonno', 'petrolio', 'ambra'],
    )
    assert.match(frames[3].shots[0].src, /tonno\.jpg$/)
    assert.match(frames[3].shots[1].src, /petrolio\.jpg$/)
    assert.match(frames[3].shots[2].src, /ambra\.jpg$/)
    assert.equal(frames[3].copy.tone, 'rose')
    assert.equal(frames[3].copy.label, 'Stand right in front of the consequences of your choices.')
    assert.match(frames[3].copy.body, /familiar brand labels/)
    assert.match(frames[3].copy.body, /How much does your \.\.\. really cost\?/)
    assert.match(frames[4].src, /place the object/)
    assert.equal(frames[4].copy.tone, 'ink')
    assert.equal(frames[4].copy.label, 'The attention problem.')
    assert.match(frames[4].copy.body, /<strong>specially designed totems<\/strong>/)
    assert.match(frames[4].copy.body, /what lies are hidden behind our own choices/)
    assert.equal(editorialHold('totem'), 2)
    assert.equal(totemFade(0), 0)
    assert.ok(totemFade(0.45) > 0.25 && totemFade(0.45) < 0.6)
    assert.equal(totemFade(1), 1)
    assert.match(frames[5].steps, /Artivive-Instructions/)
    assert.match(frames[5].phone, /8f5f72ad/)
    assert.equal(frames[5].copy.label, 'Physical object, digital layer.')
    assert.match(frames[5].copy.body, /<strong>website<\/strong>/)
    assert.match(frames[5].copy.body, /<strong>Artivive app<\/strong>/)
    assert.match(frames[5].copy.body, /truth behind the labels/)
    assert.equal(editorialHold('layer'), 2)
    assert.equal(layerStepsFade(0), 0)
    assert.equal(layerPhoneFade(0), 0)
    assert.ok(layerStepsFade(0.25) > 0.3)
    assert.equal(layerPhoneFade(0.25), 0)
    assert.equal(layerStepsFade(1), 1)
    assert.equal(layerPhoneFade(1), 1)
    assert.deepEqual(storyEndNav(frames.map((frame) => frame.role)), {
      previous: true,
      finale: false,
      photo: false,
    })
    const roles = frames.map((frame) => frame.role)
    const holds = roles.map((role) => editorialHold(role))
    assert.equal(editorialOnPaper(storySpan * 2, holds, roles), true)
    assert.equal(editorialOnPaper(storySpan * 4, holds, roles), true)
    assert.equal(editorialOnPaper(storySpan * 8, holds, roles), true)
    assert.equal(editorialOnPaper(storySpan * 10, holds, roles), true)
    assert.equal(editorialTimeline(storySpan * 10, holds).frames.at(-1).dwell, 0)
    assert.equal(editorialIn(editorialTimeline(storySpan * 14, holds).frames.at(-1).dwell, 0.12, 0.72), 1)
  })

  it('opens Ring Monster on the cover, then the product, then the process', () => {
    const ring = config.projects.find((project) => project.id === '05')
    const frames = projectFrames(ring)
    assert.deepEqual(
      frames.map((frame) => frame.role),
      ['cover', 'product', 'evolve'],
    )
    assert.equal(frames[0].src, ring.image)
    assert.match(frames[1].bolts, /stecche\.png$/)
    assert.match(frames[1].sketches, /schizzi\.png$/)
    assert.match(frames[1].animal, /kungo\.png$/)
    assert.equal(frames[1].copy.tone, 'ink')
    assert.equal(frames[1].copy.label, 'The product')
    assert.match(frames[1].copy.body, /toy concept for IKEA/)
    assert.match(frames[1].copy.body, /children aged 4–6/)
    assert.match(frames[1].copy.body, /<strong>imagination<\/strong>/)
    assert.match(frames[1].copy.body, /<strong>also be used as decorative objects<\/strong>/)
    assert.match(frames[1].copy.body, /remember the good old days/)
    assert.equal(editorialHold('product'), 2)
    assert.equal(productRush(0), 0)
    assert.ok(productRush(0.07) > 0.45 && productRush(0.07) < 0.55)
    assert.equal(productRush(0.14), 1)
    assert.equal(productRush(1), 1)
    assert.equal(editorialIn(0.14, 0.28, 0.62), 0)
    assert.equal(editorialIn(0.62, 0.28, 0.62), 1)
    assert.equal(frames[2].copy.tone, 'clay')
    assert.equal(frames[2].copy.label, 'The process')
    assert.match(frames[2].copy.body, /Fisher-Price stacking toy/)
    assert.match(frames[2].copy.body, /<strong>different meanings<\/strong>/)
    assert.match(frames[2].copy.body, /<strong>invent, transform, and reinterpret their own creatures\.<\/strong>/)
    assert.deepEqual(
      frames[2].phases.map((phase) => phase.src),
      [
        '/progetti/Ring monster/evolve-1.png',
        '/progetti/Ring monster/evolve-2.png',
        '/progetti/Ring monster/evolve-3.png',
        '/progetti/Ring monster/evolve-4.png',
      ],
    )
    assert.equal(editorialHold('evolve'), 2)
    assert.equal(evolveIn(0.22, 0), 0)
    assert.equal(evolveIn(0.38, 0), 1)
    assert.equal(evolveIn(0.37, 1), 0)
    assert.equal(evolveIn(0.83, 3), 1)
    assert.equal(evolveLine(0.22), 0)
    assert.equal(evolveLine(0.83), 1)
    assert.deepEqual(storyEndNav(frames.map((frame) => frame.role)), {
      previous: true,
      finale: false,
      photo: false,
      refresh: true,
    })
    const roles = frames.map((frame) => frame.role)
    const holds = roles.map((role) => editorialHold(role))
    assert.equal(editorialOnPaper(0, holds, roles), false)
    assert.equal(editorialOnPaper(storySpan * 2, holds, roles), true)
    assert.equal(editorialOnPaper(storySpan * 6, holds, roles), true)
  })

  it('opens Salotto on the festival film, then the cover', () => {
    const salotto = config.projects.find((project) => project.id === '02')
    const frames = projectFrames(salotto)
    assert.deepEqual(
      frames.map((frame) => frame.role),
      ['reel', 'cover', 'concept', 'stage', 'materials', 'parterre', 'samples', 'still'],
    )
    assert.match(frames[0].src, /\.mp4$/)
    assert.equal(frames[0].stills.length, 63)
    assert.ok(frames[0].stills.every((src) => src.includes('/reverie/')))
    assert.equal(editorialHold('reel'), 0)
    const holds = frames.map((frame) => editorialHold(frame.role))
    assert.equal(Math.abs(editorialTimeline(0, holds).shift), 0)
    assert.equal(editorialTimeline(storySpan, holds).shift, -1)
    assert.match(frames[1].src, /DSCF0133/)
    assert.equal(frames[2].copy.label, 'The concept.')
    assert.match(frames[2].src, /8\.png$/)
    assert.match(frames[2].logo, /MIRA_logo/)
    assert.equal(frames[3].copy.label, 'The stage')
    assert.match(frames[3].src, /index\.png$/)
    assert.equal(frames[4].items[0].text, 'Main line, knots and swivels. Tubular sections and single-bolt double clamps.')
    assert.equal(frames[4].items[2].text, 'Zinc plates for boat hulls.')
    assert.deepEqual(
      frames[4].sketches.map((sketch) => sketch.place),
      ['knots', 'truss'],
    )
    assert.equal(frames[5].copy.label, 'The parterre')
    assert.deepEqual(
      frames[6].items.map((item) => item.name),
      ['Fabrics', 'Pallets and slats', 'Strips led', 'Aluminum uprights'],
    )
    assert.match(frames[7].src, /17_31_06/)
  })

  it('lays reverie stills along the cursor at a third of the film', () => {
    const sources = ['a.jpg', 'b.jpg', 'c.jpg']
    const first = reelTrailStep([], { x: 0.2, y: 0.4 }, 0, sources, 0, { life: reelTrailLife, gap: 0.1 })
    assert.equal(first.drops.length, 1)
    assert.equal(first.drops[0].src, 'a.jpg')
    const held = reelTrailStep(first.drops, { x: 0.24, y: 0.4 }, 80, sources, first.pick, {
      life: reelTrailLife,
      gap: 0.1,
    })
    assert.equal(held.drops.length, 1)
    const next = reelTrailStep(held.drops, { x: 0.55, y: 0.7 }, 160, sources, held.pick, {
      life: reelTrailLife,
      gap: 0.1,
    })
    assert.equal(next.drops.length, 2)
    assert.equal(next.drops[1].src, 'b.jpg')
    assert.equal(next.drops[1].x, 0.55)
    assert.equal(next.drops[1].seen, false)
    const waiting = reelTrailStep(next.drops, null, reelTrailLife + 50, sources, next.pick, {
      life: reelTrailLife,
      gap: 0.1,
    })
    assert.equal(waiting.drops.length, 2)
    next.drops.forEach((drop) => {
      drop.seen = true
    })
    const gone = reelTrailStep(next.drops, null, 160 + reelTrailLife + 1, sources, next.pick, {
      life: reelTrailLife,
      gap: 0.1,
    })
    assert.equal(gone.drops.length, 0)
    assert.equal(reelTrailFade(0, reelTrailLife), 0)
    assert.ok(reelTrailFade(reelTrailLife * 0.3, reelTrailLife) > 0.95)
    assert.ok(reelTrailFade(reelTrailLife * 0.92, reelTrailLife) < 0.25)
    assert.equal(reelTrailFade(reelTrailLife, reelTrailLife), 0)
    assert.equal(reelTrailBlocked(0.9, 0.08), true)
    const corner = reelTrailStep([], { x: 0.9, y: 0.08 }, 0, sources, 0)
    assert.equal(corner.drops.length, 0)
    const wide = reelStillBox(1440, 900, 720, 900)
    assert.equal(wide.width, 240)
    assert.equal(wide.height, 300)
    const phone = reelStillBox(390, 844, 720, 900)
    assert.ok(Math.abs(phone.width - 130) < 0.001)
    assert.ok(Math.abs(phone.height - 162.5) < 0.001)
  })
})

describe('editorialTimeline', () => {
  const holds = [0, 2, 2, 2, 2, 2, 1]

  it('holds a page still while its text is read', () => {
    const mid = editorialTimeline(storySpan * 2, holds)
    assert.equal(mid.shift, -1)
    assert.ok(mid.frames[1].dwell > 0.45)
    assert.ok(mid.frames[1].dwell < 0.55)
    assert.equal(mid.frames[2].arrive, 0)
    const parked = editorialTimeline(storySpan * 3, holds)
    assert.equal(parked.shift, -1)
    assert.equal(parked.frames[1].dwell, 1)
  })

  it('reaches the closing photo after every dwell', () => {
    const maxT = holds.reduce((sum, hold) => sum + hold, 0) + holds.length - 1
    const end = editorialTimeline(storySpan * maxT, holds)
    assert.equal(end.shift, -(holds.length - 1))
    assert.equal(end.frames.at(-1).dwell, 1)
    assert.equal(editorialHold('concept'), 2)
    assert.equal(editorialHold('still'), 1)
    assert.equal(editorialHold('cover'), 0)
  })

  it('fades a reading in and back out, and leaves a caption once it is in', () => {
    assert.equal(editorialRead(0), 0)
    assert.ok(editorialRead(0.45) > 0.95)
    assert.equal(editorialRead(1), 0)
    assert.equal(editorialIn(0.1, 0.2, 0.5), 0)
    assert.equal(editorialIn(0.5, 0.2, 0.5), 1)
  })

  it('uses the light page on the text spreads and the dark one on the sketches', () => {
    const roles = ['cover', 'concept', 'stage', 'materials', 'parterre', 'samples', 'still']
    assert.equal(editorialOnPaper(0, holds, roles), false)
    assert.equal(editorialOnPaper(storySpan * 2, holds, roles), true)
    const materialsStart = 1 + 2 + 1 + 2 + 1
    assert.equal(editorialOnPaper(storySpan * (materialsStart + 0.5), holds, roles), false)
  })
})

describe('storyScroll', () => {
  it('moves down the story and stops after a short scroll', () => {
    assert.equal(storyScroll(0, 0.2, 2), 0.2)
    assert.equal(storyScroll(0.3, 0.5, 2), storySpan)
  })

  it('does not scroll above the first frame', () => {
    assert.equal(storyScroll(0.2, -0.5, 2), 0)
  })

  it('keeps a short extra scroll so the zoom photo can travel', () => {
    assert.equal(storyScroll(storySpan * 2, storySpan, 4), storySpan * 3)
    assert.equal(storyScroll(storySpan * 3, 0.2, 4), storySpan * 3)
  })
})

describe('storyShift', () => {
  it('covers the next slide once the short scroll is done', () => {
    assert.equal(storyShift(0), 0)
    assert.equal(storyShift(storySpan), -1)
    assert.equal(storyShift(storySpan * 2), -2)
  })
})

describe('storyTrackShift', () => {
  it('holds the exploded slide while the zoom arrives from the right', () => {
    assert.equal(storyTrackShift(0, true), 0)
    assert.equal(storyTrackShift(storySpan, true), -1)
    assert.equal(storyTrackShift(storySpan * 2, true), -1)
    assert.equal(storyTrackShift(storySpan * 2, false), -2)
  })
})
describe('storyBoardShift', () => {
  it('holds the light slide, then brings the filters photo up', () => {
    assert.equal(storyBoardShift(0), 0)
    assert.equal(storyBoardShift(storySpan), -1)
    assert.equal(storyBoardShift(storySpan * 2), -2)
    assert.equal(storyBoardShift(storySpan * 3), -2)
    assert.equal(storyBoardShift(storySpan * 4), -3)
    assert.equal(storyBoardShift(storySpan * 5), -3)
    assert.equal(storyBoardShift(storySpan * 6), -4)
    assert.equal(storyBoardShift(storySpan * 7), -4)
    assert.equal(filtersRise(storySpan * 4), 0)
    assert.equal(filtersRise(storySpan * 5), 1)
    assert.equal(storyScentVisual(storySpan * 5), 0)
    assert.equal(storyScentVisual(storySpan * 6), 0)
    assert.ok(storyScentVisual(storySpan * 7) > 0.999)
    assert.equal(storyBoardShift(storySpan * 8), -5)
    assert.equal(storyBoardShift(storySpan * 9), -5)
    assert.equal(storyShellVisual(storySpan * 8), 0)
    assert.ok(storyShellVisual(storySpan * 9) > 0.999)
    assert.ok(storyShellSpread(storySpan * 9) - storyShellSpread(storySpan * 8) > 0.4)
    assert.equal(storyBoardShift(storySpan * 10), -6)
    assert.equal(storyBoardShift(storySpan * 16), -6)
    assert.equal(storyBoardShift(storySpan * 16.5), -6.5)
    assert.equal(storyBoardShift(storySpan * 17), -7)
    assert.equal(storyBoardShift(storySpan * 19), -7)
    assert.equal(storyFinaleVisual(storySpan * 16), 0)
    assert.ok(storyFinaleVisual(storySpan * 17) > 0.3)
    assert.ok(storyFinaleVisual(storySpan * 17) < 0.4)
    assert.ok(storyFinaleVisual(storySpan * 19) > 0.999)
    assert.equal(storyFinalePiece(0, 0), 0)
    assert.equal(storyFinalePiece(1 / 3, 0), 1)
    assert.equal(storyFinalePiece(1 / 3, 1), 0)
    assert.equal(storyFinalePiece(0.5, 2), 0)
    assert.equal(storyFinalePiece(1, 2), 1)
    assert.ok(storyFinalePiece(0.5, 1) > 0.2)
    assert.ok(storyFinalePiece(0.5, 1) < 1)
    assert.equal(storyPhasesText(storySpan * 10), 0)
    assert.ok(storyPhasesText(storySpan * 11) > 0.999)
    assert.equal(storyPhasesStep(storySpan * 11), 0)
    assert.ok(storyPhasesStep(storySpan * 16) > 4.99)
    assert.equal(storyPhaseFade(0, 0), 0)
    assert.equal(storyPhaseFade(1, 0), 1)
    assert.equal(storyPhaseFade(1, 1), 0)
    assert.ok(storyPhaseFade(1.4, 1) > 0.2)
    assert.ok(storyPhaseFade(1.4, 1) < 1)
    assert.equal(storyPhaseArrowFade(1, 0), 0)
    assert.equal(storyPhaseArrowFade(1.5, 0), 1)
    assert.equal(storyPhaseArrowFade(1.5, 1), 0)
    assert.ok(storyPhaseArrowFade(1.3, 0) > 0.2)
    assert.ok(storyPhaseArrowFade(1.3, 0) < 1)
    assert.equal(storyPhaseArrowFade(5, 3), 1)
    assert.equal(storyScrollCue(storySpan * 10), 1)
    assert.equal(storyScrollCue(storySpan * 13), 0)
    assert.ok(storyScrollCue(storySpan * 16) > 0.99)
    assert.ok(storyScrollCue(storySpan * 16.5) > 0.7)
    assert.ok(storyScrollCue(storySpan * 17.5) < 0.05)
    assert.equal(storyMeasuresVisual(storySpan * 19), 0)
    assert.ok(storyMeasuresVisual(storySpan * 19.5) > 0.4)
    assert.ok(storyMeasuresVisual(storySpan * 19.5) < 0.6)
    assert.ok(storyMeasuresVisual(storySpan * 20) > 0.999)
    assert.equal(storyEndChrome(storySpan * 18.5), 0)
    assert.equal(storyEndChrome(storySpan * 19), 0)
    assert.ok(storyEndChrome(storySpan * 20) > 0.999)
  })
})
describe('storyZoom', () => {
  it('slides in from the left and grows on the following slide', () => {
    assert.equal(storyZoomVisual(storySpan * 2), 0)
    assert.equal(storyZoomVisual(storySpan * 3), 1)
    assert.ok(storyZoom(storySpan * 2) >= 1)
    assert.ok(storyZoom(storySpan * 3) > storyZoom(storySpan * 2))
    assert.ok(storyArrive(storySpan * 2) < 0)
    assert.equal(storyArrive(storySpan * 3), 0)
  })
})

describe('storyNoteOpacity', () => {
  it('fades titles ahead of their text, and the second box later', () => {
    const early = 0.22
    assert.ok(storyNoteOpacity(early, 'title', 0) > storyNoteOpacity(early, 'body', 0))
    assert.equal(storyNoteOpacity(early, 'title', 1), 0)
    assert.equal(storyNoteOpacity(0, 'title', 0), 0)
    assert.equal(storyNoteOpacity(1, 'body', 1), 1)
    assert.ok(storyNoteOpacity(0.55, 'title', 1) > storyNoteOpacity(0.55, 'body', 1))
  })
})

describe('storyGrow', () => {
  it('starts inside the frame and grows enough to notice', () => {
    assert.ok(storyGrow(0) < 1)
    assert.ok(storyGrow(storySpan) > 1.35)
    assert.ok(storyGrow(storySpan) < 1.42)
    assert.ok(storyGrow(storySpan) - storyGrow(0) > 0.3)
    assert.equal(storyVisual(storySpan), 1)
    assert.ok(storyVisual(storySpan / 2) < 1)
  })
})

describe('storyDelta', () => {
  it('turns a pixel wheel into a fraction of the screen', () => {
    assert.equal(storyDelta(450, 0, 900), 0.5)
  })
})

describe('storyPaper', () => {
  it('switches to the light page partway through the short scroll', () => {
    assert.equal(storyPaper(0.1), false)
    assert.equal(storyPaper(storySpan), true)
  })
})

describe('storyScrolls', () => {
  it('scrolls only when a work has more than one frame', () => {
    const firmamento = config.projects.find((project) => project.id === '01')
    const salotto = config.projects.find((project) => project.id === '02')
    const spiraluma = config.projects.find((project) => project.id === '03')
    assert.equal(storyScrolls(firmamento), true)
    assert.equal(storyScrolls(salotto), true)
    assert.equal(storyScrolls(spiraluma), true)
  })
})

describe('worksCaptionLines', () => {
  it('stacks role and date under the title', () => {
    assert.deepEqual(worksCaptionLines({ lines: ['Solo project', '4 months - 2026'] }), [
      'Solo project',
      '4 months - 2026',
    ])
  })

  it('keeps festival, workshop, and date for Salotto', () => {
    assert.deepEqual(
      worksCaptionLines({
        lines: ['Reverie festival', 'Workshop project', '1 week - 2026'],
      }),
      ['Reverie festival', 'Workshop project', '1 week - 2026'],
    )
  })
})
