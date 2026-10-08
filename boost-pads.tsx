'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import type { BoostPad } from '@/lib/game/types'

function Pad({ pad }: { pad: BoostPad }) {
  const orb = useRef<Mesh>(null)
  const ring = useRef<Mesh>(null)
  const group = useRef<Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (orb.current) {
      orb.current.visible = pad.active
      orb.current.position.y = 1 + Math.sin(t * 2 + pad.id) * 0.12
      orb.current.rotation.y = t * 1.5
    }
    if (ring.current) {
      const m = ring.current.material as MeshBasicMaterial
      m.opacity = pad.active ? 0.95 : 0.2
    }
  })

  return (
    <group ref={group} position={[pad.pos.x, 0, pad.pos.z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={pad.big ? [0.9, 1.25, 32] : [0.35, 0.6, 24]} />
        <meshBasicMaterial color="#ffb347" toneMapped={false} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[pad.big ? 0.9 : 0.35, 24]} />
        <meshStandardMaterial color="#20283a" />
      </mesh>
      {pad.big && (
        <mesh ref={orb}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshBasicMaterial color="#ffc85c" toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

export function BoostPads({ pads }: { pads: BoostPad[] }) {
  return (
    <>
      {pads.map((p) => (
        <Pad key={p.id} pad={p} />
      ))}
    </>
  )
}
