'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Color, Vector3 } from 'three'
import { botThink } from '@/lib/game/ai'
import {
  initAudio, playBeep, playBounce, playBump, playDemo, playGoal, playHit, playJump, playPickup, updateEngine,
} from '@/lib/game/audio'
import { carAxes } from '@/lib/game/car-physics'
import { PHYSICS_STEP, TEAM_COLORS, TEAM_NAMES } from '@/lib/game/constants'
import { getWorld, restartDemo, snapshotPlayers } from '@/lib/game/controller'
import { attachInput, readPlayerInput } from '@/lib/game/input'
import { pushFeed, showFlash, useGameStore } from '@/lib/game/store'
import { stepWorld } from '@/lib/game/world'
import type { World } from '@/lib/game/types'
import { burst, emitParticle } from './particles'

const TEAM = TEAM_COLORS.map((c) => new Color(c))
const FLAME = [new Color('#7fd0ff'), new Color('#ffb347')]
const WHITE = new Color('#ffffff')
const GOLD = new Color('#ffd166')
const FIRE = new Color('#ff6a2b')
const _f = new Vector3()
const _u = new Vector3()
const _l = new Vector3()

function emitCarEffects(w: World) {
  for (const car of w.cars) {
    if (car.demolished) continue
    carAxes(car.quat, _f, _u, _l)
    const rx = car.pos.x - _f.x * 0.62 + _u.x * 0.04
    const ry = car.pos.y - _f.y * 0.62 + _u.y * 0.04
    const rz = car.pos.z - _f.z * 0.62 + _u.z * 0.04
    if (car.boosting) {
      for (let i = 0; i < 3; i++) {
        emitParticle(
          rx + (Math.random() - 0.5) * 0.12, ry + (Math.random() - 0.5) * 0.08, rz + (Math.random() - 0.5) * 0.12,
          -_f.x * 7 + car.vel.x * 0.6, -_f.y * 7 + car.vel.y * 0.6, -_f.z * 7 + car.vel.z * 0.6,
          FLAME[car.team], 0.09 + Math.random() * 0.06, 0.22,
        )
      }
    }
    if (car.supersonic) {
      emitParticle(rx, ry, rz, car.vel.x * 0.2, car.vel.y * 0.2, car.vel.z * 0.2, WHITE, 0.05, 0.45)
    }
  }
}

function handleEvents(w: World, inGame: boolean) {
  const nameOf = (id: number | undefined) => (id === undefined ? null : w.cars[id]?.name ?? null)
  const player = w.cars.find((c) => c.isPlayer)
  let statsDirty = false

  for (const ev of w.events) {
    switch (ev.type) {
      case 'goal': {
        burst(ev.pos, 260, TEAM[ev.team], 22, 0.35, 1.4, 4)
        burst(ev.pos, 120, WHITE, 14, 0.2, 1.1, 2)
        if (inGame) playGoal()
        useGameStore.setState({
          goal: { team: ev.team, scorer: nameOf(ev.scorer), assist: nameOf(ev.assist), speedKph: Math.round(ev.speed * 3.6) },
          score: [w.score[0], w.score[1]],
        })
        statsDirty = true
        break
      }
      case 'demo': {
        burst(ev.pos, 90, FIRE, 9, 0.3, 0.9, 3)
        burst(ev.pos, 40, WHITE, 6, 0.2, 0.6)
        if (inGame) {
          playDemo()
          const a = w.cars[ev.attacker]
          pushFeed(`${a.name} demolished ${w.cars[ev.victim].name}`, a.team)
          if (a.isPlayer) showFlash('DEMOLITION!')
        }
        statsDirty = true
        break
      }
      case 'hit':
        if (ev.strength > 8) burst(ev.pos, Math.min(30, Math.round(ev.strength)), WHITE, ev.strength * 0.25, 0.08, 0.35)
        if (inGame) playHit(ev.strength)
        statsDirty = true
        break
      case 'bump':
        if (inGame) playBump()
        break
      case 'bounce':
        if (inGame) playBounce(ev.strength)
        break
      case 'pickup':
        if (ev.big) burst(new Vector3(ev.pos.x, 1, ev.pos.z), 24, GOLD, 4, 0.12, 0.5)
        if (inGame && player && ev.car === player.id) playPickup(ev.big)
        break
      case 'shot':
        if (inGame && player && ev.car === player.id) showFlash('SHOT ON GOAL')
        statsDirty = true
        break
      case 'save': {
        const c = w.cars[ev.car]
        if (inGame) {
          pushFeed(`${c.name} made a save`, c.team)
          if (c.isPlayer) showFlash('SAVE!')
        }
        statsDirty = true
        break
      }
      case 'jump':
        if (inGame && player && ev.car === player.id) playJump()
        break
      case 'kickoff':
        useGameStore.setState({ goal: null })
        break
      case 'go':
        if (inGame) {
          showFlash('GO!')
          playBeep(true)
        }
        break
      case 'overtime':
        if (inGame) showFlash('OVERTIME')
        break
      case 'end':
        useGameStore.setState({ winner: ev.winner, paused: false })
        if (inGame) pushFeed(`${TEAM_NAMES[ev.winner]} team wins!`, ev.winner)
        statsDirty = true
        break
    }
  }
  w.events.length = 0
  if (statsDirty) useGameStore.setState({ players: snapshotPlayers(w) })
}

