import { Application, Container, MeshRope, Point, Texture } from 'pixi.js'
import { createBraidCanvas, createShadowCanvas } from './braid.js'
import { createHangRopes, hangApplyFit, hangInkBounds, hangLocalPoint, hangViewFit } from './composition.js'
import { hangConfig, pickTube, restRopes, settleRopes, stepRopes } from './physics.js'

function cutCorners(src, dst) {
  dst[0].x = src[0].x
  dst[0].y = src[0].y
  let write = 1
  for (let i = 0; i < src.length - 1; i += 1) {
    const a = src[i]
    const b = src[i + 1]
    dst[write].x = a.x * 0.75 + b.x * 0.25
    dst[write].y = a.y * 0.75 + b.y * 0.25
    write += 1
    dst[write].x = a.x * 0.25 + b.x * 0.75
    dst[write].y = a.y * 0.25 + b.y * 0.75
    write += 1
  }
  dst[write].x = src[src.length - 1].x
  dst[write].y = src[src.length - 1].y
}

function syncMeshes(ropes) {
  for (const rope of ropes) {
    const drop = rope.diameter * 0.12
    cutCorners(rope.points, rope.curve)
    cutCorners(rope.curve, rope.meshPoints)
    const mesh = rope.meshPoints
    const shadow = rope.shadowPoints
    for (let i = 0; i < mesh.length; i += 1) {
      shadow[i].x = mesh[i].x
      shadow[i].y = mesh[i].y + drop
    }
  }
}

function stabilizeRope(mesh) {
  mesh.geometry.updateVertices = function updateVertices() {
    const points = this.points
    const total = points.length
    if (total < 2) return
    const vertices = this.buffers[0].data
    const halfWidth = this.textureScale > 0 ? (this.textureScale * this._width) / 2 : this._width / 2
    let prevNx = 0
    let prevNy = 1
    for (let i = 0; i < total; i += 1) {
      const prev = points[Math.max(0, i - 1)]
      const next = points[Math.min(total - 1, i + 1)]
      let dx = next.x - prev.x
      let dy = next.y - prev.y
      const len = Math.hypot(dx, dy)
      let nx = prevNx
      let ny = prevNy
      if (len > 1e-3) {
        dx /= len
        dy /= len
        nx = -dy
        ny = dx
        if (i > 0 && nx * prevNx + ny * prevNy < 0) {
          nx = -nx
          ny = -ny
        }
      }
      prevNx = nx
      prevNy = ny
      const index = i * 4
      vertices[index] = points[i].x + nx * halfWidth
      vertices[index + 1] = points[i].y + ny * halfWidth
      vertices[index + 2] = points[i].x - nx * halfWidth
      vertices[index + 3] = points[i].y - ny * halfWidth
    }
    this.buffers[0].update()
  }
}

function buildMeshes(stage, ropes, braid, shadow) {
  for (const rope of ropes) {
    const curveCount = rope.points.length * 2
    rope.curve = Array.from({ length: curveCount }, () => new Point())
    rope.meshPoints = Array.from({ length: curveCount * 2 }, () => new Point())
    rope.shadowPoints = Array.from({ length: curveCount * 2 }, () => new Point())
    const shade = new MeshRope({
      texture: shadow,
      points: rope.shadowPoints,
      textureScale: (rope.diameter * 1.2) / shadow.height,
    })
    const mesh = new MeshRope({
      texture: braid,
      points: rope.meshPoints,
      textureScale: rope.diameter / braid.height,
    })
    shade.zIndex = rope.z * 2
    mesh.zIndex = rope.z * 2 + 1
    stabilizeRope(shade)
    stabilizeRope(mesh)
    rope.shade = shade
    rope.mesh = mesh
    stage.addChild(shade, mesh)
  }
}

function clearMeshes(stage, ropes) {
  for (const rope of ropes) {
    rope.mesh?.destroy({ texture: false, textureSource: false })
    rope.shade?.destroy({ texture: false, textureSource: false })
  }
  stage.removeChildren()
}

