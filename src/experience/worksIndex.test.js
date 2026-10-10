import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { config } from '../config.js'
import {
  INDEX_ORDER,
  applyProjectWheel,
  indexButtonVisible,
  nextProjectId,
  previousProjectId,
  indexCaption,
  indexCopyVisible,
  indexDimmed,
  indexEntered,
  indexImage,
  indexItemPose,
  indexLight,
  indexLive,
  indexLook,
  indexMix,
  indexPageShift,
  indexPointerEnabled,
  indexProjects,
  indexSettled,
  indexCursorState,
  indexShare,
  indexSpecLines,
  indexStageOpacity,
  projectSlideVisible,
} from './worksIndex.js'

describe('indexStageOpacity', () => {
  it('stays hidden during the figure orbit', () => {
    assert.equal(indexStageOpacity(0), 0)
  })

  it('is already opaque while the black page scrolls in', () => {
    assert.equal(indexStageOpacity(0.02), 1)
    assert.equal(indexStageOpacity(0.4), 1)
  })

  it('is fully there once the index has landed', () => {
    assert.equal(indexStageOpacity(1), 1)
    assert.equal(indexStageOpacity(1.2), 1)
  })
})

describe('indexPageShift', () => {
  it('starts below the home and rises with scroll', () => {
    assert.equal(indexPageShift(0), 1)
    assert.equal(indexPageShift(0.5), 0.5)
    assert.equal(indexPageShift(1), 0)
    assert.equal(indexPageShift(1.4), 0)
  })
})

describe('indexLook', () => {
  it('is still when the cursor is in the middle', () => {
    const mid = indexLook(0, 0)
    assert.ok(mid.yaw === 0)
    assert.ok(mid.pitch === 0)
    assert.ok(mid.x === 0)
    assert.ok(mid.y === 0)
  })

  it('tilts the space toward the cursor', () => {
    const left = indexLook(-1, 0)
    const right = indexLook(1, 0)
    const up = indexLook(0, 1)
    assert.ok(left.yaw < 0)
    assert.ok(right.yaw > 0)
    assert.ok(up.pitch < 0)
    assert.ok(Math.abs(left.x) > 2)
  })
})

describe('indexLight', () => {
  it('keeps every photo lit until the cursor is on one', () => {
    assert.equal(indexLight('01', null), 1)
    assert.equal(indexLight('03', null), 1)
  })

  it('keeps the other photos lit when the cursor is on one', () => {
    assert.equal(indexLight('01', '01'), 1)
    assert.equal(indexLight('02', '01'), 1)
    assert.equal(indexLight('05', '03'), 1)
  })
})

describe('indexLive', () => {
  it('is off on the figure and on once selected works starts', () => {
    assert.equal(indexLive(0), false)
    assert.equal(indexLive(0.05), true)
  })
})

describe('indexEntered', () => {
  it('lets the photos mix as soon as the figure starts to leave', () => {
    assert.equal(indexEntered(0.05), false)
    assert.equal(indexEntered(0.2), true)
  })
})

describe('indexProjects', () => {
  it('follows the catalog order from the index layout', () => {
    const titles = indexProjects(config.projects).map((project) => project.title)
    assert.deepEqual(titles, [
      'Firmamento',
      'Salotto audiovisivo',
      'Spiraluma',
      'Look behind',
      'Ring monster',
    ])
    assert.deepEqual(INDEX_ORDER, ['01', '02', '03', '04', '05'])
  })
})

describe('indexCaption', () => {
  it('is empty until a photo is hovered', () => {
    assert.deepEqual(indexCaption(null, config.projects), { title: '', kind: '', date: '' })
  })

  it('uses the catalog title, kind and date under the hovered photo', () => {
    assert.deepEqual(indexCaption('04', config.projects), {
      title: 'Look Behind',
      kind: 'Team project',
      date: '3 months - 2025',
    })
    assert.deepEqual(indexCaption('02', config.projects), {
      title: 'Salotto Audiovisivo',
      kind: 'Workshop project',
      date: '1 week - 2026',
    })
    assert.equal(indexCaption('05', config.projects).title, 'Ring Monsters')
    assert.equal(indexCaption('01', config.projects).kind, 'Solo project')
  })
})

describe('indexCursorState', () => {
  it('stays off outside the index', () => {
    assert.equal(indexCursorState(false, false), 'off')
    assert.equal(indexCursorState(false, true), 'off')
  })

  it('is a dot on the index and view over a project', () => {
    assert.equal(indexCursorState(true, false), 'dot')
    assert.equal(indexCursorState(true, true), 'view')
  })
})

describe('indexShare', () => {
  it('gives every photo the same room until one is hovered', () => {
    assert.equal(indexShare('01', null), 1)
    assert.equal(indexShare('04', null), 1)
  })

  it('gives the hovered photo most of the screen', () => {
    assert.ok(indexShare('02', '02') > indexShare('01', '02') * 3)
  })
})

describe('indexSpecLines', () => {
  it('keeps the project specs and leaves the duration aside', () => {
    const salotto = config.projects.find((project) => project.id === '02')
    assert.deepEqual(indexSpecLines(salotto), ['Reverie festival', 'Workshop project'])
  })
})

