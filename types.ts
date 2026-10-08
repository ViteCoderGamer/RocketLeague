import type { Quaternion, Vector3 } from 'three'

export type Team = 0 | 1
export type Difficulty = 'rookie' | 'pro' | 'allstar'
export type Phase = 'countdown' | 'playing' | 'goal' | 'ended'

export interface CarInput {
  throttle: number
  steer: number
  pitch: number
  yaw: number
  roll: number
  jump: boolean
  boost: boolean
  handbrake: boolean
}

export interface CarStats {
  score: number
  goals: number
  assists: number
  saves: number
  shots: number
  demos: number
}

export interface BotMemory {
  flipPlanned: boolean
  stuckTimer: number
  reverseTimer: number
}

export interface Car {
  id: number
  name: string
  team: Team
  isPlayer: boolean
  pos: Vector3
  vel: Vector3
  quat: Quaternion
  angVel: Vector3
  grounded: boolean
  surface: number
  boost: number
  boosting: boolean
  supersonic: boolean
  jumped: boolean
  doubleJumped: boolean
  jumpHolding: boolean
  jumpTimer: number
  airTime: number
  dodgeTimer: number
  dodgeAxis: Vector3
  prevJump: boolean
  demolished: boolean
  respawnTimer: number
  lastBallHit: number
  wheelSpin: number
  input: CarInput
  stats: CarStats
  bot: BotMemory
}

export interface Ball {
  pos: Vector3
  vel: Vector3
  quat: Quaternion
  angVel: Vector3
  hidden: boolean
  touches: number[]
}

export interface BoostPad {
  id: number
  pos: Vector3
  big: boolean
  active: boolean
  timer: number
}

export type GameEvent =
  | { type: 'goal'; team: Team; scorer?: number; assist?: number; pos: Vector3; speed: number }
  | { type: 'demo'; attacker: number; victim: number; pos: Vector3 }
  | { type: 'hit'; car: number; strength: number; pos: Vector3 }
  | { type: 'bump'; strength: number; pos: Vector3 }
  | { type: 'bounce'; strength: number }
  | { type: 'pickup'; car: number; big: boolean; pos: Vector3 }
  | { type: 'shot'; car: number }
  | { type: 'save'; car: number }
  | { type: 'jump'; car: number }
  | { type: 'kickoff' }
  | { type: 'go' }
  | { type: 'overtime' }
  | { type: 'end'; winner: Team }

export interface MatchSettings {
  teamSize: 1 | 2 | 3
  difficulty: Difficulty
  matchMinutes: number
  playerName: string
}

export interface World {
  id: number
  settings: MatchSettings
  demo: boolean
  cars: Car[]
  ball: Ball
  pads: BoostPad[]
  phase: Phase
  phaseTimer: number
  timeLeft: number
  overtime: boolean
  overtimeElapsed: number
  score: [number, number]
  winner: Team | null
  endAfterGoal: boolean
  time: number
  events: GameEvent[]
  lastShot: { car: number; time: number }
}
