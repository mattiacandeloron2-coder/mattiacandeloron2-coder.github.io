export function posterStack(order, front) {
  if (!front || !order.includes(front)) return [...order]
  return [...order.filter((id) => id !== front), front]
}

export function cardShift(offsetX, offsetY, halfW, halfH) {
  if (!(halfW > 0) || !(halfH > 0)) return { x: 0, y: 0, rot: 0 }
  const nx = Math.max(-1, Math.min(1, offsetX / halfW))
  const ny = Math.max(-1, Math.min(1, offsetY / halfH))
  return {
    x: nx * 14,
    y: ny * 10 - 8,
    rot: nx * 3.5,
  }
}

export class PosterFan {
  constructor(section) {
    this.section = section
    this.cards = [...section.querySelectorAll('.works-poster')]
    this.order = this.cards.map((card) => card.dataset.poster)
    this.openCard = null
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerLeave = this.onPointerLeave.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onKey = this.onKey.bind(this)
    this.cards.forEach((card) => {
      card.addEventListener('pointermove', this.onPointerMove)
      card.addEventListener('pointerleave', this.onPointerLeave)
      card.addEventListener('click', this.onClick)
      card.addEventListener('keydown', this.onKey)
      card.querySelector('.works-poster-close')?.addEventListener('click', (event) => {
        event.stopPropagation()
        this.close()
      })
    })
    this.paintStack()
  }

  setLanded(landed) {
    const next = Boolean(landed)
    if (!next && this.openCard) this.close()
    this.section.classList.toggle('is-set', next)
    if (!next) this.cards.forEach((card) => this.clearShift(card))
  }

  onPointerMove(event) {
    if (event.pointerType === 'touch') return
    if (this.openCard || !this.section.classList.contains('is-set')) return
    const card = event.currentTarget
    const box = card.getBoundingClientRect()
    const shift = cardShift(
      event.clientX - (box.left + box.width / 2),
      event.clientY - (box.top + box.height / 2),
      box.width / 2,
      box.height / 2,
    )
    const sheet = card.querySelector('.works-poster-sheet')
    if (!sheet) return
    card.classList.add('is-hot')
    sheet.style.setProperty('--sx', `${shift.x.toFixed(2)}px`)
    sheet.style.setProperty('--sy', `${shift.y.toFixed(2)}px`)
    sheet.style.setProperty('--sr', `${shift.rot.toFixed(2)}deg`)
  }

  onPointerLeave(event) {
    this.clearShift(event.currentTarget)
  }

  onClick(event) {
    if (event.target.closest('.works-poster-close')) return
    if (this.openCard) return
    this.open(event.currentTarget)
  }

  onKey(event) {
    if (event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    if (this.openCard) return
    this.open(event.currentTarget)
  }

  open(card) {
    if (!card || this.openCard) return
    this.clearShift(card)
    this.order = posterStack(this.order, card.dataset.poster)
    this.openCard = card
    this.paintStack()
    card.style.zIndex = '30'
    card.classList.add('is-open')
    card.setAttribute('aria-expanded', 'true')
    const button = card.querySelector('.works-poster-close')
    if (button) button.hidden = false
    this.section.classList.add('is-reading')
  }

  close() {
    const card = this.openCard
    if (!card) return false
    card.classList.remove('is-open')
    card.setAttribute('aria-expanded', 'false')
    const button = card.querySelector('.works-poster-close')
    if (button) button.hidden = true
    this.openCard = null
    this.section.classList.remove('is-reading')
    this.paintStack()
    card.focus()
    return true
  }

  clearShift(card) {
    card.classList.remove('is-hot')
    const sheet = card.querySelector('.works-poster-sheet')
    if (!sheet) return
    sheet.style.removeProperty('--sx')
    sheet.style.removeProperty('--sy')
    sheet.style.removeProperty('--sr')
  }

  paintStack() {
    this.order.forEach((id, index) => {
      const card = this.cards.find((item) => item.dataset.poster === id)
      if (card) card.style.zIndex = String(index + 1)
    })
  }
}
