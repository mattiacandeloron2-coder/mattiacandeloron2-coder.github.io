import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mapStagePoint, phoneStageDesign, phoneStageFit } from './phoneStage.js'

describe('phoneStageFit', () => {
  it('fits a desktop frame into a short landscape phone and keeps it centered', () => {
    const fit = phoneStageFit({ width: 1280, height: 590 })
    assert.equal(fit.layoutWidth, phoneStageDesign.width)
    assert.equal(fit.layoutHeight, phoneStageDesign.height)
    assert.ok(fit.layoutHeight > 590)
    assert.ok(fit.layoutWidth * fit.scale <= 1280 + 0.01)
    assert.ok(fit.layoutHeight * fit.scale <= 590 + 0.01)
    const centerX = fit.x + (fit.layoutWidth * fit.scale) / 2
    const centerY = fit.y + (fit.layoutHeight * fit.scale) / 2
    assert.ok(Math.abs(centerX - 640) < 0.01)
    assert.ok(Math.abs(centerY - 295) < 0.01)
  })

  it('centers the frame in the safe area, clear of the notch', () => {
    const fit = phoneStageFit({
      width: 1280,
      height: 590,
      insetLeft: 80,
      insetBottom: 24,
    })
    const boxW = 1200
    const boxH = 566
    const centerX = fit.x + (fit.layoutWidth * fit.scale) / 2
    const centerY = fit.y + (fit.layoutHeight * fit.scale) / 2
    assert.ok(Math.abs(centerX - (80 + boxW / 2)) < 0.1)
    assert.ok(Math.abs(centerY - boxH / 2) < 0.1)
    assert.ok(fit.x >= 80 - 0.01)
    assert.ok(fit.y + fit.layoutHeight * fit.scale <= 590 - 24 + 0.1)
  })

  it('leaves a tall window at its own size', () => {
    const fit = phoneStageFit({ width: 1440, height: 1000 })
    assert.equal(fit.scale, 1)
    assert.equal(fit.layoutWidth, 1440)
    assert.equal(fit.layoutHeight, 1000)
    assert.equal(fit.x, 0)
    assert.equal(fit.y, 0)
  })
})

describe('mapStagePoint', () => {
  it('maps a tap in the middle of the scaled frame to the middle of the desktop layout', () => {
    const frame = { left: 100, top: 20, scale: 0.5, width: 1280, height: 900 }
    const point = mapStagePoint(100 + 320, 20 + 225, frame)
    assert.equal(point.x, 640)
    assert.equal(point.y, 450)
  })
})
