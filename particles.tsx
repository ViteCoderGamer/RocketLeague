'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { AdditiveBlending, Color, type InstancedMesh, Object3D, type Vector3 } from 'three'

const MAX = 2400
const pos = new Float32Array(MAX * 3)
const vel = new Float32Array(MAX * 3)
const col = new Float32Array(MAX * 3)
const life = new Float32Array(MAX)
const maxLife = new Float32Array(MAX)
const size = new Float32Array(MAX)
const grav = new Float32Array(MAX)
let cursor = 0

export function emitParticle(
  x: number, y: number, z: number,
  vx: number, vy: number, vz: number,
  color: Color, s: number, l: number, g = 0,
) {
  const i = cursor
  cursor = (cursor + 1) % MAX
  pos[i * 3] = x
  pos[i * 3 + 1] = y
  pos[i * 3 + 2] = z
  vel[i * 3] = vx
  vel[i * 3 + 1] = vy
  vel[i * 3 + 2] = vz
  col[i * 3] = color.r
  col[i * 3 + 1] = color.g
  col[i * 3 + 2] = color.b
  life[i] = l
  maxLife[i] = l
  size[i] = s
  grav[i] = g
}

export function burst(p: Vector3, count: number, color: Color, speed: number, s: number, l: number, g = 0) {
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1
    const th = Math.random() * Math.PI * 2
    const r = Math.sqrt(1 - u * u)
    const sp = speed * (0.4 + Math.random() * 0.6)
    emitParticle(p.x, p.y, p.z, r * Math.cos(th) * sp, Math.abs(u) * sp * 0.8 + u * sp * 0.4, r * Math.sin(th) * sp, color, s * (0.6 + Math.random() * 0.8), l * (0.6 + Math.random() * 0.6), g)
  }
}

const dummy = new Object3D()
const tmpColor = new Color()

export function Particles() {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    dummy.scale.setScalar(0)
    dummy.updateMatrix()
    for (let i = 0; i < MAX; i++) {
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, tmpColor.setRGB(1, 1, 1))
    }
  }, [])

  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const dt = Math.min(delta, 0.05)
    for (let i = 0; i < MAX; i++) {
      if (life[i] <= 0) {
        if (maxLife[i] > 0) {
          maxLife[i] = 0
          dummy.scale.setScalar(0)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        }
        continue
      }
      life[i] -= dt
      const k = i * 3
      vel[k + 1] -= grav[i] * dt
      const drag = 1 - 1.5 * dt
      vel[k] *= drag
      vel[k + 1] *= drag
      vel[k + 2] *= drag
      pos[k] += vel[k] * dt
      pos[k + 1] += vel[k + 1] * dt
      pos[k + 2] += vel[k + 2] * dt
      const t = Math.max(0, life[i] / maxLife[i])
      dummy.position.set(pos[k], pos[k + 1], pos[k + 2])
      dummy.scale.setScalar(size[i] * (0.3 + t * 0.7))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, tmpColor.setRGB(col[k] * t, col[k + 1] * t, col[k + 2] * t))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial toneMapped={false} transparent blending={AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  )
}
