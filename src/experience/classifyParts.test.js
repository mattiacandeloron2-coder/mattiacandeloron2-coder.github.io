import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { PART, createPartClassifier } from './classifyParts.js'

function loadGlbPositions() {
  const glbPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/models/model.glb')
  const buf = fs.readFileSync(glbPath)
  const jsonLen = buf.readUInt32LE(12)
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'))
  const bin = buf.subarray(20 + jsonLen + 8)
  const acc = json.accessors[0]
  const view = json.bufferViews[acc.bufferView]
  const start = (view.byteOffset || 0) + (acc.byteOffset || 0)
  return new Float32Array(bin.buffer, bin.byteOffset + start, acc.count * 3)
}

function samplePositions(all) {
  const packed = []
  for (let i = 0; i < all.length; i += 24) packed.push(all[i], all[i + 1], all[i + 2])
  return Float32Array.from(packed)
}

function bounds(positions) {
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const y = positions[i + 1]
    const z = positions[i + 2]
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }
  return { minX, minY, minZ, maxX, maxY, maxZ, sizeY: maxY - minY, sizeZ: maxZ - minZ }
}

describe('createPartClassifier', () => {
  it('paints the figure black and the chair backrest azure from every side', () => {
    const positions = samplePositions(loadGlbPositions())
    const classifier = createPartClassifier(positions, { grid: 48 })
    const box = bounds(positions)
    const tally = [0, 0, 0]
    let figureBody = 0
    let figureAll = 0
    let backHeld = 0
    let backAll = 0
    let backTopHeld = 0
    let backTopAll = 0
    let feetBody = 0
    let feetAll = 0

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      const part = classifier.classify(x, y, z)
      tally[part] += 1
      const yn = (y - box.minY) / box.sizeY
      const zn = (z - box.minZ) / box.sizeZ
      if (zn < 0.28 && yn > 0.45 && yn < 0.75) {
        figureAll += 1
        if (part === PART.BODY) figureBody += 1
      }
      if (zn > 0.42 && zn < 0.62 && yn > 0.58 && yn < 0.88) {
        backAll += 1
        if (part === PART.HELD) backHeld += 1
      }
      if (yn > 0.85 && zn > 0.4 && zn < 0.62) {
        backTopAll += 1
        if (part === PART.HELD) backTopHeld += 1
      }
      if (zn > 0.45 && zn < 0.7 && yn < 0.35 && part !== PART.DRILL) {
        feetAll += 1
        if (part === PART.BODY) feetBody += 1
      }
    }

    const total = tally[0] + tally[1] + tally[2]
    const body = tally[PART.BODY] / total
    const held = tally[PART.HELD] / total
    const drill = tally[PART.DRILL] / total
    assert.ok(body > 0.55 && body < 0.82, `body ${body}`)
    assert.ok(held > 0.14 && held < 0.4, `held ${held}`)
    assert.ok(drill > 0.03 && drill < 0.09, `drill ${drill}`)
    assert.ok(figureBody / figureAll > 0.9, `figure body ${figureBody / figureAll}`)
    assert.ok(backHeld / backAll > 0.7, `backrest held ${backHeld / backAll}`)
    assert.ok(backTopHeld / backTopAll > 0.7, `backrest top held ${backTopHeld / backTopAll}`)
    assert.ok(feetBody / feetAll > 0.9, `feet body ${feetBody / feetAll}`)
  })
})
