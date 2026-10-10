import * as THREE from 'three'
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { config, isMobileQuery, reducedMotionQuery, colors } from '../config.js'
import { introOpacity, outroOpacity, clamp } from './math.js'
import { ScrollController } from './ScrollController.js'
import { WorksStrip, sceneLift, scrollMax, worksTravel } from './worksStrip.js'
import { WorksIndex, applyProjectWheel, indexButtonVisible, nextProjectId, previousProjectId } from './worksIndex.js'
import { PortfolioSheet } from './portfolioSheet.js'
import { SkipNebula } from './skipNebula.js'
import { CvSheet, blowHintAllowed } from './cvSheet.js'
import { CameraRig } from './CameraRig.js'
import { ParticleFigure } from './ParticleFigure.js'
import { Sections } from './Sections.js'
import { BreathMic } from './breath.js'
import {
  TRAIL_MAX,
  applyStroke,
  blowScale,
  classifyMouse,
  classifyTouch,
  pathTail,
  pointerEventPoints,
  resamplePath,
  rollingSpeed,
  spaceEnvelope,
  touchModeFromMove,
} from './pointerField.js'

export class Experience {
  constructor({ webglParent, cssParent }) {
    this.webglParent = webglParent
    this.cssParent = cssParent
    this.mobile = window.matchMedia(isMobileQuery).matches
    this.reducedMotion = window.matchMedia(reducedMotionQuery).matches
    this.clock = new THREE.Clock()
    this.running = true
    this.ndc = new THREE.Vector2()
    this.mouseWorld = new THREE.Vector3()
    this.camDir = new THREE.Vector3()
    this.ray = new THREE.Raycaster()
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    this.localHit = new THREE.Vector3()
    this.pointerSpeed = 0
    this.pointerX = 0
    this.pointerY = 0
    this.pointerT = 0
    this.pointerReady = false
    this.pointerPath = []
    this.pointerMarks = []
    this.fieldPointerX = null
    this.fieldPointerY = null
    this.touchPath = []
    this.touchMarks = []
    this.fieldTouchX = null
    this.fieldTouchY = null
    this.fieldTrail = []
    this.strokePoints = []
    this.lastGesture = 'none'
    this.gustAge = 99
    this.blewOnce = false
    this.lastLocal = new THREE.Vector3()
    this.lastCutDir = new THREE.Vector3(1, 0, 0)
    this.hasLastLocal = false
    this.touchSpeed = 0
    this.touch = {
      mode: 'none',
      turning: false,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      lastT: 0,
      startT: 0,
    }
    this.breath = null

    this.heroEl = document.querySelector('[data-hero]')
    this.heroBackEl = document.querySelector('[data-hero-back]')
    this.roleEl = document.querySelector('[data-role]')
    this.hintEl = document.querySelector('[data-scroll-hint]')
    this.metaEl = document.querySelector('[data-meta]')
    this.outroEl = document.querySelector('[data-outro]')
    this.worksEl = document.querySelector('[data-works]')
    this.overlayEl = document.querySelector('.overlay')
    this.typeBackEl = document.querySelector('.type-back')
    this.blowHintEl = document.querySelector('[data-blow-hint]')
    this.indexBackEl = document.querySelector('[data-index-back]')
    this.openProjectId = null

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(colors.paper)
    this.cssScene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(
      config.camera.fov,
      window.innerWidth / window.innerHeight,
      config.camera.near,
      config.camera.far,
    )

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.mobile,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(colors.paper, 1)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NoToneMapping
    this.webglParent.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.pointerEvents = 'none'

    this.cssRenderer = new CSS2DRenderer()
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight)
    this.cssRenderer.domElement.style.pointerEvents = 'none'
    this.cssParent.appendChild(this.cssRenderer.domElement)

    this.hemi = new THREE.HemisphereLight(0xf7f7f4, 0xe8e8e4, 0.92)
    this.key = new THREE.DirectionalLight(0xffffff, 0.82)
    this.key.position.set(0.8, 1.2, 1.4)
    this.fill = new THREE.DirectionalLight(0xb8cdd2, 0.38)
    this.fill.position.set(-1.1, 0.3, 0.9)
    this.rim = new THREE.DirectionalLight(0xc7d2c7, 0.14)
    this.rim.position.set(-0.6, 0.9, -1.6)
    this.scene.add(this.hemi, this.rim)
    this.scene.add(this.camera)
    this.camera.add(this.key, this.fill)

