import { clamp, lerp, smoothstep } from './math.js'

export const INDEX_ORDER = ['01', '02', '03', '04', '05']

const CLOUD_SLOTS = [
  { x: -6, y: -4 },
  { x: 8, y: -6 },
  { x: 1, y: 2 },
  { x: -9, y: 5 },
  { x: 10, y: 6 },
]

const SPACE_SLOTS = [
  { x: -34, y: -10, z: -28, rot: 8 },
  { x: 6, y: -22, z: 6, rot: -4 },
  { x: 8, y: 20, z: 18, rot: 3 },
  { x: 34, y: 2, z: -18, rot: -8 },
  { x: -32, y: 20, z: -4, rot: 5 },
]

export function indexStageOpacity(worksTravelValue) {
  return worksTravelValue > 0 ? 1 : 0
}

export function indexPageShift(worksTravelValue) {
  if (worksTravelValue <= 0) return 1
  if (worksTravelValue >= 1) return 0
  return 1 - worksTravelValue
}

export function indexLook(nx = 0, ny = 0) {
  const x = clamp(nx, -1, 1)
  const y = clamp(ny, -1, 1)
  return {
    yaw: x * 14,
    pitch: y * -8,
    x: x * -5.5,
    y: y * -3.5,
  }
}

export function indexLight(_projectId, _hoveredId) {
  return 1
}

export function indexLive(worksTravelValue) {
  return worksTravelValue > 0.02
}

export function indexEntered(worksTravelValue) {
  return worksTravelValue >= 0.12
}

export function indexMix(worksTravelValue) {
  return smoothstep(0.84, 1, worksTravelValue)
}

export function indexSettled(worksTravelValue) {
  return worksTravelValue >= 0.98
}

export function indexPointerEnabled(worksTravelValue, openId) {
  return indexSettled(worksTravelValue) && !openId
}

export function indexProjects(projects, order = INDEX_ORDER) {
  return order.map((id) => projects.find((project) => project.id === id)).filter(Boolean)
}

export function indexDisplayTitle(project) {
  return project?.indexTitle || project?.title || ''
}

export function indexDate(project) {
  return (project?.lines ?? []).find((line) => /\d+\s*(week|weeks|month|months)/i.test(line)) ?? ''
}

export function indexCursorState(overIndex, overProject) {
  if (!overIndex) return 'off'
  return overProject ? 'view' : 'dot'
}

export function indexShare(projectId, hoveredId) {
  if (!hoveredId) return 1
  return hoveredId === projectId ? 3.4 : 0.62
}

export function indexSpecLines(project) {
  const date = indexDate(project)
  return (project?.lines ?? []).filter((line) => line && line !== date)
}

export function indexCaption(hoveredId, projects) {
  if (!hoveredId) return { title: '', kind: '', date: '' }
  const project = projects.find((item) => item.id === hoveredId)
  return {
    title: indexDisplayTitle(project),
    kind: project?.meta ?? '',
    date: indexDate(project),
  }
}

export function indexCopyVisible(projectId, hoveredId, stacked) {
  if (stacked) return true
  return hoveredId === projectId
}

export function indexDimmed(projectId, hoveredId) {
  return Boolean(hoveredId) && hoveredId !== projectId
}

export function indexButtonVisible(openId) {
  return Boolean(openId)
}

export function nextProjectId(currentId, order = INDEX_ORDER) {
  const index = order.indexOf(currentId)
  if (index < 0) return order[0] ?? null
  return order[(index + 1) % order.length]
}

export function previousProjectId(currentId, order = INDEX_ORDER) {
  const index = order.indexOf(currentId)
  if (index < 0) return order[0] ?? null
  return order[(index - 1 + order.length) % order.length]
}

export function projectSlideVisible(openId, projectId) {
  return Boolean(openId) && openId === projectId
}

export function applyProjectWheel(openId) {
  return Boolean(openId)
}

export function indexImage(project) {
  return project?.indexImage || project?.image || ''
}

