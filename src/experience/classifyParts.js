export const PART = {
  BODY: 0,
  HELD: 1,
  DRILL: 2,
}

function keyOf(x, y, z, nx, ny) {
  return x + y * nx + z * nx * ny
}

function voxelize(positions, nx, ny, nz, min, size) {
  const occ = new Uint8Array(nx * ny * nz)
  const count = positions.length / 3
  for (let i = 0; i < count; i += 1) {
    const ix = Math.min(nx - 1, Math.max(0, Math.floor(((positions[i * 3] - min[0]) / size[0]) * (nx - 1))))
    const iy = Math.min(ny - 1, Math.max(0, Math.floor(((positions[i * 3 + 1] - min[1]) / size[1]) * (ny - 1))))
    const iz = Math.min(nz - 1, Math.max(0, Math.floor(((positions[i * 3 + 2] - min[2]) / size[2]) * (nz - 1))))
    occ[keyOf(ix, iy, iz, nx, ny)] = 1
  }
  return occ
}

function connectedComponents(occ, nx, ny, nz) {
  const labels = new Int32Array(occ.length)
  labels.fill(-1)
  const comps = []
  const neigh = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]
  let cid = 0
  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        const k = keyOf(x, y, z, nx, ny)
        if (!occ[k] || labels[k] >= 0) continue
        const q = [[x, y, z]]
        labels[k] = cid
        let n = 1
        let sx = 0
        let sy = 0
        let sz = 0
        for (let qi = 0; qi < q.length; qi += 1) {
          const [cx, cy, cz] = q[qi]
          sx += cx
          sy += cy
          sz += cz
          for (let ni = 0; ni < 6; ni += 1) {
            const nx_ = cx + neigh[ni][0]
            const ny_ = cy + neigh[ni][1]
            const nz_ = cz + neigh[ni][2]
            if (nx_ < 0 || ny_ < 0 || nz_ < 0 || nx_ >= nx || ny_ >= ny || nz_ >= nz) continue
            const nk = keyOf(nx_, ny_, nz_, nx, ny)
            if (!occ[nk] || labels[nk] >= 0) continue
            labels[nk] = cid
            q.push([nx_, ny_, nz_])
            n += 1
          }
        }
        comps.push({ id: cid, n, cz: sz / n, cx: sx / n, cy: sy / n })
        cid += 1
      }
    }
  }
  comps.sort((a, b) => b.n - a.n)
  return { comps, labels }
}

function nearestPart(part, x, y, z, nx, ny, nz) {
  let best = PART.BODY
  let bestD = Infinity
  const r = 8
  for (let dz = -r; dz <= r; dz += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        const xx = x + dx
        const yy = y + dy
        const zz = z + dz
        if (xx < 0 || yy < 0 || zz < 0 || xx >= nx || yy >= ny || zz >= nz) continue
        const p = part[keyOf(xx, yy, zz, nx, ny)]
        if (p < 0) continue
        const d = dx * dx + dy * dy + dz * dz
        if (d < bestD) {
          bestD = d
          best = p
        }
      }
    }
  }
  return best
}

/**
 * Azure = chair frame and the tall backrest. The hunched figure sits lower than
 * the backrest, so Y-max is the chair — not a skull to protect.
 * Black = seated figure (head, body, feet). Carmine = isolated drill.
 */
function findBackrestGap(labels, main, backrestZ, towardDrill, nx, ny, nz) {
  const highY = Math.round(ny * 0.7)
  const counts = new Int32Array(nz)
  for (let z = 0; z < nz; z += 1) {
    for (let y = highY; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        const k = keyOf(x, y, z, nx, ny)
        if (labels[k] === main.id) counts[z] += 1
      }
    }
  }
  const dir = -towardDrill
  let z = Math.round(backrestZ)
  z = Math.min(nz - 1, Math.max(0, z))
  while (z >= 0 && z < nz && counts[z] > 0) z += dir
  const gapStart = z
  while (z >= 0 && z < nz && counts[z] === 0) z += dir
  if (z !== gapStart && z >= 0 && z < nz) return (gapStart + z - dir) * 0.5
  return backrestZ + dir * Math.max(4, Math.round(nz * 0.08))
}

