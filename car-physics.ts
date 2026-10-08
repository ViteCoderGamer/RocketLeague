import { Quaternion, Vector3 } from 'three'
import { CAR, CURVATURE_CURVE, GRAVITY, THROTTLE_CURVE } from './constants'
import { SURFACES, carSupport, surfaceDistance } from './arena'
import { clamp, interp } from './math'
import type { Car, GameEvent } from './types'

const _f = new Vector3()
const _u = new Vector3()
const _l = new Vector3()
const _g = new Vector3()
const _axis = new Vector3()
const _fh = new Vector3()
const _rh = new Vector3()
const _dir = new Vector3()
const _q = new Quaternion()

export function carAxes(q: Quaternion, f: Vector3, u: Vector3, l: Vector3) {
  f.set(0, 0, 1).applyQuaternion(q)
  u.set(0, 1, 0).applyQuaternion(q)
  l.set(1, 0, 0).applyQuaternion(q)
}

export function stepCar(car: Car, dt: number, events: GameEvent[]) {
  const input = car.input
  const jumpPressed = input.jump && !car.prevJump
  car.prevJump = input.jump

  car.boosting = input.boost && car.boost > 0
  if (car.boosting) car.boost = Math.max(0, car.boost - CAR.boostConsumption * dt)

  if (car.grounded) {
    const s = SURFACES[car.surface]
    if (!s.active(car.pos) || surfaceDistance(s, car.pos) > carSupport(car.quat, s.normal) + 0.05) {
      car.grounded = false
      car.airTime = 0
    }
  }

  if (car.grounded) groundStep(car, dt, jumpPressed, events)
  else airStep(car, dt, jumpPressed, events)

  const speed = car.vel.length()
  if (speed > CAR.maxSpeed) car.vel.multiplyScalar(CAR.maxSpeed / speed)

  car.pos.addScaledVector(car.vel, dt)
  resolveSurfaces(car)

  car.supersonic = car.vel.length() >= CAR.supersonicSpeed
  carAxes(car.quat, _f, _u, _l)
  car.wheelSpin += ((car.grounded ? car.vel.dot(_f) : 3) * dt) / 0.16
}

function groundStep(car: Car, dt: number, jumpPressed: boolean, events: GameEvent[]) {
  const input = car.input
  const n = SURFACES[car.surface].normal

  carAxes(car.quat, _f, _u, _l)
  const forwardSpeed = car.vel.dot(_f)
  let yawRate = -input.steer * interp(CURVATURE_CURVE, Math.abs(forwardSpeed)) * forwardSpeed
  if (input.handbrake) yawRate *= 1.35
  _q.setFromAxisAngle(n, yawRate * dt)
  car.quat.premultiply(_q)
  carAxes(car.quat, _f, _u, _l)
  _q.setFromUnitVectors(_u, n)
  car.quat.premultiply(_q).normalize()
  carAxes(car.quat, _f, _u, _l)

  let vf = car.vel.dot(_f)
  let vl = car.vel.dot(_l)
  const throttle = car.boosting ? 1 : input.throttle

  if (Math.abs(throttle) > 0.01) {
    if (vf * throttle < 0 && Math.abs(vf) > 0.1) {
      vf += Math.sign(throttle) * CAR.brakeAccel * dt
    } else {
      vf += interp(THROTTLE_CURVE, Math.abs(vf)) * throttle * dt
    }
  } else {
    const dec = CAR.coastDecel * dt
    vf = Math.abs(vf) <= dec ? 0 : vf - Math.sign(vf) * dec
  }
  if (car.boosting) vf += CAR.boostAccel * dt

  const grip = input.handbrake ? 1.3 : 14
  vl *= Math.exp(-grip * dt)

  car.vel.copy(_f).multiplyScalar(vf).addScaledVector(_l, vl)

  _g.set(0, -GRAVITY, 0)
  _g.addScaledVector(n, -_g.dot(n))
  car.vel.addScaledVector(_g, dt)

  car.angVel.set(0, 0, 0)
  car.airTime = 0

  if (jumpPressed) {
    car.vel.addScaledVector(n, CAR.jumpImpulse)
    car.grounded = false
    car.jumped = true
    car.doubleJumped = false
    car.jumpHolding = true
    car.jumpTimer = 0
    car.dodgeTimer = 0
    events.push({ type: 'jump', car: car.id })
  }
}

