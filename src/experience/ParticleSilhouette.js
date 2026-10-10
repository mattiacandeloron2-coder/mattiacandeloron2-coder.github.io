import * as THREE from 'three'
import { noiseChunk } from '../shaders/noise.js'
import { sampleSilhouette } from './sampleImage.js'

export class ParticleSilhouette {
  constructor(scene, options, { mobile = false, reducedMotion = false } = {}) {
    this.scene = scene
    this.options = options
    this.mobile = mobile
    this.reducedMotion = reducedMotion
    this.group = new THREE.Group()
    this.group.position.set(options.position.x, options.position.y, options.position.z)
    this.scene.add(this.group)
    this.points = null
    this.uniforms = null
    this.targetRot = { x: 0, y: 0 }
    this.currentRot = { x: 0, y: 0 }
    this.mouseWorld = new THREE.Vector3()
  }

  async load() {
    const count = Math.round(
      (this.mobile ? this.options.countMobile : this.options.countDesktop) * this.options.particleDensity,
    )
    const { samples, width, height } = await sampleSilhouette(this.options.image, {
      count,
      sampleMax: this.mobile ? Math.min(360, this.options.sampleMax) : this.options.sampleMax,
      alphaThreshold: this.options.alphaThreshold,
      luminanceThreshold: this.options.luminanceThreshold,
      chromaThreshold: this.options.chromaThreshold,
      carmineRadius: this.options.carmineRadius,
    })

    const aspect = width / height
    const worldH = this.options.height
    const worldW = worldH * aspect
    const n = samples.length

    const positions = new Float32Array(n * 3)
    const origins = new Float32Array(n * 3)
    const colors = new Float32Array(n * 3)
    const extras = new Float32Array(n * 4) // edge, alpha, size, chroma
    const seeds = new Float32Array(n * 3)

    for (let i = 0; i < n; i += 1) {
      const sample = samples[i]
      const x = (sample.x / (width - 1) - 0.5) * worldW
      const y = (0.5 - sample.y / (height - 1)) * worldH
      const zSpan = THREE.MathUtils.lerp(this.options.depth, this.options.edgeDepth, sample.edge)
      const z = (Math.random() - 0.5) * 2 * zSpan * (0.28 + sample.edge * 0.72)
      const i3 = i * 3
      origins[i3] = x
      origins[i3 + 1] = y
      origins[i3 + 2] = z
      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z
      colors[i3] = sample.r
      colors[i3 + 1] = sample.g
      colors[i3 + 2] = sample.b
      extras[i * 4] = sample.edge
      extras[i * 4 + 1] = Math.max(sample.a, 0.55)
      extras[i * 4 + 2] = THREE.MathUtils.lerp(
        this.options.particleSize,
        this.options.particleSizeMax,
        Math.max(Math.random() ** 2, sample.chroma * 0.9),
      )
      extras[i * 4 + 3] = sample.chroma
      seeds[i3] = Math.random()
      seeds[i3 + 1] = Math.random()
      seeds[i3 + 2] = Math.random()
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aOrigin', new THREE.BufferAttribute(origins, 3))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aExtra', new THREE.BufferAttribute(extras, 4))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3))

    this.uniforms = {
      uTime: { value: 0 },
      uSmoke: { value: this.reducedMotion ? 0.04 : this.options.smokeStrength },
      uEdgeDissolve: { value: this.options.edgeDissolve },
      uCoreNoise: { value: this.options.coreNoise },
      uEdgeNoise: { value: this.options.edgeNoise },
      uNoiseSpeed: { value: this.options.noiseSpeed },
      uReturn: { value: this.options.returnStrength },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 2) },
      uOpacity: { value: this.options.opacity },
      uMouse: { value: new THREE.Vector3(999, 999, 0) },
      uDisturbRadius: { value: this.options.disturbRadius },
      uDisturb: { value: this.reducedMotion || !this.options.mouseInteraction ? 0 : this.options.disturbStrength },
      uParallax: { value: new THREE.Vector2(0, 0) },
      uParallaxAmt: { value: this.reducedMotion ? 0 : this.options.parallax },
      uChromaBoost: { value: this.options.chromaBoost },
      uCarmine: {
        value: new THREE.Vector3(
          ...(this.options.carmine ?? [0.831, 0.125, 0.22]),
        ),
      },
      uReduced: { value: this.reducedMotion ? 1 : 0 },
    }

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: this.uniforms,
      vertexShader: `
        attribute vec3 aOrigin;
        attribute vec3 aColor;
        attribute vec4 aExtra;
        attribute vec3 aSeed;
        uniform float uTime;
        uniform float uSmoke;
        uniform float uEdgeDissolve;
        uniform float uCoreNoise;
        uniform float uEdgeNoise;
        uniform float uNoiseSpeed;
        uniform float uReturn;
        uniform float uPixelRatio;
        uniform float uOpacity;
        uniform vec3 uMouse;
        uniform float uDisturbRadius;
        uniform float uDisturb;
        uniform vec2 uParallax;
        uniform float uParallaxAmt;
        uniform float uChromaBoost;
        uniform vec3 uCarmine;
        uniform float uReduced;
        varying vec3 vColor;
        varying float vAlpha;
        ${noiseChunk}

        void main() {
          float edge = aExtra.x;
          float baseAlpha = aExtra.y;
          float size = aExtra.z;
          float chroma = aExtra.w;
          float phase = aSeed.x * 6.2831;

          float t = uTime * uNoiseSpeed * (0.65 + aSeed.y * 0.7) + phase;
          vec3 curl = curlNoise(aOrigin * 1.8 + vec3(0.0, t, t * 0.6));
          float amp = mix(uCoreNoise, uEdgeNoise, pow(edge, 1.35));
          amp *= uSmoke * mix(1.0, 0.42, chroma);
          amp *= 1.0 - uReduced * 0.92;

          float cycle = 0.5 + 0.5 * sin(t * 0.55 + aSeed.z * 8.0);
          vec3 drift = curl * amp * mix(0.22, 1.05, cycle);
          drift.y += edge * amp * 1.15 * (0.35 + cycle);
          drift *= 1.0 / (1.0 + uReturn * 16.0);

          vec3 pos = aOrigin + drift;

          vec3 toMouse = pos - uMouse;
          float md = length(toMouse.xy);
          float influence = (1.0 - smoothstep(0.0, uDisturbRadius, md)) * uDisturb;
          influence *= mix(0.08, 0.85, edge);
          pos.xy += normalize(toMouse.xy + vec2(0.0001)) * influence * 0.4;
          pos.z += influence * 0.05;

          pos.x += uParallax.x * pos.z * uParallaxAmt;
          pos.y += uParallax.y * pos.z * uParallaxAmt * 0.45;

          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = size * uPixelRatio * clamp(4.5 / -mv.z, 0.92, 1.72);

          float dist = length(pos - aOrigin);
          float fade = mix(0.94, 0.52, edge);
          fade *= mix(1.0, 0.68, smoothstep(0.0, 0.16, dist));
          vColor = aColor;
          vAlpha = clamp(baseAlpha * fade * uOpacity, 0.0, 1.0);
          vAlpha *= mix(1.0, mix(0.55, 0.88, 1.0 - edge), uEdgeDissolve * edge * (1.0 - cycle));
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          float grain = 1.0 - smoothstep(0.14, 0.48, d);
          grain *= 0.88 + 0.12 * (1.0 - d * 2.0);
          gl_FragColor = vec4(vColor, vAlpha * grain);
        }
      `,
    })

    this.points = new THREE.Points(geometry, material)
    this.points.frustumCulled = false
    this.group.add(this.points)
    return this
  }

  setMouse(world, parallaxX, parallaxY) {
    if (!this.uniforms) return
    this.uniforms.uMouse.value.copy(world)
    this.uniforms.uParallax.value.set(parallaxX, parallaxY)
    const maxY = THREE.MathUtils.degToRad(this.options.mouseRotateY)
    const maxX = THREE.MathUtils.degToRad(this.options.mouseRotateX)
    this.targetRot.y = this.reducedMotion ? 0 : parallaxX * maxY
    this.targetRot.x = this.reducedMotion ? 0 : -parallaxY * maxX
  }

  setOpacity(value) {
    if (this.uniforms) this.uniforms.uOpacity.value = value
  }

  setPixelRatio(value) {
    if (this.uniforms) this.uniforms.uPixelRatio.value = value
  }

  update(time, scrollYaw = 0) {
    if (!this.uniforms) return
    this.uniforms.uTime.value = time
    this.currentRot.x += (this.targetRot.x - this.currentRot.x) * 0.06
    this.currentRot.y += (this.targetRot.y + scrollYaw - this.currentRot.y) * 0.06
    this.group.rotation.x = this.currentRot.x
    this.group.rotation.y = this.currentRot.y
  }
}
