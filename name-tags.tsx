'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { getWorld } from '@/lib/game/controller'
import { useGameStore } from '@/lib/game/store'

const tagElements = new Map<number, HTMLElement>()
const _p = new Vector3()

export function registerTag(id: number, el: HTMLElement | null) {
  if (el) tagElements.set(id, el)
  else tagElements.delete(id)
}

export function NameTagProjector() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useFrame(() => {
    const w = getWorld()
    for (const car of w.cars) {
      const el = tagElements.get(car.id)
      if (!el) continue
      _p.set(car.pos.x, car.pos.y + 0.9, car.pos.z).project(camera)
      const visible = !car.demolished && _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1
      el.style.opacity = visible ? '1' : '0'
      if (!visible) continue
      const x = (_p.x * 0.5 + 0.5) * size.width
      const y = (-_p.y * 0.5 + 0.5) * size.height
      el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`
    }
  })
  return null
}

export function NameTagLayer() {
  const worldId = useGameStore((s) => s.worldId)
  if (worldId === 0) return null
  const cars = getWorld().cars.filter((c) => !c.isPlayer)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {cars.map((car) => (
        <div
          key={`${car.id}-${car.name}`}
          ref={(el) => registerTag(car.id, el)}
          className="absolute left-0 top-0 whitespace-nowrap rounded-sm px-1.5 py-0.5 font-display text-xs font-semibold uppercase tracking-wider text-foreground opacity-0"
          style={{ background: car.team === 0 ? 'rgba(47,123,255,0.8)' : 'rgba(255,138,31,0.85)' }}
        >
          {car.name}
        </div>
      ))}
    </div>
  )
}