function airStep(car: Car, dt: number, jumpPressed: boolean, events: GameEvent[]) {
  const input = car.input
  carAxes(car.quat, _f, _u, _l)

  car.vel.y -= GRAVITY * dt
  car.jumpTimer += dt
  car.airTime += dt

  if (car.jumpHolding) {
    if (input.jump && car.jumpTimer < CAR.jumpHoldTime) car.vel.addScaledVector(_u, CAR.jumpHoldAccel * dt)
    else car.jumpHolding = false
  }

  const canSecondJump = !car.doubleJumped && (!car.jumped || car.jumpTimer < CAR.doubleJumpWindow)
  if (jumpPressed && canSecondJump) {
    car.doubleJumped = true
    car.jumpHolding = false
    const mag = Math.hypot(input.pitch, input.steer)
    if (mag > 0.5) {
      _fh.set(_f.x, 0, _f.z)
      if (_fh.lengthSq() < 0.01) _fh.set(-_u.x, 0, -_u.z)
      _fh.normalize()
      _rh.set(-_fh.z, 0, _fh.x)
      _dir.copy(_fh).multiplyScalar(input.pitch).addScaledVector(_rh, input.steer).normalize()
      car.vel.addScaledVector(_dir, CAR.dodgeImpulse)
      car.vel.y *= car.vel.y < 0 ? 0.15 : 0.55
      car.dodgeTimer = CAR.dodgeDuration
      car.dodgeAxis.set(input.pitch, 0, input.steer).normalize()
    } else {
      car.vel.addScaledVector(_u, CAR.jumpImpulse)
    }
    events.push({ type: 'jump', car: car.id })
  }

  if (car.dodgeTimer > 0) {
    car.dodgeTimer -= dt
    const rate = (Math.PI * 2) / CAR.dodgeDuration
    car.angVel.set(car.dodgeAxis.x * rate, 0, car.dodgeAxis.z * rate)
    if (car.dodgeTimer <= 0) car.angVel.multiplyScalar(0.2)
  } else {
    let yaw = input.yaw
    let roll = input.roll
    if (input.handbrake) {
      roll = clamp(roll + input.steer, -1, 1)
      yaw = 0
    }
    const k = Math.min(1, 7 * dt)
    car.angVel.x += (input.pitch * 5.2 - car.angVel.x) * k
    car.angVel.y += (-yaw * 4.6 - car.angVel.y) * k
    car.angVel.z += (roll * 5.6 - car.angVel.z) * k
  }

  const ang = car.angVel.length()
  if (ang > 1e-5) {
    _axis.copy(car.angVel).divideScalar(ang)
    _q.setFromAxisAngle(_axis, ang * dt)
    car.quat.multiply(_q).normalize()
  }

  if (car.boosting) {
    carAxes(car.quat, _f, _u, _l)
    car.vel.addScaledVector(_f, CAR.boostAccel * dt)
  }
}

function land(car: Car, index: number) {
  const s = SURFACES[index]
  carAxes(car.quat, _f, _u, _l)
  _q.setFromUnitVectors(_u, s.normal)
  car.quat.premultiply(_q).normalize()
  const vn = car.vel.dot(s.normal)
  if (vn < 0) car.vel.addScaledVector(s.normal, -vn)
  car.grounded = true
  car.surface = index
  car.jumped = false
  car.doubleJumped = false
  car.jumpHolding = false
  car.dodgeTimer = 0
  car.angVel.set(0, 0, 0)
  const d = surfaceDistance(s, car.pos)
  const sup = carSupport(car.quat, s.normal)
  if (d < sup) car.pos.addScaledVector(s.normal, sup - d)
}

function resolveSurfaces(car: Car) {
  for (let i = 0; i < SURFACES.length; i++) {
    const s = SURFACES[i]
    if (!s.active(car.pos)) continue
    const d = surfaceDistance(s, car.pos)
    const sup = carSupport(car.quat, s.normal)
    if (d >= sup - 1e-4) continue

    if (car.grounded) {
      if (i === car.surface) {
        car.pos.addScaledVector(s.normal, sup - d)
        continue
      }
      if (s.drivable && car.vel.dot(s.normal) <= 0) {
        const current = SURFACES[car.surface]
        _q.setFromUnitVectors(current.normal, s.normal)
        car.quat.premultiply(_q).normalize()
        car.vel.applyQuaternion(_q)
        car.surface = i
        const d2 = surfaceDistance(s, car.pos)
        car.pos.addScaledVector(s.normal, carSupport(car.quat, s.normal) - d2)
        const d3 = surfaceDistance(current, car.pos)
        const sup3 = carSupport(car.quat, current.normal)
        if (current.active(car.pos) && d3 < sup3) car.pos.addScaledVector(current.normal, sup3 - d3)
      } else {
        car.pos.addScaledVector(s.normal, sup - d)
        const vn = car.vel.dot(s.normal)
        if (vn < 0) car.vel.addScaledVector(s.normal, -vn)
      }
    } else if (s.drivable && s.normal.y > -0.5) {
      land(car, i)
    } else {
      car.pos.addScaledVector(s.normal, sup - d)
      const vn = car.vel.dot(s.normal)
      if (vn < 0) car.vel.addScaledVector(s.normal, -vn * 1.25)
    }
  }
}