    this.rig = new CameraRig(this.camera, config.camera)
    this.scroll = new ScrollController(config.scroll)
    this.portfolio = new PortfolioSheet()
    this.works = new WorksStrip(this.worksEl, config.projects, {
      reducedMotion: this.reducedMotion,
      onNext: () => {
        const id = nextProjectId(this.openProjectId)
        if (id) this.openProject(id)
      },
      onPrevious: () => {
        const id = previousProjectId(this.openProjectId)
        if (id) this.openProject(id)
      },
      onCompact: () => this.portfolio.open(),
      onRefresh: () => {
        this.closeProject()
        this.scroll.target = 0
        this.scroll.current = 0
        this.scroll.velocity = 0
      },
    })
    this.scroll.onLocked = (event) => {
      if (this.cvSheet?.open || this.portfolio?.isOpen) return
      this.works.nudge(event.deltaY, event.deltaMode)
    }
    this.worksIndex = new WorksIndex(document.querySelector('[data-works-index]'), config.projects, {
      reducedMotion: this.reducedMotion,
      onOpen: (id) => this.openProject(id),
    })
    this.skip = new SkipNebula(document.querySelector('[data-skip]'), {
      reducedMotion: this.reducedMotion,
      onSkip: () => {
        this.cvSheet?.show()
      },
    })
    this.cvSheet = new CvSheet({
      sheet: document.querySelector('[data-cv-sheet]'),
      close: document.querySelector('[data-cv-close]'),
      image: document.querySelector('[data-cv-image]'),
      core: document.querySelector('[data-skip-core]'),
      page: document.querySelector('[data-cv-page]'),
      contacts: document.querySelector('[data-cv-contacts]'),
      reducedMotion: this.reducedMotion,
    })
    this.syncScrollMax()
    this.figure = new ParticleFigure(this.scene, config.figure, {
      mobile: this.mobile,
      reducedMotion: this.reducedMotion,
    })
    this.sections = new Sections(this.cssScene, config.sections, {
      introEnd: config.scroll.introEnd,
      orbitStart: config.camera.orbitStart,
      orbitTurns: config.camera.orbitTurns,
      mobile: this.mobile,
    })

    this.onResize = this.onResize.bind(this)
    this.onFrame = this.onFrame.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onTouchStart = this.onTouchStart.bind(this)
    this.onTouchMove = this.onTouchMove.bind(this)
    this.onTouchEnd = this.onTouchEnd.bind(this)
    this.onBlowHint = this.onBlowHint.bind(this)
    this.openProject = this.openProject.bind(this)
    this.closeProject = this.closeProject.bind(this)
    this.onIndexKey = this.onIndexKey.bind(this)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('touchstart', this.onTouchStart, { passive: true })
    window.addEventListener('touchmove', this.onTouchMove, { passive: false })
    window.addEventListener('touchend', this.onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', this.onTouchEnd, { passive: true })
    window.addEventListener('keydown', this.onIndexKey)
    this.blowHintEl?.addEventListener('click', this.onBlowHint)
    this.indexBackEl?.addEventListener('click', this.closeProject)
    this.applyLayout()
  }

  async start() {
    await this.figure.load()
    this.applyLayout()
    if (this.mobile && !this.reducedMotion) {
      this.breath = new BreathMic()
      await this.breath.start()
      await this.breath.resume()
    }
    this.onFrame()
  }

  applyLayout() {
    this.mobile = window.matchMedia(isMobileQuery).matches
    document.body.classList.toggle('is-narrow', this.mobile)
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const hoverNone = window.matchMedia('(hover: none)').matches
    if (this.blowHintEl) this.blowHintEl.hidden = !blowHintAllowed(coarse, hoverNone) || this.blewOnce
    const height = this.mobile ? config.figure.heightMobile : config.figure.height
    const position = this.mobile ? config.figure.positionMobile : config.figure.position
    const distance = this.mobile ? config.camera.distanceMobile : config.camera.distance
    const lookAt = this.mobile ? config.camera.lookAtMobile : config.camera.lookAt
    this.figure.applyLayout(height, position)
    this.rig.setFraming(distance, lookAt)
    this.sections.setMobile(this.mobile)
    this.syncScrollMax()
  }

  syncScrollMax() {
    this.scroll.setMax(scrollMax(config.projects.length, window.innerHeight, config.scroll.distance))
  }

  setNdc(clientX, clientY) {
    this.ndc.x = (clientX / window.innerWidth) * 2 - 1
    this.ndc.y = -(clientY / window.innerHeight) * 2 + 1
  }

