// All values are Rocket League's real physics constants scaled by 1/100 (1 unit = 100uu).
export const PHYSICS_STEP = 1 / 120
export const GRAVITY = 6.5

export const ARENA = {
  halfWidth: 40.96,
  halfLength: 51.2,
  height: 20.44,
  corner: 80.64,
  goalHalfWidth: 8.93,
  goalHeight: 6.43,
  goalDepth: 8.8,
} as const

export const BALL = {
  radius: 0.9275,
  mass: 30,
  maxSpeed: 60,
  restitution: 0.6,
  carRestitution: 0.4,
  drag: 0.03,
} as const

export const CAR = {
  half: { x: 0.421, y: 0.181, z: 0.59 },
  mass: 180,
  maxSpeed: 23,
  supersonicSpeed: 22,
  boostAccel: 9.9167,
  boostConsumption: 33.3,
  brakeAccel: 35,
  coastDecel: 5.25,
  jumpImpulse: 2.92,
  jumpHoldAccel: 14.58,
  jumpHoldTime: 0.2,
  doubleJumpWindow: 1.25,
  dodgeImpulse: 5,
  dodgeDuration: 0.65,
  respawnTime: 3,
  kickoffBoost: 33,
} as const

export const THROTTLE_CURVE = [
  [0, 16],
  [14, 1.6],
  [14.1, 0],
] as const

export const CURVATURE_CURVE = [
  [0, 0.69],
  [5, 0.398],
  [10, 0.235],
  [15, 0.1375],
  [17.5, 0.11],
  [23, 0.088],
] as const

export const PSYONIX_CURVE = [
  [0, 0.65],
  [23, 0.55],
  [46, 0.3],
] as const

export const BIG_PADS: [number, number][] = [
  [-35.84, 0],
  [35.84, 0],
  [-30.72, -40.96],
  [30.72, -40.96],
  [-30.72, 40.96],
  [30.72, 40.96],
]

export const SMALL_PADS: [number, number][] = [
  [0, -42.4], [-17.92, -41.84], [17.92, -41.84], [-9.4, -33.08], [9.4, -33.08],
  [0, -28.16], [-35.84, -24.84], [35.84, -24.84], [-17.88, -23], [17.88, -23],
  [-20.48, -10.36], [0, -10.24], [20.48, -10.36], [-10.24, 0], [10.24, 0],
  [-20.48, 10.36], [0, 10.24], [20.48, 10.36], [-17.88, 23], [17.88, 23],
  [-35.84, 24.84], [35.84, 24.84], [0, 28.16], [-9.4, 33.1], [9.4, 33.08],
  [-17.92, 41.84], [17.92, 41.84], [0, 42.4],
]

// Blue-side spots; orange mirrors through the center.
export const KICKOFF_SLOTS: [number, number][] = [
  [-20.48, -25.6],
  [20.48, -25.6],
  [-2.56, -38.4],
  [2.56, -38.4],
  [0, -46.08],
]

export const RESPAWN_SLOTS: [number, number][] = [
  [-23.04, -46.08],
  [23.04, -46.08],
  [-26.88, -46.08],
  [26.88, -46.08],
]

export const TEAM_COLORS = ['#2f7bff', '#ff8a1f'] as const
export const TEAM_NAMES = ['Blue', 'Orange'] as const

export const BOT_NAMES = [
  'Bandit', 'Maverick', 'Sundown', 'Viper', 'Junker', 'Cougar', 'Hound',
  'Rainmaker', 'Fury', 'Casper', 'Shepard', 'Tusk', 'Imp', 'Fever',
  'Stinger', 'Marley', 'Outlaw', 'Sabre', 'Raja', 'Gerwin',
]
