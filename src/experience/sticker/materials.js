import * as THREE from 'three'

const frontVertex = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const backVertex = `
  uniform float thickness;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normal);
    vec3 displaced = position - vNormal * thickness;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

const frontFragment = `
  uniform sampler2D map;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec4 tex = texture2D(map, vUv);
    if (tex.a < 0.02) discard;
    vec3 n = normalize(vNormal);
    float up = clamp(n.z, 0.0, 1.0);
    float shade = mix(0.58, 1.0, up);
    float tilt = 1.0 - up;
    vec3 lightDir = normalize(vec3(-0.22, 0.38, 0.9));
    float sheen = pow(clamp(dot(n, lightDir), 0.0, 1.0), 2.0) * tilt;
    float rim = smoothstep(0.42, 0.0, abs(n.z));
    vec3 color = tex.rgb * shade + sheen * 0.055;
    color = mix(color, color * vec3(0.9, 0.89, 0.86), rim * 0.28 * tilt);
    gl_FragColor = vec4(color * tex.a, tex.a);
  }
`

const backFragment = `
  uniform sampler2D map;
  uniform vec3 paper;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec4 tex = texture2D(map, vUv);
    if (tex.a < 0.02) discard;
    vec3 n = normalize(vNormal);
    float facing = clamp(-n.z, 0.0, 1.0);
    float shade = mix(0.84, 1.0, facing);
    float rim = smoothstep(0.5, 0.0, abs(n.z));
    vec3 color = paper * shade;
    color = mix(color, color * 0.9, rim * 0.45);
    gl_FragColor = vec4(color * tex.a, tex.a);
  }
`

const shadowVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const shadowFragment = `
  uniform sampler2D map;
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    float alpha = smoothstep(0.08, 0.5, texture2D(map, vUv).a) * opacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(vec3(0.07) * alpha, alpha);
  }
`

function sheetTexture(texture) {
  texture.colorSpace = THREE.NoColorSpace
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

export function createStickerMaterials(texture, { thickness, backColor, anisotropy }) {
  sheetTexture(texture)
  texture.anisotropy = anisotropy

  const front = new THREE.ShaderMaterial({
    uniforms: { map: { value: texture } },
    vertexShader: frontVertex,
    fragmentShader: frontFragment,
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
    toneMapped: false,
  })

  const back = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      paper: { value: new THREE.Vector3(backColor[0], backColor[1], backColor[2]) },
      thickness: { value: thickness },
    },
    vertexShader: backVertex,
    fragmentShader: backFragment,
    transparent: true,
    depthWrite: true,
    side: THREE.BackSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    toneMapped: false,
  })

  const shadow = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      opacity: { value: 0 },
    },
    vertexShader: shadowVertex,
    fragmentShader: shadowFragment,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    toneMapped: false,
  })

  return { front, back, shadow }
}
