import { create } from 'zustand'
import type { CarStats, MatchSettings, Phase, Team } from './types'

export interface PlayerRow {
  id: number
  name: string
  team: Team
  isPlayer: boolean
  stats: CarStats
}

export interface FeedItem {
  id: number
  text: string
  team: Team | null
}

export interface GoalBanner {
  team: Team
  scorer: string | null
  assist: string | null
  speedKph: number
}

interface GameStore {
  screen: 'menu' | 'game'
  worldId: number
  settings: MatchSettings
  phase: Phase
  countdown: number
  score: [number, number]
  timeLeft: number
  overtime: boolean
  overtimeElapsed: number
  boost: number
  speedKph: number
  supersonic: boolean
  demolished: boolean
  ballCam: boolean
  paused: boolean
  showScoreboard: boolean
  muted: boolean
  goal: GoalBanner | null
  flash: { text: string; id: number } | null
  feed: FeedItem[]
  players: PlayerRow[]
  winner: Team | null
}

export const DEFAULT_SETTINGS: MatchSettings = {
  teamSize: 1,
  difficulty: 'pro',
  matchMinutes: 5,
  playerName: 'Player',
}

export const useGameStore = create<GameStore>(() => ({
  screen: 'menu',
  worldId: 0,
  settings: DEFAULT_SETTINGS,
  phase: 'countdown',
  countdown: 3,
  score: [0, 0],
  timeLeft: 300,
  overtime: false,
  overtimeElapsed: 0,
  boost: 33,
  speedKph: 0,
  supersonic: false,
  demolished: false,
  ballCam: true,
  paused: false,
  showScoreboard: false,
  muted: false,
  goal: null,
  flash: null,
  feed: [],
  players: [],
  winner: null,
}))

let flashId = 0
export function showFlash(text: string) {
  useGameStore.setState({ flash: { text, id: ++flashId } })
}

let feedId = 0
export function pushFeed(text: string, team: Team | null) {
  const id = ++feedId
  useGameStore.setState((s) => ({ feed: [...s.feed.slice(-4), { id, text, team }] }))
  setTimeout(() => {
    useGameStore.setState((s) => ({ feed: s.feed.filter((f) => f.id !== id) }))
  }, 4500)
}
