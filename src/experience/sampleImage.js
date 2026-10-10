export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${url}`))
    image.src = url
  })
}

function chromaOf(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b)
}

const CARMINE = { r: 0.831, g: 0.125, b: 0.22 }
const CARMINE_DEEP = { r: 0.64, g: 0.07, b: 0.14 }

function toCarmine(r, g, b, amount) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  const t = Math.min(1, amount)
  const k = 0.72 + Math.min(lum, 0.28) * 1.1
  return {
    r: r * (1 - t) + Math.min(1, CARMINE.r * k + CARMINE_DEEP.r * (1 - k) * 0.25) * t,
    g: g * (1 - t) + Math.min(1, CARMINE.g * k) * t,
    b: b * (1 - t) + Math.min(1, CARMINE.b * k) * t,
    chroma: t * 0.95,
  }
}

function fillSolidFromSeeds(seeds, solid, width, height, radius) {
  const filled = seeds.slice()
  const dist = new Int16Array(width * height)
  dist.fill(-1)
  const queue = []
  for (let i = 0; i < seeds.length; i += 1) {
    if (!seeds[i] || !solid[i]) continue
    dist[i] = 0
    queue.push(i)
  }
  const offsets = [-1, 1, -width, width]
  for (let q = 0; q < queue.length; q += 1) {
    const index = queue[q]
    if (dist[index] >= radius) continue
    const x = index % width
    for (let o = 0; o < 4; o += 1) {
      const next = index + offsets[o]
      if (next < 0 || next >= filled.length) continue
      if (offsets[o] === -1 && x === 0) continue
      if (offsets[o] === 1 && x === width - 1) continue
      if (!solid[next] || dist[next] >= 0) continue
      dist[next] = dist[index] + 1
      filled[next] = 1
      queue.push(next)
    }
  }
  return filled
}

function shuffleInPlace(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = (Math.random() * (i + 1)) | 0
    const tmp = list[i]
    list[i] = list[j]
    list[j] = tmp
  }
  return list
}

function pickCoverage(candidates, target) {
  const drill = []
  const rest = []
  for (let i = 0; i < candidates.length; i += 1) {
    if (candidates[i].chroma > 0.35) drill.push(candidates[i])
    else rest.push(candidates[i])
  }
  shuffleInPlace(drill)
  shuffleInPlace(rest)

  if (drill.length >= target) return drill.slice(0, target)

  const picked = drill.concat(rest.slice(0, Math.max(0, target - drill.length)))
  if (picked.length >= target) return picked.slice(0, target)

  while (picked.length < target) {
    const src = picked[(Math.random() * picked.length) | 0]
    picked.push({
      ...src,
      x: src.x + (Math.random() - 0.5) * 0.45,
      y: src.y + (Math.random() - 0.5) * 0.45,
    })
  }
  return picked
}

/**
 * Sample visible pixels from the silhouette image.
 * Detects true alpha; otherwise treats near-black as the paper/void
 * while keeping the dark charcoal body.
 */
export async function sampleSilhouette(url, options) {
  const image = await loadImage(url)
  const maxDim = options.sampleMax
  const scale = maxDim / Math.max(image.width, image.height)
  const width = Math.max(8, Math.round(image.width * scale))
  const height = Math.max(8, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(image, 0, 0, width, height)
  const { data } = ctx.getImageData(0, 0, width, height)

  let transparentCount = 0
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) transparentCount += 1
  }
  const useAlpha = transparentCount > width * height * 0.02
  const chromaThreshold = options.chromaThreshold ?? 0.11

  const seed = new Uint8Array(width * height)
  const lum = new Uint16Array(width * height)
  for (let i = 0; i < seed.length; i += 1) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const a = data[o + 3]
    lum[i] = r + g + b
    if (useAlpha) {
      seed[i] = a > options.alphaThreshold ? 1 : 0
    } else {
      seed[i] = lum[i] > 28 || chromaOf(r, g, b) > 22 ? 1 : 0
    }
  }

  const solid = seed.slice()
  if (!useAlpha) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x
        if (solid[index] || lum[index] < 8) continue
        let near = false
        for (let dy = -2; dy <= 2 && !near; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
            if (seed[ny * width + nx]) {
              near = true
              break
            }
          }
        }
        if (near) solid[index] = 1
      }
    }
  }

  const chromaSeeds = new Uint8Array(width * height)
  for (let i = 0; i < solid.length; i += 1) {
    if (!solid[i]) continue
    const o = i * 4
    if (chromaOf(data[o], data[o + 1], data[o + 2]) / 255 >= chromaThreshold) {
      chromaSeeds[i] = 1
    }
  }
  const drill = fillSolidFromSeeds(chromaSeeds, solid, width, height, options.carmineRadius ?? 10)

  const candidates = []
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      if (!solid[index]) continue
      const o = index * 4
      let nearest = 4
      for (let dy = -3; dy <= 3; dy += 1) {
        for (let dx = -3; dx <= 3; dx += 1) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height || !solid[ny * width + nx]) {
            nearest = Math.min(nearest, Math.hypot(dx, dy))
          }
        }
      }
      const edge = 1 - Math.min(nearest / 3.2, 1)
      const r = data[o] / 255
      const g = data[o + 1] / 255
      const b = data[o + 2] / 255
      const isDrill = drill[index] && solid[index]
      const mapped = isDrill ? toCarmine(r, g, b, 1) : { r, g, b, chroma: 0 }
      const a = data[o + 3] / 255
      candidates.push({
        x,
        y,
        r: mapped.r,
        g: mapped.g,
        b: mapped.b,
        a: Math.max(a, isDrill ? 1 : 0.9),
        edge,
        chroma: mapped.chroma,
      })
    }
  }

  if (!candidates.length) {
    throw new Error('No visible pixels in silhouette image')
  }

  const picked = pickCoverage(candidates, options.count)

  return { samples: picked, width, height }
}
