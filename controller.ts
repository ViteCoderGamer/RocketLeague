import { createWorld } from './world'
import { useGameStore, type PlayerRow } from './store'
import type { MatchSettings, World } from './types'

const DEMO_SETTINGS: MatchSettings = { teamSize: 3, difficulty: 'allstar', matchMinutes: 5, playerName: '' }

let world: World = createWorld(DEMO_SETTINGS, true)

export const getWorld = () => world

export function snapshotPlayers(w: World): PlayerRow[] {
  return w.cars.map((c) => ({ id: c.id, name: c.name, team: c.team, isPlayer: c.isPlayer, stats: { ...c.stats } }))
}

function resetUi(w: World) {
  return {
    worldId: w.id,
    paused: false,
    showScoreboard: false,
    winner: null,
    score: [0, 0] as [number, number],
    overtime: false,
    overtimeElapsed: 0,
    timeLeft: w.timeLeft,
    goal: null,
    flash: null,
    feed: [],
    players: snapshotPlayers(w),
    phase: w.phase,
  }
}

export function startMatch(settings: MatchSettings) {
  world = createWorld(settings, false)
  useGameStore.setState({ ...resetUi(world), screen: 'game', settings })
}

export function restartMatch() {
  startMatch(useGameStore.getState().settings)
}

export function returnToMenu() {
  world = createWorld(DEMO_SETTINGS, true)
  useGameStore.setState({ ...resetUi(world), screen: 'menu' })
}

export function restartDemo() {
  world = createWorld(DEMO_SETTINGS, true)
  useGameStore.setState({ worldId: world.id })
}
