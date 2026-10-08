'use client'

import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { type Group, type Mesh, Quaternion } from 'three'
import { TEAM_COLORS } from '@/lib/game/constants'
import type { Car } from '@/lib/game/types'

const WHEELS: [number, number, boolean][] = [
  [0.4, 0.36, true],
  [-0.4, 0.36, true],
  [0.4, -0.36, false],
  [-0.4, -0.36, false],
]

export function CarMesh({ car }: { car: Car }) {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const flame = useRef<Mesh>(null)
  const wheelRefs = useRef<(Group | null)[]>([])
  const visualQuat = useRef(new Quaternion().copy(car.quat))
  const color = TEAM_COLORS[car.team]

  useFrame((_, delta) => {
    const r = root.current
    const b = body.current
    if (!r || !b) return
    r.visible = !car.demolished
    r.position.copy(car.pos)
    const q = visualQuat.current
    if (q.angleTo(car.quat) > 1.2) q.slerp(car.quat, 1 - Math.exp(-18 * delta))
    else q.slerp(car.quat, 1 - Math.exp(-40 * delta))
    b.quaternion.copy(q)

    wheelRefs.current.forEach((w, i) => {
      if (!w) return
      w.rotation.order = 'YXZ'
      w.rotation.x = car.wheelSpin
      w.rotation.y = WHEELS[i][2] ? -car.input.steer * 0.45 : 0
    })

    const f = flame.current
    if (f) {
      f.visible = car.boosting
      const s = 0.8 + Math.random() * 0.5
      f.scale.set(1, s, 1)
    }
  })

  return (
    <group ref={root}>
      <group ref={body}>
        <RoundedBox args={[0.8, 0.2, 1.16]} radius={0.06} smoothness={3} position={[0, 0.02, 0]}>
          <meshStandardMaterial color={color} metalness={0.55} roughness={0.32} />
        </RoundedBox>
        <RoundedBox args={[0.64, 0.17, 0.5]} radius={0.06} smoothness={3} position={[0, 0.17, -0.08]}>
          <meshStandardMaterial color="#0d1424" metalness={0.8} roughness={0.12} />
        </RoundedBox>
        <mesh position={[0, 0.1, 0.38]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.7, 0.04, 0.34]} />
          <meshStandardMaterial color={color} metalness={0.55} roughness={0.32} />
        </mesh>
        <mesh position={[0, -0.05, 0.585]}>
          <boxGeometry args={[0.82, 0.07, 0.04]} />
          <meshStandardMaterial color="#141a26" />
        </mesh>
        {[-0.28, 0.28].map((x) => (
          <mesh key={`hl${x}`} position={[x, 0.05, 0.585]}>
            <boxGeometry args={[0.14, 0.04, 0.02]} />
            <meshBasicMaterial color="#e9f3ff" toneMapped={false} />
          </mesh>
        ))}
        {[-0.28, 0.28].map((x) => (
          <mesh key={`tl${x}`} position={[x, 0.06, -0.585]}>
            <boxGeometry args={[0.16, 0.04, 0.02]} />
            <meshBasicMaterial color="#ff3b3b" toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0.3, -0.52]}>
          <boxGeometry args={[0.78, 0.035, 0.16]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
        </mesh>
        {[-0.28, 0.28].map((x) => (
          <mesh key={`sp${x}`} position={[x, 0.2, -0.52]}>
            <boxGeometry args={[0.04, 0.18, 0.06]} />
            <meshStandardMaterial color="#141a26" />
          </mesh>
        ))}
        {WHEELS.map(([x, z], i) => (
          <group key={i} position={[x, -0.025, z]} ref={(el) => { wheelRefs.current[i] = el }}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.13, 18]} />
              <meshStandardMaterial color="#121620" roughness={0.85} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} position={[x > 0 ? 0.066 : -0.066, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.01, 6]} />
              <meshStandardMaterial color="#c7d0de" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
        <mesh ref={flame} position={[0, 0.04, -0.85]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <coneGeometry args={[0.1, 0.5, 12]} />
          <meshBasicMaterial color={car.team === 0 ? '#9fdcff' : '#ffc46b'} toneMapped={false} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  )
}
