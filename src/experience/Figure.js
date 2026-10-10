import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { createMannequin } from './createMannequin.js'
import { noiseChunk } from '../shaders/noise.js'

function sanitizeGeometry(geometry) {
  const result = new THREE.BufferGeometry()
  result.setAttribute('position', geometry.getAttribute('position').clone())
  if (geometry.getIndex()) {
    result.setIndex(geometry.getIndex().clone())
  }
  result.computeVertexNormals()
  return result
}

function bakeSkinnedMesh(mesh) {
  mesh.updateMatrixWorld(true)
  mesh.skeleton.update()

  const geometry = mesh.geometry.clone()
  const position = geometry.getAttribute('position')
  const skinIndex = geometry.getAttribute('skinIndex')
  const skinWeight = geometry.getAttribute('skinWeight')
  const vertex = new THREE.Vector3()
  const result = new THREE.Vector4()
  const temp = new THREE.Vector4()
  const boneMatrix = new THREE.Matrix4()
  const applied = new THREE.Vector3()

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i)
    temp.set(vertex.x, vertex.y, vertex.z, 1).applyMatrix4(mesh.bindMatrix)
    result.set(0, 0, 0, 0)

    for (let j = 0; j < 4; j += 1) {
      const weight = skinWeight.getComponent(i, j)
      if (weight === 0) continue
      const index = skinIndex.getComponent(i, j)
      boneMatrix.fromArray(mesh.skeleton.boneMatrices, index * 16)
      const skinned = temp.clone().applyMatrix4(boneMatrix).multiplyScalar(weight)
      result.add(skinned)
    }

    applied.set(result.x, result.y, result.z).applyMatrix4(mesh.bindMatrixInverse)
    position.setXYZ(i, applied.x, applied.y, applied.z)
  }

  geometry.computeVertexNormals()
  geometry.applyMatrix4(mesh.matrixWorld)
  return geometry
}

export class Figure {
  constructor(scene, options) {
    this.scene = scene
    this.options = options
    this.group = new THREE.Group()
    this.mesh = null
    this.geometry = null
    this.uniforms = {
      uTime: { value: 0 },
    }
    this.scene.add(this.group)
  }

