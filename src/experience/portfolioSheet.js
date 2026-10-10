export class PortfolioSheet {
  constructor(src = '/Mattia_Candeloro_Portfolio_ENG_condensed.pdf#navpanes=0&toolbar=0') {
    this.src = src
    this.isOpen = false
    this.sheet = document.createElement('div')
    this.sheet.className = 'portfolio-sheet'
    this.sheet.hidden = true
    this.frame = document.createElement('iframe')
    this.frame.className = 'portfolio-frame'
    this.frame.title = 'Portfolio'
    this.closeButton = document.createElement('button')
    this.closeButton.type = 'button'
    this.closeButton.className = 'portfolio-close'
    this.closeButton.textContent = 'close'
    this.sheet.append(this.frame, this.closeButton)
    document.body.appendChild(this.sheet)
    this.onClose = () => this.close()
    this.closeButton.addEventListener('click', this.onClose)
  }

  open() {
    this.isOpen = true
    this.sheet.hidden = false
    const url = new URL(this.src, window.location.href).href
    if (this.frame.src !== url) this.frame.src = this.src
  }

  close() {
    this.isOpen = false
    this.sheet.hidden = true
  }

  dispose() {
    this.closeButton.removeEventListener('click', this.onClose)
    this.sheet.remove()
  }
}
