'use client'

import { Environment, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { getWorld } from '@/lib/game/controller'
import { useGameStore } from '@/lib/game/store'
import { ArenaMesh } from './arena-mesh'
import { BallMesh } from './ball-mesh'
import { BoostPads } from './boost-pads'
import { CameraRig } from './camera-rig'
import { CarMesh } from './car-mesh'
import { GameLoop } from './game-loop'
import { NameTagProjector } from './name-tags'
import { Particles } from './particles'

function WorldEntities() {
  useGameStore((s) => s.worldId)
  const w = getWorld()
  return (
    <group key={w.id}>
      {w.cars.map((c) => (
        <CarMesh key={c.id} car={c} />
      ))}
      <BallMesh ball={w.ball} />
      <BoostPads pads={w.pads} />
    </group>
  )
}

export function GameCanvas() {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ fov: 78, near: 0.1, far: 600, position: [0, 18, -50] }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#060a14']} />
      <fog attach="fog" args={['#060a14', 110, 300]} />
      <GameLoop />
      <CameraRig />
      <NameTagProjector />
      <hemisphereLight args={['#c4d2ff', '#1c2b20', 0.7]} />
      <directionalLight position={[30, 60, 20]} intensity={1.5} />
      <directionalLight position={[-30, 50, -25]} intensity={0.6} color="#bcd0ff" />
      <Stars radius={220} depth={60} count={2500} factor={5} fade speed={0.4} />
      <Suspense fallback={null}>
        <Environment preset="night" environmentIntensity={0.7} />
      </Suspense>
      <ArenaMesh />
      <WorldEntities />
      <Particles />
    </Canvas>
  )
}
