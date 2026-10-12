export function createBraidCanvas(size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const tube = ctx.createLinearGradient(0, 0, 0, size)
  tube.addColorStop(0, '#000000')
  tube.addColorStop(0.2, '#101010')
  tube.addColorStop(0.42, '#222222')
  tube.addColorStop(0.58, '#141414')
  tube.addColorStop(0.82, '#0a0a0a')
  tube.addColorStop(1, '#000000')
  ctx.fillStyle = tube
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
