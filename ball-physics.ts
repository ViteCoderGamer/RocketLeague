import { Quaternion, Vector3 } from 'three'
import { BALL, GRAVITY } from './constants'
import { SURFACES, surfaceDistance } from './arena'
import type { Ball, GameEvent } from './types'

const _t = new Vector3()
const _axis = new Vector3()
const _q = new Quaternion()

export function stepBall(ball: Ball, dt: number, events: GameEvent[]) {
  if (ball.hidden) return
  const R = BALL.radius

  ball.vel.y -= GRAVITY * dt
  ball.vel.multiplyScalar(Math.max(0, 1 - BALL.drag * dt))
  const speed = ball.vel.length()
  if (speed > BALL.maxSpeed) ball.vel.multiplyScalar(BALL.maxSpeed / speed)

  ball.pos.addScaledVector(ball.vel, dt)

  for (let i = 0; i < SURFACES.length; i++) {
    const s = SURFACES[i]
    if (!s.active(ball.pos)) continue
    const d = surfaceDistance(s, ball.pos)
    if (d >= R) continue
    const n = s.normal
    ball.pos.addScaledVector(n, R - d)
    const vn = ball.vel.dot(n)
    if (vn < 0) {
      if (vn < -1.2) {
        ball.vel.addScaledVector(n, -vn * (1 + BALL.restitution))
        _t.copy(ball.vel).addScaledVector(n, -ball.vel.dot(n))
        ball.vel.addScaledVector(_t, -0.06)
        if (vn < -5) events.push({ type: 'bounce', strength: -vn })
      } else {
        ball.vel.addScaledVector(n, -vn)
      }
    }
    _t.copy(ball.vel).addScaledVector(n, -ball.vel.dot(n))
    ball.angVel.crossVectors(n, _t).divideScalar(R)
    if (i === 0) {
      const f = Math.max(0, 1 - 0.12 * dt)
      ball.vel.x *= f
      ball.vel.z *= f
    }
  }

  const ang = ball.angVel.length()
  if (ang > 1e-4) {
    _axis.copy(ball.angVel).divideScalar(ang)
    _q.setFromAxisAngle(_axis, ang * dt)
    ball.quat.premultiply(_q).normalize()
  }
}
