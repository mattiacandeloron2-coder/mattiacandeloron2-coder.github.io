function fillCrown(ctx, x, y, dir, span, girth) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(dir > 0 ? Math.PI / 4 : -Math.PI / 4)
  const shade = ctx.createLinearGradient(0, -girth, 0, girth)
  shade.addColorStop(0, '#101010')
  shade.addColorStop(0.32, '#3c3c3c')
  shade.addColorStop(0.48, '#6a6a6a')
  shade.addColorStop(0.62, '#343434')
  shade.addColorStop(1, '#080808')
  ctx.fillStyle = shade
  ctx.beginPath()
  ctx.moveTo(-span, 0)
  ctx.quadraticCurveTo(-span * 0.25, girth, 0, girth)
  ctx.quadraticCurveTo(span * 0.25, girth, span, 0)
  ctx.quadraticCurveTo(span * 0.25, -girth, 0, -girth)
  ctx.quadraticCurveTo(-span * 0.25, -girth, -span, 0)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function paintCrowns(ctx, size) {
  const cell = size / 4
  const span = cell * 0.78
  const girth = cell * 0.46
  for (let row = -1; row <= 4; row += 1) {
    for (let col = -1; col <= 4; col += 1) {
      const dir = ((row + col) & 1) === 0 ? 1 : -1
      fillCrown(ctx, (col + 0.5) * cell, (row + 0.5) * cell, dir, span, girth)
    }
  }
}

export function createBraidCanvas(size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#070707'
  ctx.fillRect(0, 0, size, size)
  paintCrowns(ctx, size)
  const rim = ctx.createLinearGradient(0, 0, 0, size)
  rim.addColorStop(0, 'rgba(0, 0, 0, 0.62)')
  rim.addColorStop(0.16, 'rgba(0, 0, 0, 0.12)')
  rim.addColorStop(0.4, 'rgba(255, 255, 255, 0.05)')
  rim.addColorStop(0.55, 'rgba(255, 255, 255, 0.08)')
  rim.addColorStop(0.8, 'rgba(0, 0, 0, 0.16)')
  rim.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
  ctx.fillStyle = rim
  ctx.fillRect(0, 0, size, size)
  return canvas
}

export function createShadowCanvas(size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const shade = ctx.createLinearGradient(0, 0, 0, size)
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(0.28, 'rgba(0, 0, 0, 0.16)')
  shade.addColorStop(0.5, 'rgba(0, 0, 0, 0.22)')
  shade.addColorStop(0.72, 'rgba(0, 0, 0, 0.16)')
  shade.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, size, size)
  return canvas
}
