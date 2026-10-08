import { Quaternion, Vector3 } from 'three'
import {
  ARENA, BALL, BIG_PADS, BOT_NAMES, CAR, GRAVITY, KICKOFF_SLOTS, PSYONIX_CURVE, RESPAWN_SLOTS, SMALL_PADS,
} from './constants'
import { carAxes, stepCar } from './car-physics'
import { stepBall } from './ball-physics'
import { clamp, interp, shuffle } from './math'
import type { Car, CarInput, MatchSettings, Team, World } from './types'

let worldCounter = 0
const UP = new Vector3(0, 1, 0)

const _inv = new Quaternion()
const _local = new Vector3()
const _closest = new Vector3()
const _n = new Vector3()
const _rel = new Vector3()
const _dir = new Vector3()
const _f = new Vector3()
const _u = new Vector3()
const _l = new Vector3()
const _d = new Vector3()

export function emptyInput(): CarInput {
  return { throttle: 0, steer: 0, pitch: 0, yaw: 0, roll: 0, jump: false, boost: false, handbrake: false }
}

function createCar(id: number, team: Team, name: string, isPlayer: boolean): Car {
  return {
    id, name, team, isPlayer,
    pos: new Vector3(), vel: new Vector3(), quat: new Quaternion(), angVel: new Vector3(),
    grounded: true, surface: 0, boost: CAR.kickoffBoost, boosting: false, supersonic: false,
    jumped: false, doubleJumped: false, jumpHolding: false, jumpTimer: 0, airTime: 0,
    dodgeTimer: 0, dodgeAxis: new Vector3(), prevJump: false, demolished: false, respawnTimer: 0,
    lastBallHit: -10, wheelSpin: 0, input: emptyInput(),
    stats: { score: 0, goals: 0, assists: 0, saves: 0, shots: 0, demos: 0 },
    bot: { flipPlanned: false, stuckTimer: 0, reverseTimer: 0 },
  }
}

export function createWorld(settings: MatchSettings, demo: boolean): World {
  const names = shuffle([...BOT_NAMES])
  const cars: Car[] = []
  let id = 0
  for (const team of [0, 1] as Team[]) {
    for (let i = 0; i < settings.teamSize; i++) {
      const isPlayer = !demo && team === 0 && i === 0
      cars.push(createCar(id++, team, isPlayer ? settings.playerName.trim() || 'You' : names.pop() ?? 'Bot', isPlayer))
    }
  }
  const pads = [
    ...BIG_PADS.map(([x, z]) => ({ x, z, big: true })),
    ...SMALL_PADS.map(([x, z]) => ({ x, z, big: false })),
  ].map((p, i) => ({ id: i, pos: new Vector3(p.x, 0, p.z), big: p.big, active: true, timer: 0 }))

  const world: World = {
    id: ++worldCounter,
    settings,
    demo,
    cars,
    ball: { pos: new Vector3(), vel: new Vector3(), quat: new Quaternion(), angVel: new Vector3(), hidden: false, touches: [] },
    pads,
    phase: 'countdown',
    phaseTimer: 3,
    timeLeft: demo ? Infinity : settings.matchMinutes * 60,
    overtime: false,
    overtimeElapsed: 0,
    score: [0, 0],
    winner: null,
    endAfterGoal: false,
    time: 0,
    events: [],
    lastShot: { car: -1, time: -10 },
  }
  resetKickoff(world)
  return world
}

function placeCar(car: Car, x: number, z: number, tx: number, tz: number) {
  car.pos.set(x, CAR.half.y, z)
  car.vel.set(0, 0, 0)
  car.angVel.set(0, 0, 0)
  car.quat.setFromAxisAngle(UP, Math.atan2(tx - x, tz - z))
  car.grounded = true
  car.surface = 0
  car.jumped = false
  car.doubleJumped = false
  car.jumpHolding = false
  car.dodgeTimer = 0
  car.boosting = false
  car.supersonic = false
  car.demolished = false
  car.respawnTimer = 0
  car.prevJump = true
  car.bot.flipPlanned = false
  car.bot.stuckTimer = 0
  car.bot.reverseTimer = 0
}

export function resetKickoff(w: World) {
  const b = w.ball
  b.pos.set(0, BALL.radius, 0)
  b.vel.set(0, 0, 0)
  b.angVel.set(0, 0, 0)
  b.hidden = false
  b.touches.length = 0
  const slots = shuffle([0, 1, 2, 3, 4]).slice(0, w.settings.teamSize)
  for (const team of [0, 1] as Team[]) {
    const members = w.cars.filter((c) => c.team === team)
    members.forEach((car, i) => {
      const [sx, sz] = KICKOFF_SLOTS[slots[i]]
      const sign = team === 0 ? 1 : -1
      placeCar(car, sx * sign, sz * sign, 0, 0)
      car.boost = CAR.kickoffBoost
    })
  }
  for (const pad of w.pads) {
    pad.active = true
    pad.timer = 0
  }
  w.phase = 'countdown'
  w.phaseTimer = 3
  w.events.push({ type: 'kickoff' })
}

