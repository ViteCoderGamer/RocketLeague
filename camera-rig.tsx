'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { type PerspectiveCamera, Vector3 } from 'three'
import { carAxes } from '@/lib/game/car-physics'
import { ARENA } from '@/lib/game/constants'
import { getWorld } from '@/lib/game/controller'
import { clamp } from '@/lib/game/math'
import { useGameStore } from '@/lib/game/store'

const _f = new Vector3()
const _u = new Vector3()
const _l = new Vector3()
const _dir = new Vector3()
const _desired = new Vector3()
const _look = new Vector3()

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const camDir = useRef(new Vector3(0, 0, 1))
  const pos = useRef(new Vector3(0, 18, -50))
  const look = useRef(new Vector3())
  const orbit = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const w = getWorld()
    const { screen, ballCam } = useGameStore.getState()
    const ball = w.ball
    const player = screen === 'game' ? w.cars.find((c) => c.isPlayer) : undefined

    if (!player) {
      orbit.current += dt * 0.07
      const a = orbit.current
      _desired.set(Math.sin(a) * 34 + ball.pos.x * 0.4, 14, Math.cos(a) * 40 + ball.pos.z * 0.4)
      pos.current.lerp(_desired, 1 - Math.exp(-2 * dt))
      look.current.lerp(ball.pos, 1 - Math.exp(-3 * dt))
    } else if (player.demolished) {
      look.current.lerp(ball.pos, 1 - Math.exp(-4 * dt))
    } else {
      const useBall = ballCam && !ball.hidden
      if (useBall) {
        _dir.set(ball.pos.x - player.pos.x, 0, ball.pos.z - player.pos.z)
      } else {
        carAxes(player.quat, _f, _u, _l)
        _dir.set(_f.x, 0, _f.z)
        if (_dir.lengthSq() < 0.05) _dir.set(player.vel.x, 0, player.vel.z)
      }
      if (_dir.lengthSq() > 0.0001) {
        _dir.normalize()
        camDir.current.lerp(_dir, 1 - Math.exp(-(useBall ? 7 : 5) * dt)).normalize()
      }
      const cd = camDir.current
      pos.current.set(player.pos.x - cd.x * 2.9, player.pos.y + 1.1, player.pos.z - cd.z * 2.9)
      const tilt = useBall ? clamp((ball.pos.y - player.pos.y) * 0.3, -0.4, 3.5) : 0
      _look.set(player.pos.x + cd.x * 3, player.pos.y + 0.55 + tilt, player.pos.z + cd.z * 3)
      look.current.lerp(_look, 1 - Math.exp(-20 * dt))
    }

    const p = pos.current
    if (player) {
      p.x = clamp(p.x, -ARENA.halfWidth + 0.4, ARENA.halfWidth - 0.4)
      const inGoalX = Math.abs(p.x) < ARENA.goalHalfWidth
      const zLim = inGoalX ? ARENA.halfLength + ARENA.goalDepth - 0.4 : ARENA.halfLength - 0.4
      p.z = clamp(p.z, -zLim, zLim)
      p.y = clamp(p.y, 0.35, ARENA.height - 0.4)
    }
    camera.position.copy(p)
    camera.lookAt(look.current)

    const targetFov = player?.boosting ? 84 : 78
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-6 * dt))
      camera.updateProjectionMatrix()
    }
  })

  return null
}
