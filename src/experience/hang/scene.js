import { Application, MeshRope, Point, Texture } from 'pixi.js'
import { createBraidCanvas, createShadowCanvas } from './braid.js'
import { createHangRopes } from './composition.js'
import { hangConfig, pickTube, settleRopes, stepRopes } from './physics.js'

function syncMeshes(ropes) {
  for (const rope of ropes) {
    const drop = rope.diameter * 0.12
    for (let i = 0; i < rope.points.length; i += 1) {
      const point = rope.points[i]
      rope.meshPoints[i].x = point.x
      rope.meshPoints[i].y = point.y
      rope.shadowPoints[i].x = point.x
      rope.shadowPoints[i].y = point.y + drop
    }
  }
}

function buildMeshes(stage, ropes, braid, shadow) {
  for (const rope of ropes) {
    rope.meshPoints = rope.points.map((point) => new Point(point.x, point.y))
    rope.shadowPoints = rope.points.map((point) => new Point(point.x, point.y))
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
  const braidCanvas = createBraidCanvas()
  const shadowCanvas = createShadowCanvas()

  const place = (event) => {
    const box = stage.getBoundingClientRect()
    return { x: event.clientX - box.left, y: event.clientY - box.top }
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
    clearMeshes(app.stage, ropes)
    grab = null
    ropes = settleRopes(createHangRopes(width, height), 48)
    buildMeshes(app.stage, ropes, braidTexture, shadowTexture)
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
