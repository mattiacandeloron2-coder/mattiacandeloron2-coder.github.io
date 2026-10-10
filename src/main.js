import { Experience } from './experience/Experience.js'

const experience = new Experience({
  webglParent: document.querySelector('#webgl'),
  cssParent: document.querySelector('#css3d'),
})

experience.start()