  onPointerMove(event) {
    const now = performance.now()
    const points = pointerEventPoints(event)
    const last = points[points.length - 1]
    if (!last) return
    this.pointerX = last.x
    this.pointerY = last.y
    this.pointerT = now
    this.pointerReady = true
    for (const pt of points) {
      this.pointerPath.push(pt)
      this.pointerMarks.push({ x: pt.x, y: pt.y, t: now })
    }
    if (this.pointerPath.length > 256) this.pointerPath.splice(0, this.pointerPath.length - 256)
    while (this.pointerMarks.length && this.pointerMarks[0].t < now - 200) this.pointerMarks.shift()
    this.setNdc(last.x, last.y)
  }

  onTouchStart(event) {
    if (this.cvSheet?.open || this.portfolio?.isOpen) return
    if (!event.touches.length) return
    const target = event.target
    if (target instanceof Element && target.closest('.works-idea-stage')) {
      this.touch.turning = true
      return
    }
    this.touch.turning = false
    if (applyProjectWheel(this.openProjectId)) {
      if (this.works.canNudge()) this.touch.lastY = event.touches[0].clientY
      return
    }
    const touch = event.touches[0]
    this.touch.mode = 'pending'
    this.touch.startX = touch.clientX
    this.touch.startY = touch.clientY
    this.touch.lastX = touch.clientX
    this.touch.lastY = touch.clientY
    this.touch.lastT = performance.now()
    this.touch.startT = this.touch.lastT
    this.touchSpeed = 0
    this.touchPath = [{ x: touch.clientX, y: touch.clientY }]
    this.touchMarks = [{ x: touch.clientX, y: touch.clientY, t: this.touch.lastT }]
    this.fieldTouchX = touch.clientX
    this.fieldTouchY = touch.clientY
    this.setNdc(touch.clientX, touch.clientY)
  }

  onTouchMove(event) {
    if (this.cvSheet?.open || this.portfolio?.isOpen) return
    if (!event.touches.length) return
    if (this.touch.turning) {
      event.preventDefault()
      return
    }
    if (applyProjectWheel(this.openProjectId)) {
      if (this.works.canNudge()) {
        event.preventDefault()
        const touch = event.touches[0]
        this.works.nudge(this.touch.lastY - touch.clientY, 0)
        this.touch.lastY = touch.clientY
      }
      return
    }
    event.preventDefault()
    const touch = event.touches[0]
    const now = performance.now()
    const moved = Math.hypot(touch.clientX - this.touch.startX, touch.clientY - this.touch.startY)
    const stillElapsed = now - this.touch.startT
    if (this.touch.mode !== 'scroll') {
      this.touch.mode = touchModeFromMove({ moved, stillElapsed })
    }
    if (this.touch.mode === 'scroll') {
      this.scroll.applyTouchDelta(this.touch.lastY - touch.clientY)
    }
    this.touch.lastX = touch.clientX
    this.touch.lastY = touch.clientY
    this.touch.lastT = now
    this.touchPath.push({ x: touch.clientX, y: touch.clientY })
    if (this.touchPath.length > 256) this.touchPath.splice(0, this.touchPath.length - 256)
    this.touchMarks.push({ x: touch.clientX, y: touch.clientY, t: now })
    while (this.touchMarks.length && this.touchMarks[0].t < now - 200) this.touchMarks.shift()
    this.setNdc(touch.clientX, touch.clientY)
  }

  onTouchEnd() {
    this.touch.turning = false
    this.touch.mode = 'none'
    this.touchSpeed = 0
    this.touchPath = []
    this.touchMarks = []
    this.fieldTouchX = null
    this.fieldTouchY = null
  }

  async onBlowHint() {
    if (!this.breath) this.breath = new BreathMic()
    await this.breath.start()
    await this.breath.resume()
  }

  openProject(id) {
    this.openProjectId = id
    this.scroll.locked = true
    this.worksIndex?.hover(null)
  }

  closeProject() {
    this.openProjectId = null
    this.scroll.locked = false
  }

  onIndexKey(event) {
    if (event.key !== 'Escape' || this.cvSheet?.open) return
    if (this.portfolio?.isOpen) {
      this.portfolio.close()
      return
    }
    if (!this.openProjectId) return
    if (this.works?.dismissPoster()) return
    this.closeProject()
  }

  updateMouse() {
    this.camera.getWorldDirection(this.camDir)
    this.plane.setFromNormalAndCoplanarPoint(this.camDir, this.rig.lookAt)
    this.ray.setFromCamera(this.ndc, this.camera)
    this.ray.ray.intersectPlane(this.plane, this.mouseWorld)
  }

  hideBlowHint() {
    if (this.blewOnce) return
    this.blewOnce = true
    this.blowHintEl?.classList.add('is-gone')
  }

