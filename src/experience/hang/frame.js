export function hangFrame({ reducedMotion = false } = {}) {
  const section = document.createElement('section')
  section.className = 'works-frame is-hang'
  if (reducedMotion) section.classList.add('is-calm')
  const stage = document.createElement('div')
  stage.className = 'works-hang-stage'
  const title = document.createElement('p')
  title.className = 'works-hang-title'
  title.textContent = 'SPIRALUMA'
  section.append(stage, title)

  let view = null
  let booting = false
  let failed = false
  let wanted = false
  section.hang = {
    sync(showing) {
      wanted = showing
      if (view) {
        view.sync(showing)
        return
      }
      if (!showing || booting || failed) return
      const box = stage.getBoundingClientRect()
      if (box.width < 2 || box.height < 2) return
      booting = true
      import('./scene.js')
        .then((mod) => {
          view = mod.mountHang(stage, { reducedMotion })
          view.sync(wanted)
        })
        .catch(() => {
          failed = true
        })
    },
  }
  return section
}