describe('indexCopyVisible', () => {
  it('waits for hover on desktop', () => {
    assert.equal(indexCopyVisible('01', null, false), false)
    assert.equal(indexCopyVisible('01', '01', false), true)
    assert.equal(indexCopyVisible('01', '02', false), false)
  })

  it('is always on for every photo on a phone', () => {
    assert.equal(indexCopyVisible('01', null, true), true)
    assert.equal(indexCopyVisible('02', '01', true), true)
  })
})

describe('indexDimmed', () => {
  it('leaves every photo in color until one is hovered', () => {
    assert.equal(indexDimmed('01', null), false)
  })

  it('turns the others black and white', () => {
    assert.equal(indexDimmed('01', '01'), false)
    assert.equal(indexDimmed('02', '01'), true)
  })
})

describe('indexMix', () => {
  it('keeps the photos mixed while the index is still arriving', () => {
    assert.equal(indexMix(0.4), 0)
    assert.equal(indexMix(0.7), 0)
  })

  it('lines up only once the page has landed', () => {
    assert.ok(indexMix(0.92) > 0.4)
    assert.equal(indexMix(1), 1)
  })
})

describe('indexSettled', () => {
  it('is off until the photos have lined up', () => {
    assert.equal(indexSettled(0.9), false)
    assert.equal(indexSettled(1), true)
  })
})

describe('indexPointerEnabled', () => {
  it('is off while the photos mix', () => {
    assert.equal(indexPointerEnabled(0.5), false)
  })

  it('is on once they have lined up', () => {
    assert.equal(indexPointerEnabled(1), true)
  })

  it('is off while a project is open', () => {
    assert.equal(indexPointerEnabled(1, '01'), false)
  })
})

describe('indexItemPose', () => {
  it('clusters overlapping near the center while mixing', () => {
    const a = indexItemPose({ index: 0, count: 5, mix: 0, time: 0, stacked: false })
    const b = indexItemPose({ index: 1, count: 5, mix: 0, time: 0, stacked: false })
    assert.ok(Math.abs(a.x) < 28)
    assert.ok(Math.abs(a.y) < 22)
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 36)
  })

  it('settles the photos in space at different depths, not in a row', () => {
    const poses = [0, 1, 2, 3, 4].map((index) =>
      indexItemPose({ index, count: 5, mix: 1, time: 0, stacked: false }),
    )
    const depths = poses.map((pose) => pose.z)
    const heights = poses.map((pose) => pose.y)
    assert.ok(Math.max(...depths) - Math.min(...depths) > 20)
    assert.ok(Math.max(...depths) - Math.min(...depths) < 70)
    assert.ok(Math.max(...heights) - Math.min(...heights) > 12)
    poses.forEach((pose) => assert.equal(typeof pose.rot, 'number'))
  })

  it('keeps landed desktop photos apart so their frames do not sit on top of each other', () => {
    const poses = [0, 1, 2, 3, 4].map((index) =>
      indexItemPose({ index, count: 5, mix: 1, time: 0, stacked: false }),
    )
    const halfW = 20
    const halfH = 24
    for (let i = 0; i < poses.length; i += 1) {
      for (let j = i + 1; j < poses.length; j += 1) {
        const overlap =
          Math.abs(poses[i].x - poses[j].x) < halfW && Math.abs(poses[i].y - poses[j].y) < halfH
        assert.equal(overlap, false, `photos ${i} and ${j} overlap`)
      }
    }
  })

  it('stacks vertically when landed on a phone', () => {
    const poses = [0, 1, 2, 3, 4].map((index) =>
      indexItemPose({ index, count: 5, mix: 1, time: 0, stacked: true }),
    )
    assert.ok(poses[0].y < poses[1].y)
    poses.forEach((pose) => assert.ok(Math.abs(pose.x) < 8))
  })

  it('drifts over time while mixing', () => {
    const a = indexItemPose({ index: 0, count: 5, mix: 0, time: 0, stacked: false })
    const b = indexItemPose({ index: 0, count: 5, mix: 0, time: 1.7, stacked: false })
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 1)
  })
})

describe('nextProjectId', () => {
  it('walks the index and returns to the first project', () => {
    assert.equal(nextProjectId('01'), '02')
    assert.equal(nextProjectId('05'), '01')
    assert.equal(nextProjectId(null), '01')
  })
})

describe('previousProjectId', () => {
  it('walks back and wraps to the last project', () => {
    assert.equal(previousProjectId('02'), '01')
    assert.equal(previousProjectId('01'), '05')
    assert.equal(previousProjectId(null), '01')
  })
})

describe('indexButtonVisible', () => {
  it('shows only inside a project page', () => {
    assert.equal(indexButtonVisible(null), false)
    assert.equal(indexButtonVisible('01'), true)
  })
})

describe('projectSlideVisible', () => {
  it('keeps every fascia closed on the index', () => {
    assert.equal(projectSlideVisible(null, '01'), false)
  })

  it('opens only the clicked project', () => {
    assert.equal(projectSlideVisible('05', '05'), true)
    assert.equal(projectSlideVisible('05', '01'), false)
  })
})

describe('applyProjectWheel', () => {
  it('blocks the home scroll while a project is open', () => {
    assert.equal(applyProjectWheel('01'), true)
    assert.equal(applyProjectWheel(null), false)
  })
})

describe('indexImage', () => {
  it('prefers the index photo over the fascia cover', () => {
    assert.equal(
      indexImage({ image: '/works/firmamento/cover.jpg', indexImage: '/works/firmamento/index.jpg' }),
      '/works/firmamento/index.jpg',
    )
  })
})