function respawnCar(w: World, car: Car) {
  const [sx, sz] = RESPAWN_SLOTS[car.id % RESPAWN_SLOTS.length]
  const sign = car.team === 0 ? 1 : -1
  placeCar(car, sx * sign, sz * sign, sx * sign, 0)
  car.prevJump = car.input.jump
  car.boost = CAR.kickoffBoost
}

export function stepWorld(w: World, dt: number) {
  w.time += dt
  if (w.phase === 'countdown') {
    w.phaseTimer -= dt
    if (w.phaseTimer <= 0) {
      w.phase = 'playing'
      w.events.push({ type: 'go' })
    }
    return
  }

  for (const car of w.cars) {
    if (car.demolished) {
      car.respawnTimer -= dt
      if (car.respawnTimer <= 0) respawnCar(w, car)
      continue
    }
    stepCar(car, dt, w.events)
  }

  if (w.phase === 'playing') {
    stepBall(w.ball, dt, w.events)
    for (const car of w.cars) if (!car.demolished) collideCarBall(w, car)
  }
  collideCars(w)
  updatePads(w, dt)

  if (w.phase === 'playing') {
    checkGoal(w)
    if (w.phase === 'playing') updateClock(w, dt)
  } else if (w.phase === 'goal') {
    w.phaseTimer -= dt
    if (w.phaseTimer <= 0) {
      if (w.endAfterGoal) endMatch(w)
      else resetKickoff(w)
    }
  }
}

function updateClock(w: World, dt: number) {
  if (w.demo) return
  if (w.overtime) {
    w.overtimeElapsed += dt
    return
  }
  w.timeLeft = Math.max(0, w.timeLeft - dt)
  if (w.timeLeft > 0) return
  if (w.ball.pos.y > BALL.radius + 0.05) return
  if (w.score[0] !== w.score[1]) {
    endMatch(w)
  } else {
    w.overtime = true
    w.events.push({ type: 'overtime' })
    resetKickoff(w)
  }
}

function endMatch(w: World) {
  w.phase = 'ended'
  w.winner = w.score[0] > w.score[1] ? 0 : 1
  w.ball.hidden = true
  w.events.push({ type: 'end', winner: w.winner })
}

function checkGoal(w: World) {
  const b = w.ball
  const lim = ARENA.halfLength + BALL.radius
  let team: Team | null = null
  if (b.pos.z > lim) team = 0
  else if (b.pos.z < -lim) team = 1
  if (team === null) return

  w.score[team]++
  const scorer = b.touches.find((id) => w.cars[id].team === team)
  const assist = scorer === undefined ? undefined : b.touches.find((id) => id !== scorer && w.cars[id].team === team)
  if (scorer !== undefined) {
    w.cars[scorer].stats.goals++
    w.cars[scorer].stats.score += 100
  }
  if (assist !== undefined) {
    w.cars[assist].stats.assists++
    w.cars[assist].stats.score += 50
  }

  for (const car of w.cars) {
    if (car.demolished) continue
    const d = car.pos.distanceTo(b.pos)
    if (d > 14) continue
    _d.copy(car.pos).sub(b.pos).normalize().multiplyScalar(16 * (1 - d / 14) + 4)
    _d.y += 5
    car.vel.add(_d)
    car.grounded = false
  }

  w.events.push({ type: 'goal', team, scorer, assist, pos: b.pos.clone(), speed: b.vel.length() })
  b.hidden = true
  b.vel.set(0, 0, 0)
  w.phase = 'goal'
  w.phaseTimer = w.demo ? 2.5 : 3.5
  if (w.overtime) w.endAfterGoal = true
}

function predictGoal(pos: Vector3, vel: Vector3, side: 1 | -1) {
  let x = pos.x, y = pos.y, z = pos.z
  let vx = vel.x, vy = vel.y
  const vz = vel.z
  const R = BALL.radius
  const step = 0.05
  for (let t = 0; t < 2.5; t += step) {
    vy -= GRAVITY * step
    x += vx * step
    y += vy * step
    z += vz * step
    if (y < R) {
      y = R
      vy = -vy * BALL.restitution
    }
    if (Math.abs(x) > ARENA.halfWidth - R) vx = -vx
    if (side * z > ARENA.halfLength) return Math.abs(x) < ARENA.goalHalfWidth && y < ARENA.goalHeight
    if (side * z < -ARENA.halfLength) return false
  }
  return false
}

