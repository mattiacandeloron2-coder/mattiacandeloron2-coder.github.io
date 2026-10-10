import gsap from 'gsap'
import { clamp01, stickerProgress } from './deformation.js'

// The project pages do not scroll the document. The wheel is captured and
// becomes a dwell on the current slide. This timeline is scrubbed from that
// dwell, so the same scroll position always rebuilds the same sticker.
export function createAdhesionTween(onProgress, config) {
  const state = { progress: 0 }
  let shown = 0
  let applied = Number.NaN
  const tween = gsap.to(state, {
    progress: 1,
    duration: 1,
    ease: 'none',
    paused: true,
    onUpdate: () => {
      applied = state.progress
      onProgress(state.progress)
    },
  })

  const apply = (next) => {
    const progress = clamp01(next)
    if (config.scrollScrub > 0) {
      const follow = 1 - Math.exp(-1 / (config.scrollScrub * 60))
      shown += (progress - shown) * follow
      if (Math.abs(progress - shown) < 0.0008) shown = progress
    } else {
      shown = progress
    }
    tween.progress(shown)
    if (applied !== shown) onProgress(shown)
  }

  return {
    setDwell(dwell) {
      apply(stickerProgress(dwell, config))
    },
    setProgress(progress) {
      shown = clamp01(progress)
      tween.progress(shown)
      if (applied !== shown) onProgress(shown)
    },
    dispose() {
      tween.kill()
    },
  }
}
