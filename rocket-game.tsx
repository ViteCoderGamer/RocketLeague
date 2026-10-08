'use client'

import { useGameStore } from '@/lib/game/store'
import { GameCanvas } from './game-canvas'
import { Hud } from './hud/hud'
import { MainMenu } from './hud/main-menu'
import { NameTagLayer } from './name-tags'

export function RocketGame() {
  const screen = useGameStore((s) => s.screen)
  return (
    <main className="relative h-dvh w-full select-none overflow-hidden bg-background">
      <h1 className="sr-only">Rocket Arena — 3D car soccer</h1>
      <GameCanvas />
      <NameTagLayer />
      {screen === 'menu' ? <MainMenu /> : <Hud />}
    </main>
  )
}
