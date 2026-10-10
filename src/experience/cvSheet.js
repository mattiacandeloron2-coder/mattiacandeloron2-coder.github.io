import { colors } from '../config.js'

const MAIL_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.6"/><path d="m4 7 8 6 8-6"/></svg>'
const PHONE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'

export function cvSheetStart(core) {
  return {
    left: core.left,
    top: core.top,
    width: core.width,
    height: core.height,
    radius: '50%',
  }
}

export function cvCometCenter(width, height, core) {
  const size = Math.max(core.width, core.height)
  return {
    left: (width - size) / 2,
    top: (height - size) / 2,
    width: size,
    height: size,
    radius: '50%',
  }
}

export function cvCometTrail(core, width, height) {
  const fromX = core.left + core.width / 2
  const fromY = core.top + core.height / 2
  return (Math.atan2(fromY - height / 2, fromX - width / 2) * 180) / Math.PI
}

export function cvSharpStart(width, height, core) {
  const center = cvCometCenter(width, height, core)
  const planeWidth = Math.round(center.width * 3.4)
  const planeHeight = Math.round(Math.max(14, center.width * 0.22))
  return {
    left: (width - planeWidth) / 2,
    top: (height - planeHeight) / 2,
    width: planeWidth,
    height: planeHeight,
    radius: '0px',
  }
}

export function cvSheetOpen(width, height) {
  return {
    left: 0,
    top: 0,
    width,
    height,
    radius: '0px',
  }
}

export function cvSheetFill() {
  return colors.ink
}

export function cvContacts() {
  return [
    {
      href: 'mailto:mattia.candeloron2@gmail.com',
      label: 'mattia.candeloron2@gmail.com',
      icon: 'mail',
    },
    {
      href: 'tel:+393483198226',
      label: '+39 348 319 8226',
      icon: 'phone',
    },
  ]
}

export function cvContactMarkup() {
  const icons = { mail: MAIL_ICON, phone: PHONE_ICON }
  return cvContacts()
    .map(
      (contact) =>
        `<a class="cv-contact" href="${contact.href}">${icons[contact.icon]}<span>${contact.label}</span></a>`,
    )
    .join('')
}

export function applyCvWheel(open, page, deltaY) {
  if (!open || !page) return false
  page.scrollTop += deltaY
  return true
}

export function blowHintAllowed(pointerCoarse, hoverNone) {
  return Boolean(pointerCoarse) && Boolean(hoverNone)
}

export function applySheetBox(el, box) {
  if (!el || !box) return
  el.style.left = `${box.left}px`
  el.style.top = `${box.top}px`
  el.style.width = `${box.width}px`
  el.style.height = `${box.height}px`
  el.style.borderRadius = box.radius
}

export function punchBlack(image, threshold = 28) {
  const srcW = image.naturalWidth || image.width
  const srcH = image.naturalHeight || image.height
  if (!srcW || !srcH) return image
  const scale = Math.min(1, 2200 / Math.max(srcW, srcH))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(srcW * scale))
  canvas.height = Math.max(1, Math.round(srcH * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return image
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = pixels.data
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] <= threshold && data[i + 1] <= threshold && data[i + 2] <= threshold) {
      data[i + 3] = 0
    }
  }
  ctx.putImageData(pixels, 0, 0)
  return canvas
}

export class CvSheet {
  constructor(options = {}) {
    this.sheet = options.sheet
    this.close = options.close
    this.image = options.image
    this.core = options.core
    this.page = options.page
    this.contacts = options.contacts
    this.reducedMotion = Boolean(options.reducedMotion)
    this.open = false
    this.phase = 'idle'
    if (this.contacts) this.contacts.innerHTML = cvContactMarkup()
    this.boundTransition = (event) => this.onSheetTransition(event)
    this.boundAnimation = (event) => this.onSheetAnimation(event)
    this.sheet?.addEventListener('transitionend', this.boundTransition)
    this.sheet?.addEventListener('animationend', this.boundAnimation)
    this.boundClose = (event) => {
      event?.preventDefault()
      this.hide()
    }
    this.boundKey = (event) => {
      if (event.key === 'Escape') this.hide()
    }
    this.boundWheel = (event) => {
      if (applyCvWheel(this.open, this.page, event.deltaY)) event.preventDefault()
    }
    this.close?.addEventListener('click', this.boundClose)
    window.addEventListener('keydown', this.boundKey)
    window.addEventListener('wheel', this.boundWheel, { passive: false })
    this.prepareImage()
  }

  prepareImage() {
    const image = this.image
    if (!image || image.dataset.punched) return
    const punch = () => {
      if (image.dataset.punched) return
      if (!image.naturalWidth || !image.naturalHeight) return
      try {
        const canvas = punchBlack(image)
        if (!canvas || canvas === image || !canvas.width) return
        canvas.className = image.className
        canvas.setAttribute('aria-hidden', 'true')
        image.replaceWith(canvas)
        image.dataset.punched = '1'
        this.image = canvas
      } catch {
        image.dataset.punched = '0'
      }
    }
    const wait = () => {
      if (typeof image.decode === 'function') {
        image.decode().then(punch).catch(punch)
        return
      }
      punch()
    }
    if (image.complete && image.naturalWidth) wait()
    else image.addEventListener('load', wait, { once: true })
  }