function collideCarBall(w: World, car: Car) {
  const b = w.ball
  if (b.hidden) return
  const R = BALL.radius
  const h = CAR.half
  _inv.copy(car.quat).invert()
  _local.copy(b.pos).sub(car.pos).applyQuaternion(_inv)
  _closest.set(clamp(_local.x, -h.x, h.x), clamp(_local.y, -h.y, h.y), clamp(_local.z, -h.z, h.z))
  _n.copy(_local).sub(_closest)
  let dist = _n.length()
  if (dist >= R) return
  if (dist < 1e-4) {
    _n.set(0, 1, 0)
    dist = 0
  } else {
    _n.divideScalar(dist)
  }
  _n.applyQuaternion(car.quat)
  b.pos.addScaledVector(_n, R - dist)

  _rel.copy(b.vel).sub(car.vel)
  const vn = _rel.dot(_n)
  if (vn >= 0) return

  const ownSide: 1 | -1 = car.team === 0 ? -1 : 1
  const threatened = predictGoal(b.pos, b.vel, ownSide)

  const j = (-(1 + BALL.carRestitution) * vn) / (1 / BALL.mass + 1 / CAR.mass)
  b.vel.addScaledVector(_n, j / BALL.mass)
  car.vel.addScaledVector(_n, -j / CAR.mass)

  if (w.time - car.lastBallHit > 0.1) {
    const relSpeed = Math.min(_rel.length(), 46)
    carAxes(car.quat, _f, _u, _l)
    _dir.copy(b.pos).sub(car.pos)
    _dir.y *= 0.35
    _dir.addScaledVector(_f, -0.35 * _dir.dot(_f)).normalize()
    b.vel.addScaledVector(_dir, relSpeed * interp(PSYONIX_CURVE, relSpeed))
    car.lastBallHit = w.time

    if (b.touches[0] !== car.id) b.touches.unshift(car.id)
    if (b.touches.length > 5) b.touches.length = 5
    car.stats.score += 2
    w.events.push({ type: 'hit', car: car.id, strength: relSpeed, pos: b.pos.clone() })

    const speed = b.vel.length()
    if (speed > BALL.maxSpeed) b.vel.multiplyScalar(BALL.maxSpeed / speed)

    if (predictGoal(b.pos, b.vel, (-ownSide) as 1 | -1) && !(w.lastShot.car === car.id && w.time - w.lastShot.time < 2)) {
      car.stats.shots++
      car.stats.score += 20
      w.lastShot = { car: car.id, time: w.time }
      w.events.push({ type: 'shot', car: car.id })
    }
    if (threatened && !predictGoal(b.pos, b.vel, ownSide)) {
      car.stats.saves++
      car.stats.score += 50
      w.events.push({ type: 'save', car: car.id })
    }
  }
}

function demolish(w: World, victim: Car, attacker: Car) {
  victim.demolished = true
  victim.respawnTimer = CAR.respawnTime
  attacker.stats.demos++
  attacker.stats.score += 25
  w.events.push({ type: 'demo', attacker: attacker.id, victim: victim.id, pos: victim.pos.clone() })
  victim.vel.set(0, 0, 0)
}

function collideCars(w: World) {
  const cars = w.cars
  for (let i = 0; i < cars.length; i++) {
    const a = cars[i]
    if (a.demolished) continue
    for (let k = i + 1; k < cars.length; k++) {
      const b = cars[k]
      if (b.demolished) continue
      _d.copy(b.pos).sub(a.pos)
      const dist = _d.length()
      const minD = 1.05
      if (dist >= minD || dist < 1e-4) continue
      _n.copy(_d).divideScalar(dist)
      const overlap = minD - dist
      a.pos.addScaledVector(_n, -overlap / 2)
      b.pos.addScaledVector(_n, overlap / 2)

      _rel.copy(b.vel).sub(a.vel)
      const vn = _rel.dot(_n)
      if (vn >= 0) continue

      if (a.team !== b.team) {
        carAxes(a.quat, _f, _u, _l)
        if (a.supersonic && _f.dot(_n) > 0.5 && a.vel.dot(_n) > 10) {
          demolish(w, b, a)
          continue
        }
        carAxes(b.quat, _f, _u, _l)
        if (b.supersonic && -_f.dot(_n) > 0.5 && -b.vel.dot(_n) > 10) {
          demolish(w, a, b)
          continue
        }
      }

      const j = (-1.3 * vn) / 2
      a.vel.addScaledVector(_n, -j)
      b.vel.addScaledVector(_n, j)
      if (j > 6) {
        const victim = a.vel.length() < b.vel.length() ? a : b
        victim.vel.y += 2
        victim.grounded = false
      }
      if (j > 2) w.events.push({ type: 'bump', strength: j, pos: a.pos.clone().add(b.pos).multiplyScalar(0.5) })
    }
  }
}

function updatePads(w: World, dt: number) {
  for (const pad of w.pads) {
    if (!pad.active) {
      pad.timer -= dt
      if (pad.timer <= 0) pad.active = true
      continue
    }
    const r = pad.big ? 2.08 : 1.44
    const hMax = pad.big ? 1.68 : 1.65
    for (const car of w.cars) {
      if (car.demolished || car.boost >= 100) continue
      if (car.pos.y > hMax) continue
      const dx = car.pos.x - pad.pos.x
      const dz = car.pos.z - pad.pos.z
      if (dx * dx + dz * dz > r * r) continue
      car.boost = pad.big ? 100 : Math.min(100, car.boost + 12)
      pad.active = false
      pad.timer = pad.big ? 10 : 4
      w.events.push({ type: 'pickup', car: car.id, big: pad.big, pos: pad.pos })
      break
    }
  }
}
