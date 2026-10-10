import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { stickerConfig } from './config.js'
import {
  adhesionBoundary,
  adhesionTravel,
  deformSticker,
  freeCurlAngle,
  rowLength,
  segmentGrid,
  shadowOpacity,
  stickerNormalsInto,
  stickerProgress,
  vertexAt,
  worldSize,
} from './deformation.js'

const grid = segmentGrid(stickerConfig)
const { width, height } = worldSize(482 / 231)
const midRow = Math.floor(grid.rows / 2)

function maxLift(positions) {
  let max = 0
  for (let i = 2; i < positions.length; i += 3) max = Math.max(max, positions[i])
  return max
}

describe('sticker adhesion', () => {
  it('maps the slide scroll onto a 0 to 1 stick-down', () => {
    assert.equal(stickerProgress(0, stickerConfig), 0)
    assert.equal(stickerProgress(1, stickerConfig), 1)
    assert.equal(stickerProgress(0.5, { scrollEnd: 1 }), 0.5)
    assert.equal(stickerProgress(0.5, { scrollEnd: 0.5 }), 1)
    assert.ok(adhesionTravel(0.92) < 0.92)
    assert.equal(adhesionBoundary(0, stickerConfig), stickerConfig.initialAttachedFraction)
    assert.equal(adhesionBoundary(1, stickerConfig), 1)
    assert.ok(adhesionBoundary(0.25, stickerConfig) > 0.25)
    assert.ok(adhesionBoundary(0.25, stickerConfig) < 0.4)
    assert.ok(Math.abs(adhesionBoundary(0.5, stickerConfig) - 0.54) < 0.02)
    assert.ok(adhesionBoundary(0.75, stickerConfig) > 0.7)
    assert.equal(freeCurlAngle(1, stickerConfig), 0)
    assert.equal(freeCurlAngle(0, stickerConfig), stickerConfig.curlAngle)
    assert.ok(freeCurlAngle(0.5, stickerConfig) < freeCurlAngle(0, stickerConfig))
    assert.ok(freeCurlAngle(0.75, stickerConfig) < freeCurlAngle(0.5, stickerConfig))
  })

  it('starts with a small attached edge and a curled free edge', () => {
    const positions = deformSticker(0, stickerConfig, width, height, grid)
    const stuck = vertexAt(positions, grid.cols, 0, midRow)
    const lifted = vertexAt(positions, grid.cols, grid.cols - 1, midRow)
    const normals = stickerNormalsInto(new Float32Array(positions.length), positions, grid.cols, grid.rows)
    const tipNormal = vertexAt(normals, grid.cols, grid.cols - 1, midRow)
    assert.equal(stuck.z, 0)
    assert.ok(Math.abs(stuck.x + width / 2) < 1e-4)
    assert.ok(lifted.z > 0.12)
    assert.ok(lifted.x < width / 2 - 0.02)
    assert.ok(tipNormal.z < 0)
    const lift = maxLift(positions)
    assert.ok(lift > 0.18)
    assert.ok(lift < 1.45)
    const length = rowLength(positions, grid.cols, midRow)
    assert.ok(length > width * 0.96)
    assert.ok(length < width * 1.02)
  })

  it('grows the contact across the sticker without stretching it', () => {
    const marks = [0, 0.25, 0.5, 0.75, 1]
    const lifts = marks.map((progress) => maxLift(deformSticker(progress, stickerConfig, width, height, grid)))
    assert.ok(lifts[1] < lifts[0])
    assert.ok(lifts[2] < lifts[1])
    assert.ok(lifts[3] < lifts[2])
    assert.equal(lifts[4], 0)

    for (const progress of [0.25, 0.5, 0.75]) {
      const positions = deformSticker(progress, stickerConfig, width, height, grid)
      const boundary = adhesionBoundary(progress, stickerConfig)
      const flatIx = Math.floor((boundary - 0.02) * grid.widthSegments)
      const flat = vertexAt(positions, grid.cols, Math.max(0, flatIx), midRow)
      const tip = vertexAt(positions, grid.cols, grid.cols - 1, midRow)
      assert.equal(flat.z, 0)
      assert.ok(tip.z > 0.015)
      const length = rowLength(positions, grid.cols, midRow)
      assert.ok(Math.abs(length - width) / width < 0.035, `length ${length} at ${progress}`)
      const sample = vertexAt(positions, grid.cols, Math.floor(grid.cols / 2), midRow)
      const flatY = height / 2 - (midRow / grid.heightSegments) * height
      assert.ok(Math.abs(sample.y - flatY) < 1e-6)
    }
  })

  it('ends as the original flat sheet', () => {
    const positions = deformSticker(1, stickerConfig, width, height, grid)
    for (let iy = 0; iy < grid.rows; iy += 1) {
      for (let ix = 0; ix < grid.cols; ix += 1) {
        const point = vertexAt(positions, grid.cols, ix, iy)
        const x = ix * (width / grid.widthSegments) - width / 2
        const y = -(iy * (height / grid.heightSegments) - height / 2)
        assert.equal(point.z, 0)
        assert.ok(Math.abs(point.x - x) < 1e-6)
        assert.ok(Math.abs(point.y - y) < 1e-6)
      }
    }
    const normals = stickerNormalsInto(new Float32Array(positions.length), positions, grid.cols, grid.rows)
    const normal = vertexAt(normals, grid.cols, 4, midRow)
    assert.ok(normal.z > 0.99)
    assert.ok(shadowOpacity(0, stickerConfig) > shadowOpacity(0.5, stickerConfig))
    assert.ok(shadowOpacity(0.5, stickerConfig) > shadowOpacity(1, stickerConfig))
    assert.ok(shadowOpacity(1, stickerConfig) < 0.06)
  })

  it('can stick from the right without rebuilding the curve', () => {
    const rtl = { ...stickerConfig, direction: 'right-to-left' }
    const positions = deformSticker(0, rtl, width, height, grid)
    const left = vertexAt(positions, grid.cols, 0, midRow)
    const right = vertexAt(positions, grid.cols, grid.cols - 1, midRow)
    assert.ok(left.z > 0.12)
    assert.equal(right.z, 0)
    const again = deformSticker(0.4, stickerConfig, width, height, grid)
    const repeat = deformSticker(0.4, stickerConfig, width, height, grid)
    assert.deepEqual(again, repeat)
  })
})
