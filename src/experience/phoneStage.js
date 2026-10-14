export const phoneStageDesign = { width: 1280, height: 900 }

export function phoneStageFit({
  width = 0,
  height = 0,
  insetLeft = 0,
  insetRight = 0,
  insetTop = 0,
  insetBottom = 0,
  designWidth = phoneStageDesign.width,
  designHeight = phoneStageDesign.height,
} = {}) {
  const boxW = Math.max(0, Number(width) - insetLeft - insetRight)
  const boxH = Math.max(0, Number(height) - insetTop - insetBottom)
  const dw = Math.max(1, Number(designWidth) || 1)
  const dh = Math.max(1, Number(designHeight) || 1)
  if (boxW >= dw && boxH >= dh) {
    return { scale: 1, x: insetLeft, y: insetTop, layoutWidth: boxW, layoutHeight: boxH }
  }
  const scale = boxW > 0 && boxH > 0 ? Math.min(boxW / dw, boxH / dh) : 1
  return {
    scale,
    x: insetLeft + (boxW - dw * scale) / 2,
    y: insetTop + (boxH - dh * scale) / 2,
    layoutWidth: dw,
    layoutHeight: dh,
  }
}

export function mapStagePoint(clientX, clientY, frame) {
  if (!frame || !(frame.scale > 0)) return { x: clientX, y: clientY }
  return {
    x: (clientX - frame.left) / frame.scale,
    y: (clientY - frame.top) / frame.scale,
  }
}

export function mapStageRect(rect, frame) {
  if (!rect) return rect
  if (!frame || !(frame.scale > 0)) return rect
  return {
    left: (rect.left - frame.left) / frame.scale,
    top: (rect.top - frame.top) / frame.scale,
    width: rect.width / frame.scale,
    height: rect.height / frame.scale,
  }
}

function fittedStage() {
  if (typeof document === 'undefined') return null
  const stage = document.querySelector('[data-phone-stage].is-fit')
  if (!stage) return null
  const width = stage.clientWidth
  const height = stage.clientHeight
  if (!(width > 0) || !(height > 0)) return null
  const rect = stage.getBoundingClientRect()
  return {
    width,
    height,
    left: rect.left,
    top: rect.top,
    scale: rect.width / width,
  }
}

export function pageSize() {
  const frame = fittedStage()
  if (frame) return { width: frame.width, height: frame.height }
  return {
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }
}

export function pagePoint(clientX, clientY) {
  return mapStagePoint(clientX, clientY, fittedStage())
}

export function pageRect(element) {
  if (!element?.getBoundingClientRect) return null
  return mapStageRect(element.getBoundingClientRect(), fittedStage())
}

function readSafeInsets() {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'
  document.documentElement.appendChild(probe)
  const style = getComputedStyle(probe)
  const insets = {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  }
  probe.remove()
  return insets
}

export function applyPhoneStage(stage = document.querySelector('[data-phone-stage]')) {
  if (!stage) return null
  const landscape = document.documentElement.classList.contains('is-landscape-phone')
  if (!landscape) {
    stage.classList.remove('is-fit')
    return null
  }
  const view = window.visualViewport
  const insets = readSafeInsets()
  const fit = phoneStageFit({
    width: view?.width || window.innerWidth,
    height: view?.height || window.innerHeight,
    insetLeft: insets.left,
    insetRight: insets.right,
    insetTop: insets.top,
    insetBottom: insets.bottom,
  })
  stage.classList.add('is-fit')
  stage.style.setProperty('--stage-w', `${fit.layoutWidth}px`)
  stage.style.setProperty('--stage-h', `${fit.layoutHeight}px`)
  stage.style.setProperty('--stage-x', `${(view?.offsetLeft || 0) + fit.x}px`)
  stage.style.setProperty('--stage-y', `${(view?.offsetTop || 0) + fit.y}px`)
  stage.style.setProperty('--stage-scale', String(fit.scale))
  return fit
}