  takePathChain() {
    const mobile = this.mobile
    const path = mobile ? this.touchPath : this.pointerPath
    const lastX = mobile ? this.fieldTouchX : this.fieldPointerX
    const lastY = mobile ? this.fieldTouchY : this.fieldPointerY
    const chain = lastX != null && lastY != null ? [{ x: lastX, y: lastY }, ...path] : path.slice()
    const latest = path.length
      ? path[path.length - 1]
      : lastX != null && lastY != null
        ? { x: lastX, y: lastY }
        : null
    if (mobile) {
      this.touchPath = latest ? [latest] : []
      this.fieldTouchX = latest ? latest.x : null
      this.fieldTouchY = latest ? latest.y : null
    } else {
      this.pointerPath = latest ? [latest] : []
      this.fieldPointerX = latest ? latest.x : null
      this.fieldPointerY = latest ? latest.y : null
    }
    return chain
  }

  pushCutSamples(points, amp, now = performance.now()) {
    const along = resamplePath(points, TRAIL_MAX)
    this.fieldTrail = []
    this.hasLastLocal = false
    for (const pt of along) {
      this.setNdc(pt.x, pt.y)
      this.updateMouse()
      this.figure.toLocal(this.mouseWorld, this.localHit)
      if (this.hasLastLocal) {
        this.lastCutDir.subVectors(this.localHit, this.lastLocal)
        if (this.lastCutDir.lengthSq() < 1e-8) this.lastCutDir.set(1, 0, 0)
        else this.lastCutDir.normalize()
      }
      this.fieldTrail.push({
        x: this.localHit.x,
        y: this.localHit.y,
        z: this.localHit.z,
        dx: this.lastCutDir.x,
        dy: this.lastCutDir.y,
        dz: this.lastCutDir.z,
        amp,
        t: pt.t,
        age: pt.t != null ? Math.max(0, (now - pt.t) / 1000) : 0,
      })
      this.lastLocal.copy(this.localHit)
      this.hasLastLocal = true
    }
  }

  updateField(dt) {
    const particles = config.figure.particles
    const returnSeconds = particles.returnSeconds ?? 3.2
    const envelope = {
      coast: particles.coastSeconds ?? 0.5,
      returnSeconds,
      peak: particles.coastPeak ?? 1.4,
    }
    const mute = this.reducedMotion ? 0 : 1
    const now = performance.now()

    const marks = this.mobile ? this.touchMarks : this.pointerMarks
    const path = this.mobile ? this.touchPath : this.pointerPath
    const lastX = this.mobile ? this.fieldTouchX : this.fieldPointerX
    const lastY = this.mobile ? this.fieldTouchY : this.fieldPointerY
    const latest = path.length ? path[path.length - 1] : null
    const speed = rollingSpeed(marks, now)
    if (this.mobile) this.touchSpeed = speed
    else this.pointerSpeed = speed

    if (this.pointerT && now - this.pointerT > 90) this.pointerSpeed = 0
    if (this.touch.lastT && now - this.touch.lastT > 90) this.touchSpeed = 0

    if (this.mobile && this.touch.mode === 'pending') {
      const stillElapsed = now - this.touch.startT
      this.touch.mode = touchModeFromMove({ moved: 0, stillElapsed })
    }

    this.updateMouse()
    const overNow = this.figure.containsNdc(this.ndc, this.camera)
    let overFigure = overNow
    if (!overFigure && lastX != null && lastY != null) {
      this.setNdc(lastX, lastY)
      overFigure = this.figure.containsNdc(this.ndc, this.camera)
      if (latest) this.setNdc(latest.x, latest.y)
    }
    const gesture = this.mobile
      ? classifyTouch({
          overFigure,
          mode: this.touch.mode,
          speed: this.touchSpeed,
          prev: this.lastGesture,
        })
      : this.pointerReady
        ? classifyMouse({ overFigure, speed: this.pointerSpeed, prev: this.lastGesture })
        : 'none'
    this.lastGesture = overFigure ? gesture : 'none'

    this.gustAge += dt

    const chain = this.takePathChain()
    const nextStroke = applyStroke({
      stroke: this.strokePoints,
      gesture,
      chain,
      now,
      envelope,
    })
    this.strokePoints = nextStroke.points

    if (gesture !== 'taglio') {
      if (this.mobile) {
        this.touchPath = []
        this.fieldTouchX = null
        this.fieldTouchY = null
      } else {
        this.pointerPath = []
        this.fieldPointerX = null
        this.fieldPointerY = null
      }
    }

    if (nextStroke.action === 'start' || nextStroke.action === 'extend') {
      const tail = pathTail(this.strokePoints)
      const travelAmp = (particles.taglioAmp ?? 0.2) * mute * blowScale({ speed, points: this.strokePoints })
      this.pushCutSamples(tail, travelAmp, now)
    } else if (!this.strokePoints.length) {
      this.figure.toLocal(this.mouseWorld, this.localHit)
      this.lastLocal.copy(this.localHit)
      this.hasLastLocal = true
      this.fieldTrail = []
    }

    const lastStroke = this.strokePoints[this.strokePoints.length - 1]
    const cutAge = lastStroke ? Math.max(0, (now - lastStroke.t) / 1000) : 0
    const cutWeight = spaceEnvelope(cutAge, envelope)
    const samples = this.fieldTrail.map((sample) => ({
      x: sample.x,
      y: sample.y,
      z: sample.z,
      dx: sample.dx,
      dy: sample.dy,
      dz: sample.dz,
      w: sample.amp * cutWeight,
    }))

    if (this.breath?.poll(now)) {
      this.gustAge = 0
      this.hideBlowHint()
    }

    this.figure.setField({
      samples,
      camWorldDir: this.camDir,
      gust: spaceEnvelope(this.gustAge, envelope) * mute,
      charge:
        gesture === 'soffio'
          ? { x: this.localHit.x, y: this.localHit.y, z: this.localHit.z, w: mute }
          : { x: this.localHit.x, y: this.localHit.y, z: this.localHit.z, w: 0 },
    })
  }