export function GameLoop() {
  const acc = useRef(0)
  const syncTimer = useRef(0)
  const lastCount = useRef(0)
  const pollMeta = useRef<() => void>(() => {})

  useEffect(() => {
    const { pollMeta: poll, detach } = attachInput({
      onBallCam: () => useGameStore.setState((s) => ({ ballCam: !s.ballCam })),
      onPause: () => {
        const s = useGameStore.getState()
        if (s.screen !== 'game' || s.winner !== null) return
        initAudio()
        useGameStore.setState({ paused: !s.paused })
      },
      onScoreboard: (show) => useGameStore.setState({ showScoreboard: show }),
    })
    pollMeta.current = poll
    useGameStore.setState({ worldId: getWorld().id })
    return detach
  }, [])

  useFrame((_, delta) => {
    const w = getWorld()
    const store = useGameStore.getState()
    const inGame = store.screen === 'game'
    const dt = Math.min(delta, 0.1)
    const player = w.cars.find((c) => c.isPlayer)
    pollMeta.current()

    if (!store.paused) {
      if (player && inGame) readPlayerInput(player.input)
      acc.current += dt
      let steps = 0
      while (acc.current >= PHYSICS_STEP && steps < 14) {
        for (const car of w.cars) if (!car.isPlayer) botThink(car, w, car.input)
        stepWorld(w, PHYSICS_STEP)
        acc.current -= PHYSICS_STEP
        steps++
      }
      if (steps >= 14) acc.current = 0
      emitCarEffects(w)
    }

    handleEvents(w, inGame)

    if (w.demo && w.phase === 'ended') restartDemo()

    const count = w.phase === 'countdown' ? Math.ceil(w.phaseTimer) : 0
    if (count !== lastCount.current) {
      if (count > 0 && inGame) playBeep(false)
      lastCount.current = count
    }

    updateEngine(player ? player.vel.length() : 0, !!player?.boosting, inGame && !store.paused && !!player && !player.demolished)

    syncTimer.current += dt
    if (syncTimer.current > 0.08) {
      syncTimer.current = 0
      useGameStore.setState({
        phase: w.phase,
        countdown: count,
        timeLeft: w.timeLeft,
        overtime: w.overtime,
        overtimeElapsed: w.overtimeElapsed,
        score: [w.score[0], w.score[1]],
        boost: player ? Math.round(player.boost) : 0,
        speedKph: player ? Math.round(player.vel.length() * 3.6) : 0,
        supersonic: !!player?.supersonic,
        demolished: !!player?.demolished,
      })
    }
  })

  return null
}