function paintChair(part, labels, main, drill, nx, ny, nz) {
  let topY = -1
  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        const k = keyOf(x, y, z, nx, ny)
        if (labels[k] !== main.id) continue
        if (y > topY) topY = y
      }
    }
  }
  if (topY < 0) return

  let backrestZ = 0
  let backrestN = 0
  const topBand = Math.max(3, Math.round(ny * 0.08))
  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        const k = keyOf(x, y, z, nx, ny)
        if (labels[k] !== main.id || y < topY - topBand) continue
        backrestZ += z
        backrestN += 1
      }
    }
  }
  if (!backrestN) return
  backrestZ /= backrestN

  const towardDrill = drill.cz >= backrestZ ? 1 : -1
  const span = Math.abs(drill.cz - backrestZ)
  const frameCutZ = backrestZ + towardDrill * span * 0.18
  const gapZ = findBackrestGap(labels, main, backrestZ, towardDrill, nx, ny, nz)
  const backrestMinY = Math.round(ny * 0.52)
  const feetY = Math.round(ny * 0.38)
  const farChairZ = (frameCutZ + drill.cz) / 2

  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        const k = keyOf(x, y, z, nx, ny)
        if (labels[k] !== main.id || part[k] === PART.DRILL) continue
        const onFrame = towardDrill > 0 ? z >= frameCutZ : z <= frameCutZ
        const onBackrest = y >= backrestMinY && (towardDrill > 0 ? z >= gapZ : z <= gapZ)
        if (onFrame || onBackrest) part[k] = PART.HELD
        const towardDrillZ = towardDrill > 0 ? z > backrestZ : z < backrestZ
        const farChair = towardDrill > 0 ? z > farChairZ : z < farChairZ
        if (towardDrillZ && y < feetY && !farChair && part[k] === PART.HELD) part[k] = PART.BODY
      }
    }
  }
}

/**
 * Paint the seated figure: figure black, chair backrest azure, drill carmine.
 */
export function createPartClassifier(positions, { grid = 48 } = {}) {
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity
  const count = positions.length / 3
  for (let i = 0; i < count; i += 1) {
    const x = positions[i * 3]
    const y = positions[i * 3 + 1]
    const z = positions[i * 3 + 2]
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }

  const size = [Math.max(maxX - minX, 1e-4), Math.max(maxY - minY, 1e-4), Math.max(maxZ - minZ, 1e-4)]
  const nx = grid
  const ny = grid
  const nz = Math.max(8, Math.round(grid * (size[2] / Math.max(size[0], size[1]))))
  const min = [minX, minY, minZ]
  const occ = voxelize(positions, nx, ny, nz, min, size)
  const { comps, labels } = connectedComponents(occ, nx, ny, nz)
  const part = new Int8Array(occ.length)
  part.fill(-1)

  if (!comps.length) {
    return {
      classify() {
        return PART.BODY
      },
    }
  }

  const largest = comps[0]
  const others = comps.filter((c) => c !== largest && c.n < largest.n * 0.3)
  others.sort((a, b) => a.cy - b.cy || a.n - b.n)
  const drill = others[0] ?? null
  const rest = comps.filter((c) => c !== drill)

  if (drill) {
    for (let i = 0; i < labels.length; i += 1) {
      if (labels[i] === drill.id) part[i] = PART.DRILL
    }
  }

  const main = rest.reduce((a, b) => (a.n >= b.n ? a : b), rest[0] ?? largest)
  for (let i = 0; i < labels.length; i += 1) {
    if (part[i] === PART.DRILL) continue
    if (labels[i] >= 0) part[i] = PART.BODY
  }
  if (drill && main) paintChair(part, labels, main, drill, nx, ny, nz)

  for (let z = 0; z < nz; z += 1) {
    for (let y = 0; y < ny; y += 1) {
      for (let x = 0; x < nx; x += 1) {
        const k = keyOf(x, y, z, nx, ny)
        if (!occ[k] || part[k] >= 0) continue
        part[k] = nearestPart(part, x, y, z, nx, ny, nz)
      }
    }
  }

  function toVoxel(x, y, z) {
    return [
      Math.min(nx - 1, Math.max(0, Math.floor(((x - min[0]) / size[0]) * (nx - 1)))),
      Math.min(ny - 1, Math.max(0, Math.floor(((y - min[1]) / size[1]) * (ny - 1)))),
      Math.min(nz - 1, Math.max(0, Math.floor(((z - min[2]) / size[2]) * (nz - 1)))),
    ]
  }

  return {
    classify(x, y, z) {
      const [ix, iy, iz] = toVoxel(x, y, z)
      const k = keyOf(ix, iy, iz, nx, ny)
      if (part[k] >= 0) return part[k]
      return nearestPart(part, ix, iy, iz, nx, ny, nz)
    },
  }
}