  async load() {
    let geometry
    try {
      geometry = this.options.modelUrl
        ? await this.loadModel(this.options.modelUrl)
        : createMannequin(this.options.height)
    } catch (error) {
      console.warn('Figure model failed, using temporary mannequin.', error)
      geometry = createMannequin(this.options.height)
    }

    this.geometry = geometry
    const material = new THREE.MeshStandardMaterial({
      color: this.options.color,
      roughness: this.options.roughness,
      metalness: this.options.metalness,
      transparent: true,
      dithering: true,
    })

    const dissolve = this.options.dissolve
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.uniforms.uTime
      shader.uniforms.uCoreRadius = { value: dissolve.coreRadius }
      shader.uniforms.uEdgeRadius = { value: dissolve.edgeRadius }
      shader.uniforms.uNoiseScale = { value: dissolve.noiseScale }
      shader.uniforms.uNoiseSpeed = { value: dissolve.noiseSpeed }
      shader.uniforms.uDissolve = { value: dissolve.strength }
      shader.uniforms.uBodyHeight = { value: this.options.height }

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        varying vec3 vLocalPosition;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;`,
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vLocalPosition = position;
        vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);`,
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
        varying vec3 vLocalPosition;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        uniform float uTime;
        uniform float uCoreRadius;
        uniform float uEdgeRadius;
        uniform float uNoiseScale;
        uniform float uNoiseSpeed;
        uniform float uDissolve;
        uniform float uBodyHeight;
        ${noiseChunk}`,
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        float radial = length(vLocalPosition.xz);
        float ny = vLocalPosition.y / max(uBodyHeight, 0.001);
        float silhouette = smoothstep(uCoreRadius, uEdgeRadius, radial);
        float head = smoothstep(0.82, 0.93, ny) * 0.7;
        float legs = (1.0 - smoothstep(0.18, 0.4, ny)) * 0.55;
        float n = snoise(vLocalPosition * uNoiseScale + vec3(0.0, uTime * uNoiseSpeed, uTime * uNoiseSpeed * 0.7));
        float dissolve = clamp((silhouette * 0.75 + head + legs) * uDissolve, 0.0, 1.0);
        dissolve = dissolve * (0.55 + 0.45 * n);
        if (dissolve > 0.78) discard;
        gl_FragColor.a *= 1.0 - smoothstep(0.45, 0.78, dissolve);

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float rim = pow(1.0 - max(dot(viewDir, normalize(vWorldNormal)), 0.0), 2.6);
        gl_FragColor.rgb += vec3(0.16) * rim;

        #include <dithering_fragment>
        `,
      )
    }

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.castShadow = false
    this.mesh.receiveShadow = false
    this.group.rotation.y = this.options.yawOffset
    this.group.add(this.mesh)
    return this
  }

  async loadModel(url) {
    const root = url.endsWith('.obj') ? await this.loadObject(url) : await this.loadGltf(url)
    const geometries = []

    root.updateMatrixWorld(true)
    root.traverse((child) => {
      if (!child.isMesh || !child.geometry) return
      const name = (child.name || child.parent?.name || '').toLowerCase()
      if (name.startsWith('joint') || name.startsWith('helper')) return
      const baked = child.isSkinnedMesh
        ? bakeSkinnedMesh(child)
        : child.geometry.clone().applyMatrix4(child.matrixWorld)
      geometries.push(sanitizeGeometry(baked))
    })

    if (!geometries.length) {
      throw new Error(`No usable meshes in ${url}`)
    }

    const merged = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false)
    merged.deleteAttribute('uv')
    merged.deleteAttribute('normal')
    const welded = mergeVertices(merged, 1e-4)
    welded.computeBoundingBox()
    const size = new THREE.Vector3()
    welded.boundingBox.getSize(size)
    const scale = this.options.height / Math.max(size.y, 0.001)
    welded.scale(scale, scale, scale)
    welded.computeBoundingBox()
    welded.translate(
      -(welded.boundingBox.min.x + welded.boundingBox.max.x) * 0.5,
      -welded.boundingBox.min.y,
      -(welded.boundingBox.min.z + welded.boundingBox.max.z) * 0.5,
    )
    this.shapePlaceholderMale(welded, this.options.height)
    welded.computeVertexNormals()
    welded.computeBoundingBox()
    welded.computeBoundingSphere()
    return welded
  }

  shapePlaceholderMale(geometry, height) {
    const position = geometry.getAttribute('position')
    const vertex = new THREE.Vector3()
    for (let i = 0; i < position.count; i += 1) {
      vertex.fromBufferAttribute(position, i)
      const ny = vertex.y / height
      const shoulder = Math.max(0, Math.min(1, (ny - 0.58) / 0.18)) * (1 - Math.max(0, Math.min(1, (ny - 0.8) / 0.08)))
      const hip = Math.max(0, Math.min(1, (ny - 0.48) / 0.08)) * (1 - Math.max(0, Math.min(1, (ny - 0.58) / 0.08)))
      vertex.x *= 1 + shoulder * 0.18 - hip * 0.1
      if (ny > 0.62 && ny < 0.78 && vertex.z > 0.035) {
        vertex.z = 0.035 + (vertex.z - 0.035) * 0.38
      }
      position.setXYZ(i, vertex.x, vertex.y, vertex.z)
    }
    position.needsUpdate = true
  }

  async loadGltf(url) {
    const gltf = await new GLTFLoader().loadAsync(url)
    const idle = gltf.animations.find((clip) => /idle/i.test(clip.name)) ?? gltf.animations[0]
    if (idle) {
      const mixer = new THREE.AnimationMixer(gltf.scene)
      const action = mixer.clipAction(idle)
      action.play()
      mixer.update(0)
    }
    gltf.scene.updateMatrixWorld(true)
    return gltf.scene
  }

  async loadObject(url) {
    const object = await new OBJLoader().loadAsync(url)
    object.updateMatrixWorld(true)
    return object
  }

  update(time, progress) {
    this.uniforms.uTime.value = time
    this.group.rotation.y = this.options.yawOffset + progress * this.options.yawDrift
  }
}