  show() {
    if (!this.sheet || !this.core || this.open) return
    this.open = true
    const core = this.core.getBoundingClientRect()
    applySheetBox(this.sheet, cvSheetStart(core))
    this.sheet.style.transform = ''
    this.sheet.style.setProperty('--trail', `${cvCometTrail(core, window.innerWidth, window.innerHeight)}deg`)
    this.sheet.hidden = false
    this.sheet.classList.remove('is-crash', 'is-burst', 'is-open')
    this.sheet.classList.add('is-live')
    this.sheet.setAttribute('aria-hidden', 'false')
    this.core.style.visibility = 'hidden'
    if (this.reducedMotion) {
      this.finishOpen()
      return
    }
    this.phase = 'comet'
    void this.sheet.offsetWidth
    this.sheet.classList.add('is-comet')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.phase !== 'comet') return
        applySheetBox(this.sheet, cvCometCenter(window.innerWidth, window.innerHeight, core))
      })
    })
  }

  finishOpen() {
    applySheetBox(this.sheet, cvSheetOpen(window.innerWidth, window.innerHeight))
    this.sheet.classList.remove('is-comet', 'is-crash')
    this.sheet.classList.add('is-burst', 'is-open')
    this.phase = 'open'
  }

  afterCrash() {
    if (this.phase !== 'crash') return
    clearTimeout(this.crashTimer)
    const core = this.core.getBoundingClientRect()
    this.sheet.classList.remove('is-crash', 'is-comet', 'is-open')
    this.sheet.style.transform = 'none'
    applySheetBox(this.sheet, cvSharpStart(window.innerWidth, window.innerHeight, core))
    void this.sheet.offsetWidth
    this.phase = 'burst'
    this.sheet.classList.add('is-burst')
    requestAnimationFrame(() => {
      if (this.phase !== 'burst') return
      applySheetBox(this.sheet, cvSheetOpen(window.innerWidth, window.innerHeight))
    })
  }

  onSheetTransition(event) {
    if (event.target !== this.sheet) return
    if (this.phase === 'comet' && event.propertyName === 'left') {
      this.phase = 'crash'
      this.sheet.classList.remove('is-comet')
      this.sheet.classList.add('is-crash')
      clearTimeout(this.crashTimer)
      this.crashTimer = setTimeout(() => this.afterCrash(), 160)
      return
    }
    if (this.phase === 'burst' && event.propertyName === 'width') {
      this.phase = 'open'
      this.sheet.classList.add('is-open')
      return
    }
    if (this.phase === 'shrink' && event.propertyName === 'width') {
      this.flyHome()
      return
    }
    if (this.phase === 'return' && event.propertyName === 'left') {
      this.finishHide()
    }
  }

  onSheetAnimation(event) {
    if (event.target !== this.sheet || event.animationName !== 'cv-impact') return
    this.afterCrash()
  }

  flyHome() {
    if (!this.sheet || !this.core) return
    const core = this.core.getBoundingClientRect()
    this.phase = 'return'
    this.sheet.classList.remove('is-burst', 'is-crash', 'is-open')
    this.sheet.style.setProperty(
      '--trail',
      `${cvCometTrail(core, window.innerWidth, window.innerHeight) + 180}deg`,
    )
    void this.sheet.offsetWidth
    this.sheet.classList.add('is-comet')
    applySheetBox(this.sheet, cvSheetStart(core))
  }

  hide() {
    if (!this.sheet || !this.core || !this.open) return
    clearTimeout(this.crashTimer)
    this.sheet.classList.remove('is-open', 'is-crash')
    if (this.reducedMotion) {
      this.finishHide()
      return
    }
    if (this.phase === 'open') {
      const core = this.core.getBoundingClientRect()
      this.phase = 'shrink'
      this.sheet.classList.remove('is-comet')
      this.sheet.classList.add('is-burst')
      applySheetBox(this.sheet, cvCometCenter(window.innerWidth, window.innerHeight, core))
      return
    }
    this.flyHome()
  }

  finishHide() {
    clearTimeout(this.crashTimer)
    this.sheet.style.transform = ''
    this.sheet.classList.remove('is-live', 'is-comet', 'is-crash', 'is-burst', 'is-open')
    this.sheet.hidden = true
    this.sheet.setAttribute('aria-hidden', 'true')
    this.core.style.visibility = ''
    this.open = false
    this.phase = 'idle'
    if (this.page) this.page.scrollTop = 0
  }

  dispose() {
    clearTimeout(this.crashTimer)
    this.sheet?.removeEventListener('transitionend', this.boundTransition)
    this.sheet?.removeEventListener('animationend', this.boundAnimation)
    this.close?.removeEventListener('click', this.boundClose)
    window.removeEventListener('keydown', this.boundKey)
    window.removeEventListener('wheel', this.boundWheel)
  }
}