function cloudDrift(index, time) {
  const swirl = time * 0.38 + index * 1.256637
  const breathe = 9.2 + Math.sin(time * 0.22 + index * 0.9) * 3.6
  return {
    x: Math.cos(swirl) * breathe * 0.85,
    y: Math.sin(swirl * 0.82) * breathe * 0.62,
  }
}

function stackSlot(index, count) {
  const mid = (count - 1) / 2
  return { x: 0, y: (index - mid) * 22, z: 0, rot: 0 }
}

export function indexItemPose({ index, count, mix, time, stacked }) {
  const home = CLOUD_SLOTS[index] ?? { x: 0, y: 0 }
  const drift = cloudDrift(index, time)
  const cloud = { x: home.x + drift.x, y: home.y + drift.y, z: 0, rot: 0 }
  const slot = stacked
    ? stackSlot(index, count)
    : (SPACE_SLOTS[index] ?? { x: 0, y: 0, z: 0, rot: 0 })
  return {
    x: lerp(cloud.x, slot.x, mix),
    y: lerp(cloud.y, slot.y, mix),
    z: lerp(cloud.z, slot.z, mix),
    rot: lerp(cloud.rot, slot.rot, mix),
  }
}

export class WorksIndex {
  constructor(root, projects, { onOpen, reducedMotion = false } = {}) {
    this.root = root
    this.projects = projects
    this.onOpen = onOpen
    this.reducedMotion = reducedMotion
    this.hoveredId = null
    this.stacked = false
    this.items = []
    this.nameEl = root?.querySelector('[data-works-index-name]') ?? null
    this.titleEl = root?.querySelector('[data-works-index-title]') ?? null
    this.kindEl = root?.querySelector('[data-works-index-kind]') ?? null
    this.ringEl = root?.querySelector('[data-works-index-ring]') ?? null
    if (!root) return

    this.cursor = document.createElement('div')
    this.cursor.className = 'works-index-cursor'
    this.cursor.textContent = 'VIEW'
    this.cursor.setAttribute('aria-hidden', 'true')
    root.appendChild(this.cursor)
    this.onCursorMove = (event) => {
      if (!this.cursor || this.stacked) return
      const state = indexCursorState(true, Boolean(this.hoveredId))
      this.cursor.classList.toggle('is-on', state !== 'off')
      this.cursor.classList.toggle('is-view', state === 'view')
      this.cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
    }
    this.onCursorLeave = () => {
      this.cursor?.classList.remove('is-on', 'is-view')
    }
    root.addEventListener('pointermove', this.onCursorMove)
    root.addEventListener('pointerleave', this.onCursorLeave)

    const stage = root.querySelector('[data-works-index-ring]')
    if (!stage) return
    indexProjects(projects).forEach((project, index) => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'works-index-item'
      item.style.setProperty('--i', String(index))
      item.dataset.projectId = project.id
      const caption = indexCaption(project.id, [project])
      item.setAttribute('aria-label', `${caption.title}, ${caption.kind}`)
      const card = document.createElement('span')
      card.className = 'works-index-card'
      const img = document.createElement('img')
      img.src = indexImage(project)
      img.alt = ''
      img.draggable = false
      img.style.objectPosition = project.imageFocus || 'center'
      card.appendChild(img)
      const copy = document.createElement('span')
      copy.className = 'works-index-copy'
      const title = document.createElement('span')
      title.className = 'works-index-copy-title'
      title.textContent = caption.title
      const date = document.createElement('span')
      date.className = 'works-index-copy-date'
      date.textContent = caption.date
      const head = document.createElement('span')
      head.className = 'works-index-copy-head'
      head.append(title, date)
      copy.append(head)
      const specs = indexSpecLines(project)
      if (specs.length === 0 && caption.kind) specs.push(caption.kind)
      specs.forEach((line) => {
        const spec = document.createElement('span')
        spec.className = 'works-index-copy-kind'
        spec.textContent = line
        copy.append(spec)
      })
      item.append(card, copy)
      item.addEventListener('pointerenter', () => this.hover(project.id))
      item.addEventListener('pointerleave', () => this.hover(null))
      item.addEventListener('focus', () => this.hover(project.id))
      item.addEventListener('blur', () => this.hover(null))
      item.addEventListener('click', () => this.onOpen?.(project.id))
      stage.appendChild(item)
      this.items.push(item)
    })
  }

  hover(id) {
    this.hoveredId = id
    this.root?.classList.toggle('is-hot', Boolean(id))
    if (this.cursor && !this.stacked) {
      const state = indexCursorState(this.cursor.classList.contains('is-on'), Boolean(id))
      this.cursor.classList.toggle('is-view', state === 'view')
    }
    this.items.forEach((item) => {
      const projectId = item.dataset.projectId
      item.classList.toggle('is-hot', projectId === id)
      item.classList.toggle('is-dim', indexDimmed(projectId, id))
      item.classList.toggle('is-copy', indexCopyVisible(projectId, id, this.stacked))
      item.style.setProperty('--light', String(indexLight(projectId, id)))
    })
    const caption = indexCaption(id, this.projects)
    if (this.titleEl && this.kindEl) {
      this.titleEl.textContent = caption.title
      this.kindEl.textContent = caption.kind
    } else if (this.nameEl) {
      this.nameEl.textContent = caption.title
    }
  }

  update(worksTravelValue, openId, time = 0, stacked = false, pointer = { x: 0, y: 0 }) {
    if (!this.root) return
    const live = indexLive(worksTravelValue) && !openId
    const mix = this.reducedMotion && live ? 1 : indexMix(worksTravelValue)
    const ready = this.reducedMotion ? live : indexPointerEnabled(worksTravelValue, openId)
    this.stacked = stacked
    this.root.hidden = !live
    this.root.style.opacity = live ? String(indexStageOpacity(worksTravelValue)) : '0'
    this.root.style.transform = 'none'
    const stage = this.root.querySelector('.works-index-stage')
    if (stage) {
      stage.style.transform = `translate3d(0, ${indexPageShift(worksTravelValue) * 100}vh, 0)`
    }
    const look =
      stacked || this.reducedMotion ? indexLook(0, 0) : indexLook(pointer.x ?? 0, pointer.y ?? 0)
    this.root.style.setProperty('--look-yaw', `${look.yaw}deg`)
    this.root.style.setProperty('--look-pitch', `${look.pitch}deg`)
    this.root.style.setProperty('--look-x', look.x.toFixed(3))
    this.root.style.setProperty('--look-y', look.y.toFixed(3))
    this.root.classList.toggle('is-in', live && indexEntered(worksTravelValue))
    this.root.classList.toggle('is-ready', ready)
    this.root.classList.toggle('is-still', this.reducedMotion)
    this.root.classList.toggle('is-stack', stacked)
    if (stacked) this.cursor?.classList.remove('is-on', 'is-view')
    this.items.forEach((item) => {
      item.classList.toggle(
        'is-copy',
        indexCopyVisible(item.dataset.projectId, this.hoveredId, stacked),
      )
    })
    this.root.setAttribute('aria-hidden', live ? 'false' : 'true')
    const count = this.items.length
    this.items.forEach((item, index) => {
      const pose = indexItemPose({
        index,
        count,
        mix,
        time: this.reducedMotion ? 0 : time,
        stacked,
      })
      item.style.setProperty('--x', pose.x.toFixed(3))
      item.style.setProperty('--y', pose.y.toFixed(3))
      item.style.setProperty('--z', pose.z.toFixed(1))
      item.style.setProperty('--rot', pose.rot.toFixed(2))
      item.style.setProperty('--light', String(indexLight(item.dataset.projectId, this.hoveredId)))
      item.style.setProperty('--share', String(indexShare(item.dataset.projectId, this.hoveredId)))
      item.style.zIndex = String(Math.round(60 + pose.z / 8))
    })
  }
}