export function mountHang(stage, { reducedMotion = false } = {}) {
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, movedAt: 0, type: 'mouse' }
  let grab = null
  let ropes = []
  let app = null
  let acc = 0
  let lastW = 0
  let lastH = 0
  let showing = true
  let braidTexture = null
  let shadowTexture = null
  let viewFit = { scale: 1, x: 0, y: 0 }
  const world = new Container()
  const braidCanvas = createBraidCanvas()
  const shadowCanvas = createShadowCanvas()

  const place = (event) => {
    const box = stage.getBoundingClientRect()
    return hangLocalPoint(event.clientX, event.clientY, box, stage.clientWidth, stage.clientHeight, viewFit)
  }

  const cursor = () => {
    if (reducedMotion) {
      stage.style.cursor = 'default'
      return
    }
    if (grab) {
      stage.style.cursor = 'grabbing'
      return
    }
    const hit = pickTube(ropes, pointer.x, pointer.y)
    stage.style.cursor = hit ? 'grab' : 'default'
  }

  const rebuild = () => {
    const width = stage.clientWidth
    const height = stage.clientHeight
    if (width < 2 || height < 2 || !app) return
    clearMeshes(world, ropes)
    grab = null
    ropes = settleRopes(createHangRopes(width, height), 48)
    const phone = document.documentElement.classList.contains('is-landscape-phone')
    if (phone) hangApplyFit(ropes, hangViewFit(hangInkBounds(ropes), width, height))
    viewFit = { scale: 1, x: 0, y: 0 }
    buildMeshes(world, ropes, braidTexture, shadowTexture)
    syncMeshes(ropes)
    lastW = width
    lastH = height
    if (reducedMotion) app.render()
  }

  const step = (dtMs) => {
    const now = performance.now()
    if (now - pointer.movedAt > 70) {
      pointer.vx = 0
      pointer.vy = 0
    }
    if (grab && now - grab.movedAt > 40) {
      grab.vx = 0
      grab.vy = 0
    }
    acc += Math.min(dtMs, 48)
    let steps = 0
    while (acc >= 1000 / 60 && steps < hangConfig.maxSubsteps) {
      stepRopes(ropes, hangConfig.fixedDt, hangConfig, {
        pointer: pointer.type === 'touch' ? null : pointer,
        grab,
      })
      restRopes(ropes, hangConfig.restLimit, grab?.id ?? null)
      acc -= 1000 / 60
      steps += 1
    }
    syncMeshes(ropes)
  }

  const beginGrab = (point, pointerId, pointerType) => {
    if (reducedMotion) return false
    const hit = pickTube(ropes, point.x, point.y)
    if (!hit) return false
    pointer.x = point.x
    pointer.y = point.y
    pointer.type = pointerType
    grab = {
      id: hit.id,
      index: hit.index,
      x: point.x,
      y: point.y,
      vx: 0,
      vy: 0,
      movedAt: performance.now(),
      pointerId,
    }
    cursor()
    return true
  }

  const onDown = (event) => {
    if (event.button > 0) return
    const point = place(event)
    if (!beginGrab(point, event.pointerId, event.pointerType || 'mouse')) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }

  const onMove = (event) => {
    const point = place(event)
    const now = performance.now()
    const travel = Math.hypot(point.x - pointer.x, point.y - pointer.y)
    const holding = grab && (grab.pointerId == null || event.pointerId === grab.pointerId)
    if (!holding && travel < 2) {
      cursor()
      return
    }
    const dt = Math.max(8, now - pointer.movedAt) / 1000
    pointer.vx = (point.x - pointer.x) / dt
    pointer.vy = (point.y - pointer.y) / dt
    pointer.x = point.x
    pointer.y = point.y
    pointer.movedAt = now
    pointer.type = event.pointerType || 'mouse'
    if (grab && event.pointerId === grab.pointerId) {
      grab.vx = pointer.vx
      grab.vy = pointer.vy
      grab.x = point.x
      grab.y = point.y
      grab.movedAt = now
    } else if (grab && grab.pointerId == null) {
      grab.vx = pointer.vx
      grab.vy = pointer.vy
      grab.x = point.x
      grab.y = point.y
      grab.movedAt = now
    }
    cursor()
  }

  const onUp = (event) => {
    if (!grab) return
    if (grab.pointerId != null && event.pointerId !== grab.pointerId) return
    grab = null
    cursor()
  }

  const boot = async () => {
    app = new Application()
    await app.init({
      backgroundAlpha: 0,
      resizeTo: stage,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    })
    app.stage.sortableChildren = true
    app.stage.addChild(world)
    world.sortableChildren = true
    braidTexture = Texture.from(braidCanvas)
    shadowTexture = Texture.from(shadowCanvas)
    app.ticker.stop()
    stage.appendChild(app.canvas)
    app.canvas.addEventListener('pointerdown', onDown)
    app.canvas.addEventListener('pointermove', onMove)
    app.canvas.addEventListener('pointerup', onUp)
    app.canvas.addEventListener('pointercancel', onUp)
    app.canvas.addEventListener('pointerleave', () => {
      pointer.vx = 0
      pointer.vy = 0
      if (!grab) cursor()
    })
    app.canvas.addEventListener(
      'touchstart',
      (event) => {
        const point = place(event.touches[0])
        if (!beginGrab(point, null, 'touch')) return
        event.stopPropagation()
        event.preventDefault()
      },
      { passive: false },
    )
    const stopTouch = (event) => {
      if (!grab) return
      event.stopPropagation()
      event.preventDefault()
    }
    app.canvas.addEventListener('touchmove', stopTouch, { passive: false })
    app.canvas.addEventListener('touchend', stopTouch, { passive: false })
    app.ticker.add(() => {
      if (!showing || reducedMotion) return
      step(app.ticker.deltaMS)
    })
    rebuild()
    if (!reducedMotion && showing) app.ticker.start()
  }

  const ready = boot()

  const observer = new ResizeObserver(() => {
    const width = stage.clientWidth
    const height = stage.clientHeight
    if (!app || Math.abs(width - lastW) < 4 && Math.abs(height - lastH) < 4) return
    rebuild()
  })
  observer.observe(stage)

  return {
    sync(next) {
      showing = next
      ready.then(() => {
        if (!app) return
        if (showing && !reducedMotion) app.ticker.start()
        else app.ticker.stop()
      })
    },
  }
}
