import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { labelOcclusionOpacity } from './math.js'

describe('labelOcclusionOpacity', () => {
  const cam = [0, 0.1, 3.7]
  const look = [0, 0.02, 0]
  const radius = 0.4

  it('keeps a side label fully readable', () => {
    const side = [1.14, 0.18, 0]
    assert.ok(labelOcclusionOpacity(cam, look, side, radius) > 0.95)
  })

  it('hides a label sitting behind the figure', () => {
    const behind = [0.04, 0.1, -0.55]
    assert.ok(labelOcclusionOpacity(cam, look, behind, radius) < 0.12)
  })

  it('hides a label that would overlay the figure in front', () => {
    const overlay = [0.06, 0.08, 0.35]
    assert.ok(labelOcclusionOpacity(cam, look, overlay, radius) < 0.12)
  })
})