  onResize() {
    const width = window.innerWidth
    const height = window.innerHeight
    this.applyLayout()
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    const pixelRatio = Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 2)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height)
    this.cssRenderer.setSize(width, height)
    this.figure.setPixelRatio(pixelRatio)
  }

  onFrame() {
    if (!this.running) return
    requestAnimationFrame(this.onFrame)

    const dt = this.clock.getDelta()
    const progress = this.scroll.update()
    const orbit = clamp(progress, 0, 1)
    this.rig.update(orbit, this.reducedMotion)

    this.updateField(dt)
    this.figure.update(this.clock.elapsedTime, this.scroll.energy)
    this.figure.setOpacity(1)

    this.sections.update(
      orbit,
      this.camera,
      this.rig.lookAt,
      (this.mobile ? config.figure.heightMobile : config.figure.height) * 0.48,
    )

    const hero = introOpacity(orbit, config.timings.hero)
    const role = introOpacity(orbit, config.timings.role)
    const outro = outroOpacity(orbit, config.timings.outro)
    this.heroEl.style.opacity = String(hero)
    if (this.heroBackEl) this.heroBackEl.style.opacity = '0'
    this.roleEl.style.opacity = String(role)
    const introChrome = clamp(1 - orbit / 0.12, 0, 1)
    this.hintEl.style.opacity = String(introChrome)
    if (this.metaEl) this.metaEl.style.opacity = String(introChrome)
    this.outroEl.style.opacity = String(outro)
    const travel = worksTravel(progress, window.innerHeight, config.scroll.distance)
    const lift = -sceneLift(travel) * window.innerHeight
    const rise = lift === 0 ? 'none' : `translate3d(0, ${lift}px, 0)`
    this.webglParent.style.transform = rise
    this.cssParent.style.transform = rise
    if (this.overlayEl) this.overlayEl.style.transform = rise
    if (this.typeBackEl) this.typeBackEl.style.transform = rise
    this.works.update(this.openProjectId)
    this.worksIndex?.update(
      travel,
      this.openProjectId,
      this.clock.elapsedTime,
      this.mobile,
      this.ndc,
    )
    this.skip.update(dt, travel)
    if (this.indexBackEl) this.indexBackEl.hidden = !indexButtonVisible(this.openProjectId)
    if (this.scroll) this.scroll.locked = applyProjectWheel(this.openProjectId)

    this.renderer.render(this.scene, this.camera)
    this.cssRenderer.render(this.cssScene, this.camera)
  }

  destroy() {
    this.running = false
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('touchstart', this.onTouchStart)
    window.removeEventListener('touchmove', this.onTouchMove)
    window.removeEventListener('touchend', this.onTouchEnd)
    window.removeEventListener('touchcancel', this.onTouchEnd)
    window.removeEventListener('keydown', this.onIndexKey)
    this.blowHintEl?.removeEventListener('click', this.onBlowHint)
    this.indexBackEl?.removeEventListener('click', this.closeProject)
    this.skip.dispose()
    this.cvSheet?.dispose()
    this.portfolio?.dispose()
    this.breath?.dispose()
    this.scroll.dispose()
    this.renderer.dispose()
  }
}
