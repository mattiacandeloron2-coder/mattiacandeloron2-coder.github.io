import * as THREE from 'three'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { noiseChunk } from '../shaders/noise.js'
import { PART, createPartClassifier } from './classifyParts.js'
import { driftScale } from './dustMotion.js'
import { fiatoExpand, fiatoScatter } from './breath.js'
import { TRAIL_MAX } from './pointerField.js'

function collectMeshes(root) {
  const meshes = []
  root.traverse((child) => {
    if (child.isMesh && child.geometry?.attributes?.position) meshes.push(child)
  })
  return meshes
}

function collectWorldPositions(root, meshes) {
  const v = new THREE.Vector3()
  const packed = []
  for (const mesh of meshes) {
    const pos = mesh.geometry.attributes.position
    mesh.updateWorldMatrix(true, false)
    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
      packed.push(v.x, v.y, v.z)
    }
  }
  return new Float32Array(packed)
}

function triangleAreas(geometry) {
  const pos = geometry.attributes.position
  const idx = geometry.index
  const triCount = idx ? idx.count / 3 : pos.count / 3
  const cdf = new Float64Array(triCount)
  const ax = new THREE.Vector3()
  const ay = new THREE.Vector3()
  const az = new THREE.Vector3()
  let total = 0
  for (let t = 0; t < triCount; t += 1) {
    const i0 = idx ? idx.getX(t * 3) : t * 3
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
    ax.fromBufferAttribute(pos, i0)
    ay.fromBufferAttribute(pos, i1)
    az.fromBufferAttribute(pos, i2)
    total += ay.sub(ax).cross(az.sub(ax)).length() * 0.5
    cdf[t] = total
  }
  return { cdf, total, triCount }
}

function pickTriangle(cdf, total) {
  const r = Math.random() * total
  let lo = 0
  let hi = cdf.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (cdf[mid] < r) lo = mid + 1
    else hi = mid
  }
  return lo
}

function mixHex(a, b, t) {
  const ca = new THREE.Color(a)
  const cb = new THREE.Color(b)
  ca.lerp(cb, t)
  return ca
}

export class ParticleFigure {
  constructor(scene, options, { mobile = false, reducedMotion = false } = {}) {
    this.scene = scene
    this.options = options
    this.mobile = mobile
    this.reducedMotion = reducedMotion
    this.group = new THREE.Group()
    this.scene.add(this.group)
    this.points = null
    this.uniforms = null
    this.nativeHeight = 1
    this.localMouse = new THREE.Vector3(999, 999, 0)
    this.pendingLayout = null
    this.hitRadius = 1
    this.hitCenter = new THREE.Vector3()
    this.hitSphere = new THREE.Sphere()
    this.hitRay = new THREE.Raycaster()
    this.camLocal = new THREE.Vector3(0, 0, 1)
    this.invWorld = new THREE.Matrix4()
    this.trailVectors = Array.from({ length: TRAIL_MAX }, () => new THREE.Vector4())
    this.trailDirVectors = Array.from({ length: TRAIL_MAX }, () => new THREE.Vector3(1, 0, 0))
    this.chargeVec = new THREE.Vector4(0, 0, 0, 0)
  }

