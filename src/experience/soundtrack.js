export function frameHoldsSoundtrack(kind) {
  return kind === 'film'
}

export function nextSoundtrackHold(held, gate) {
  if (!gate?.onVideo) return false
  return Boolean(held) || Boolean(gate.audible)
}

export function soundtrackCanPlay(userMuted, held) {
  return !userMuted && !held
}

function soundIcon(muted) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  const add = (tag, attrs) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag)
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value))
    svg.appendChild(node)
  }
  add('path', { d: 'M4.5 9.4h3.1L12.2 5.6v12.8l-4.6-3.8H4.5z', fill: 'currentColor' })
  if (muted) {
    add('path', {
      d: 'M16 8.4l5 7.2M21 8.4l-5 7.2',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
    })
  } else {
    add('path', {
      d: 'M15.6 9.1c1.5 1.1 1.5 4.7 0 5.8M18.2 6.6c2.6 2.2 2.6 8.6 0 10.8',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
    })
  }
  return svg
}

export class Soundtrack {
  constructor({ audio, button, hint }) {
    this.audio = audio
    this.button = button
    this.hint = hint
    this.userMuted = true
    this.held = false
    this.audio.loop = true
    this.audio.muted = true
    this.button.addEventListener('click', () => {
      this.userMuted = !this.userMuted
      this.apply()
    })
    this.apply()
  }

  setVideo(gate) {
    const held = nextSoundtrackHold(this.held, gate)
    if (held === this.held) return
    this.held = held
    this.apply()
  }

  apply() {
    this.audio.muted = this.userMuted
    this.button.classList.toggle('is-muted', this.userMuted)
    this.button.setAttribute('aria-pressed', this.userMuted ? 'true' : 'false')
    this.button.setAttribute('aria-label', this.userMuted ? 'Unmute' : 'Mute')
    this.button.replaceChildren(soundIcon(this.userMuted))
    if (this.hint) this.hint.hidden = !this.userMuted
    if (this.held) {
      if (!this.audio.paused) this.audio.pause()
      return
    }
    if (this.audio.paused) {
      const pending = this.audio.play()
      pending?.catch?.(() => {})
    }
  }
}