  async load(onProgress = () => {}) {
    const url = this.options.model
    const root = await new Promise((resolve, reject) => {
      const progress = (event) => {
        if (event?.lengthComputable && event.total > 0) {
          onProgress({ loaded: event.loaded, total: event.total })
        }
      }
      if (url.endsWith('.obj')) new OBJLoader().load(url, resolve, progress, reject)
      else new GLTFLoader().load(url, (gltf) => resolve(gltf.scene), progress, reject)
    })
    onProgress({ downloaded: true })

    root.updateMatrixWorld(true)
    const meshes = collectMeshes(root)
    const worldPositions = collectWorldPositions(root, meshes)
    const box = new THREE.Box3().setFromObject(root)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    this.nativeHeight = Math.max(size.y, 0.001)
    this.hitRadius = Math.max(size.x, size.y, size.z) * 0.46
    this.hitCenter.copy(center)

    const classifier = createPartClassifier(worldPositions, { grid: 48 })
    const particles = this.options.particles
    const count = Math.round(this.mobile ? particles.countMobile : particles.countDesktop)
    onProgress({ built: 0, count })
    await this.buildPoints(meshes, classifier, center, count, particles, (built) => {
      onProgress({ built, count })
    })

    for (const mesh of meshes) {
      mesh.geometry.dispose()
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const mat of mats) mat.dispose?.()
      }
    }

    if (this.pendingLayout) {
      this.applyLayout(this.pendingLayout.height, this.pendingLayout.position)
      this.pendingLayout = null
    }
    return this
  }

  async buildPoints(meshes, classifier, center, count, particles, onBuild = () => {}) {
    const weights = meshes.map((mesh) => triangleAreas(mesh.geometry))
    const meshTotal = weights.reduce((sum, item) => sum + item.total, 0) || 1
    const meshCdf = []
    let running = 0
    for (let i = 0; i < weights.length; i += 1) {
      running += weights[i].total
      meshCdf.push(running)
    }

    const positions = new Float32Array(count * 3)
    const origins = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const extras = new Float32Array(count * 4)
    const seeds = new Float32Array(count * 3)

    const a = new THREE.Vector3()
    const b = new THREE.Vector3()
    const c = new THREE.Vector3()
    const n0 = new THREE.Vector3()
    const n1 = new THREE.Vector3()
    const n2 = new THREE.Vector3()
    const p = new THREE.Vector3()
    const n = new THREE.Vector3()
    const normalMatrix = new THREE.Matrix3()

    const bodyA = particles.body
    const bodyB = particles.bodySoft ?? particles.body
    const chairA = particles.chair
    const chairB = particles.chairSoft ?? particles.chair
    const drillA = particles.drill
    const drillB = particles.drillDeep ?? particles.drill
    const cloudDepth = particles.cloudDepth ?? 0.028

    for (let i = 0; i < count; i += 1) {
      const pick = Math.random() * meshTotal
      let meshIndex = 0
      while (meshIndex < meshCdf.length - 1 && meshCdf[meshIndex] < pick) meshIndex += 1
      const mesh = meshes[meshIndex]
      const { cdf, total, triCount } = weights[meshIndex]
      const t = total > 0 ? pickTriangle(cdf, total) : (Math.random() * triCount) | 0
      const geom = mesh.geometry
      const pos = geom.attributes.position
      const nrm = geom.attributes.normal
      const idx = geom.index
      const i0 = idx ? idx.getX(t * 3) : t * 3
      const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
      const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
      a.fromBufferAttribute(pos, i0)
      b.fromBufferAttribute(pos, i1)
      c.fromBufferAttribute(pos, i2)

      let u = Math.random()
      let v = Math.random()
      if (u + v > 1) {
        u = 1 - u
        v = 1 - v
      }
      const w = 1 - u - v
      p.set(a.x * w + b.x * u + c.x * v, a.y * w + b.y * u + c.y * v, a.z * w + b.z * u + c.z * v)
      p.applyMatrix4(mesh.matrixWorld)
      const worldX = p.x
      const worldY = p.y
      const worldZ = p.z
      p.sub(center)

      if (nrm) {
        n0.fromBufferAttribute(nrm, i0)
        n1.fromBufferAttribute(nrm, i1)
        n2.fromBufferAttribute(nrm, i2)
        n.set(n0.x * w + n1.x * u + n2.x * v, n0.y * w + n1.y * u + n2.y * v, n0.z * w + n1.z * u + n2.z * v)
        normalMatrix.getNormalMatrix(mesh.matrixWorld)
        n.applyMatrix3(normalMatrix).normalize()
      } else {
        n.set(0, 1, 0)
      }

      const along = (Math.random() - 0.35) * cloudDepth
      p.addScaledVector(n, along)

      const part = classifier.classify(worldX, worldY, worldZ)
      const seedA = Math.random()
      const seedB = Math.random()
      const seedC = Math.random()
      let color
      if (part === PART.DRILL) color = mixHex(drillA, drillB, seedA * 0.45)
      else if (part === PART.HELD) color = mixHex(chairA, chairB, seedA * 0.55)
      else color = mixHex(bodyA, bodyB, seedA * 0.35)

      const i3 = i * 3
      origins[i3] = p.x
      origins[i3 + 1] = p.y
      origins[i3 + 2] = p.z
      positions[i3] = p.x
      positions[i3 + 1] = p.y
      positions[i3 + 2] = p.z
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      const radial = Math.hypot(p.x, p.y * 0.7, p.z)
      const edge = THREE.MathUtils.clamp(radial / 0.55, 0, 1) ** 1.35
      extras[i * 4] = edge
      extras[i * 4 + 1] = part === PART.DRILL || part === PART.HELD ? 1 : 0.92
      extras[i * 4 + 2] = THREE.MathUtils.lerp(
        particles.particleSize,
        particles.particleSizeMax,
        seedB * seedB * (part === PART.DRILL || part === PART.HELD ? 1.2 : 1),
      )
      extras[i * 4 + 3] = part === PART.DRILL ? 0.9 : part === PART.HELD ? 0.35 : 0
      seeds[i3] = seedA
      seeds[i3 + 1] = seedB
      seeds[i3 + 2] = seedC
      if ((i + 1) % 1000 === 0) {
        onBuild(i + 1)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aOrigin', new THREE.BufferAttribute(origins, 3))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aExtra', new THREE.BufferAttribute(extras, 4))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3))

    this.uniforms = {
      uTime: { value: 0 },
      uDust: { value: particles.dustStrength ?? 0.012 },
      uDustSpeed: { value: particles.dustSpeed ?? 0.42 },
      uDriftScale: { value: driftScale(0, { reducedMotion: this.reducedMotion }) },
      uEdgeDissolve: { value: particles.edgeDissolve ?? 0.05 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, this.mobile ? 1.5 : 2) },
      uOpacity: { value: 1 },
      uTrail: { value: this.trailVectors },
      uTrailDir: { value: this.trailDirVectors },
      uCamLocal: { value: this.camLocal },
      uHand: { value: (particles.handRadius ?? 0.2) * this.nativeHeight },
      uBlade: { value: (particles.bladeWidth ?? 0.032) * this.nativeHeight },
      uStroke: { value: (particles.strokeLength ?? 0.08) * this.nativeHeight },
      uGust: { value: 0 },
      uGustAmp: { value: this.reducedMotion ? 0 : (particles.gustAmp ?? 0.34) },
      uCharge: { value: this.chargeVec },
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
        uniform float uDust;
        uniform float uDustSpeed;
        uniform float uDriftScale;
        uniform float uEdgeDissolve;
        uniform float uPixelRatio;
        uniform float uOpacity;
        uniform vec4 uTrail[${TRAIL_MAX}];
        uniform vec3 uTrailDir[${TRAIL_MAX}];
        uniform vec3 uCamLocal;
        uniform float uHand;
        uniform float uBlade;
        uniform float uStroke;
        uniform float uGust;
        uniform float uGustAmp;
        uniform vec4 uCharge;
        varying vec3 vColor;
        varying float vAlpha;
        ${noiseChunk}

        vec3 dustAroundHome(vec3 origin, vec3 seed) {
          float t = uTime * uDustSpeed;
          vec3 bob;
          bob.x = sin(t * 1.07 + seed.x * 6.2831);
          bob.y = sin(t * 0.91 + seed.y * 6.2831);
          bob.z = cos(t * 1.13 + seed.z * 6.2831);
          vec3 curl = curlNoise(origin * 2.2 + vec3(t * 0.31, t * 0.19, t * 0.27));
          return (bob * 0.72 + curl * 0.28) * uDust * uDriftScale;
        }

        vec3 sandBlow(vec3 origin, vec3 seed) {
          vec3 cam = normalize(uCamLocal + vec3(0.0001, 0.0, 0.0));
          float best = 0.0;
          vec3 closest = origin;
          vec3 tangent = vec3(1.0, 0.0, 0.0);
          vec3 blade = vec3(0.0, 1.0, 0.0);
          float across = 1.0;
          for (int i = 0; i < ${TRAIL_MAX} - 1; i++) {
            vec4 a = uTrail[i];
            vec4 b = uTrail[i + 1];
            if (a.w < 0.001) continue;
            vec3 hit = a.xyz;
            vec3 tan = normalize(uTrailDir[i] + vec3(0.0001, 0.0, 0.0));
            float amp = a.w;
            if (b.w > 0.001) {
              vec3 ab = b.xyz - a.xyz;
              float ab2 = dot(ab, ab);
              if (ab2 > 1e-8) {
                float t = clamp(dot(origin - a.xyz, ab) / ab2, 0.0, 1.0);
                hit = a.xyz + ab * t;
                tan = normalize(ab + vec3(0.0001, 0.0, 0.0));
                amp = mix(a.w, b.w, t);
              }
            } else if (i > 0) {
              continue;
            } else {
              float along = abs(dot(origin - a.xyz, tan));
              if (along > max(uStroke, 0.001)) continue;
            }
            vec3 nrm = normalize(cross(cam, tan) + vec3(0.0, 0.0001, 0.0));
            float side = dot(origin - hit, nrm);
            float u = side / max(uBlade, 0.001);
            float wound = exp(-2.0 * u * u);
            float influence = wound * amp;
            if (influence > best) {
              best = influence;
              closest = hit;
              tangent = tan;
              blade = nrm;
              across = side;
            }
          }
          vec3 gust = ((seed - 0.5) * ${fiatoScatter} + origin * ${fiatoExpand}) * uGust * uGustAmp;
          if (best < 0.001) return gust;
          float along = dot(origin - closest, tangent);
          float grain = seed.x - 0.5;
          float hop = 0.55 + 0.45 * seed.y;
          float scatter = sin(along * 9.0 + seed.x * 6.2831 + uTime * 0.7);
          vec3 swirl = normalize(cross(tangent, blade) + vec3(0.0001, 0.0, 0.0));
          vec3 kick = tangent * (0.82 + grain * 0.28)
            + cam * (0.94 * hop + scatter * 0.12)
            + blade * across * 0.03
            + swirl * grain * 0.12
            + (seed - 0.5) * 0.08;
          return kick * best + gust;
        }

        float sparkle(vec3 origin) {
          vec3 cam = normalize(uCamLocal + vec3(0.0001, 0.0, 0.0));
          vec3 toCharge = origin - uCharge.xyz;
          vec3 chargePerp = toCharge - cam * dot(toCharge, cam);
          return (1.0 - smoothstep(0.0, max(uHand, 0.001), length(chargePerp))) * uCharge.w;
        }

        void main() {
          float edge = aExtra.x;
          float baseAlpha = aExtra.y;
          float size = aExtra.z;
          float t = uTime * uDustSpeed;
          float cycle = 0.5 + 0.5 * sin(t * 0.55 + aSeed.z * 8.0);

          vec3 pos = aOrigin + dustAroundHome(aOrigin, aSeed) + sandBlow(aOrigin, aSeed);
          float charge = sparkle(aOrigin);
          float spark = 0.5 + 0.5 * sin(uTime * 28.0 + aSeed.x * 52.0);

          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = size * uPixelRatio * clamp(4.5 / -mv.z, 0.92, 1.85);
          gl_PointSize *= mix(1.0, mix(0.88, 1.28, spark), charge);

          float dist = length(pos - aOrigin);
          float fade = mix(0.96, 0.58, edge);
          fade *= mix(1.0, 0.84, smoothstep(0.0, 0.62, dist));
          vColor = aColor;
          vAlpha = clamp(baseAlpha * fade * uOpacity, 0.0, 1.0);
          vAlpha *= mix(1.0, mix(0.6, 0.9, 1.0 - edge), uEdgeDissolve * edge * (1.0 - cycle));
          vAlpha *= mix(1.0, mix(0.62, 1.0, spark), charge);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          float grain = 1.0 - smoothstep(0.12, 0.5, d);
          grain *= 0.9 + 0.1 * (1.0 - d * 2.0);
          gl_FragColor = vec4(vColor, vAlpha * grain);
        }
      `,
    })

    this.points = new THREE.Points(geometry, material)
    this.points.frustumCulled = false
    this.group.add(this.points)
  }

  applyLayout(height, position = { x: 0, y: 0, z: 0 }) {
    if (!this.points) {
      this.pendingLayout = { height, position }
      return this
    }
    this.group.scale.setScalar(height / this.nativeHeight)
    this.group.position.set(position.x ?? 0, position.y ?? 0, position.z ?? 0)
    this.group.rotation.y = this.options.yawOffset ?? 0
    this.group.updateMatrixWorld(true)
    return this
  }

  toLocal(world, target = this.localMouse) {
    target.copy(world)
    this.group.updateMatrixWorld(true)
    this.group.worldToLocal(target)
    return target
  }

  containsNdc(ndc, camera) {
    if (!this.points) return false
    this.hitRay.setFromCamera(ndc, camera)
    this.group.updateMatrixWorld(true)
    this.group.getWorldPosition(this.hitSphere.center)
    this.hitSphere.radius = this.hitRadius * this.group.scale.x
    return this.hitRay.ray.intersectsSphere(this.hitSphere)
  }

  setField({ samples = [], camWorldDir, gust = 0, charge = null } = {}) {
    if (!this.uniforms) return
    this.group.updateMatrixWorld(true)
    this.invWorld.copy(this.group.matrixWorld).invert()
    this.camLocal.copy(camWorldDir).transformDirection(this.invWorld).normalize()
    this.uniforms.uCamLocal.value.copy(this.camLocal)
    this.uniforms.uGust.value = gust
    if (charge) this.chargeVec.set(charge.x, charge.y, charge.z, charge.w)
    else this.chargeVec.set(0, 0, 0, 0)
    for (let i = 0; i < TRAIL_MAX; i += 1) {
      const sample = samples[i]
      const slot = this.trailVectors[i]
      const dir = this.trailDirVectors[i]
      if (!sample) {
        slot.set(0, 0, 0, 0)
        dir.set(1, 0, 0)
        continue
      }
      slot.set(sample.x, sample.y, sample.z, sample.w)
      dir.set(sample.dx || 1, sample.dy || 0, sample.dz || 0)
      if (dir.lengthSq() < 1e-8) dir.set(1, 0, 0)
      else dir.normalize()
    }
  }

  setMouse(world) {
    this.toLocal(world)
  }

  setOpacity(value) {
    if (this.uniforms) this.uniforms.uOpacity.value = value
    this.group.visible = value > 0.02
  }

  setPixelRatio(value) {
    if (this.uniforms) this.uniforms.uPixelRatio.value = value
  }

  update(time, energy = 0) {
    if (!this.uniforms) return
    this.uniforms.uTime.value = time
    this.uniforms.uDriftScale.value = driftScale(energy, {
      calm: this.options.particles.scrollCalm ?? 0.4,
      reducedMotion: this.reducedMotion,
    })
  }
}
