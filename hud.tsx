'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { setMuted } from '@/lib/game/audio'
import { TEAM_NAMES } from '@/lib/game/constants'
import { restartMatch, returnToMenu } from '@/lib/game/controller'
import { useGameStore } from '@/lib/game/store'
import { cn } from '@/lib/utils'
import { ControlsList } from './controls-list'
import { ScoreboardTable } from './scoreboard-table'

function formatTime(sec: number) {
  const s = Math.ceil(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function TopScore() {
  const score = useGameStore((s) => s.score)
  const timeLeft = useGameStore((s) => s.timeLeft)
  const overtime = useGameStore((s) => s.overtime)
  const ot = useGameStore((s) => s.overtimeElapsed)
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
      <div className="flex items-stretch overflow-hidden rounded-md font-display shadow-lg" role="status" aria-label="Score and time">
        <div className="flex min-w-16 items-center justify-center bg-team-blue px-4 text-3xl font-bold text-foreground tabular-nums">
          {score[0]}
        </div>
        <div className="flex min-w-28 flex-col items-center justify-center bg-background/85 px-5 py-1">
          <span className={cn('text-3xl font-bold tabular-nums', overtime ? 'text-primary' : 'text-foreground')}>
            {overtime ? `+${formatTime(ot)}` : formatTime(timeLeft)}
          </span>
          {overtime && <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">Overtime</span>}
        </div>
        <div className="flex min-w-16 items-center justify-center bg-team-orange px-4 text-3xl font-bold text-foreground tabular-nums">
          {score[1]}
        </div>
      </div>
    </div>
  )
}

function BoostMeter() {
  const boost = useGameStore((s) => s.boost)
  const speed = useGameStore((s) => s.speedKph)
  const supersonic = useGameStore((s) => s.supersonic)
  const r = 54
  const c = 2 * Math.PI * r
  const arc = c * 0.75
  return (
    <div className="pointer-events-none absolute bottom-5 right-5 flex flex-col items-center gap-1 md:bottom-8 md:right-8">
      <div className="relative size-36" role="meter" aria-label="Boost" aria-valuemin={0} aria-valuemax={100} aria-valuenow={boost}>
        <svg viewBox="0 0 128 128" className="size-full rotate-[135deg]" aria-hidden="true">
          <circle cx="64" cy="64" r={r} fill="rgba(7,11,21,0.75)" stroke="rgba(238,242,248,0.12)" strokeWidth="12" strokeDasharray={`${arc} ${c}`} />
          <circle
            cx="64" cy="64" r={r} fill="none" stroke="var(--team-orange)" strokeWidth="12" strokeLinecap="butt"
            strokeDasharray={`${(arc * boost) / 100} ${c}`}
            style={{ transition: 'stroke-dasharray 0.1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl font-bold leading-none text-foreground tabular-nums">{boost}</span>
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Boost</span>
        </div>
      </div>
      <span className={cn('font-display text-sm font-semibold tabular-nums', supersonic ? 'text-primary' : 'text-muted-foreground')}>
        {speed} KM/H{supersonic ? ' · SUPERSONIC' : ''}
      </span>
    </div>
  )
}

function CenterBanners() {
  const phase = useGameStore((s) => s.phase)
  const countdown = useGameStore((s) => s.countdown)
  const goal = useGameStore((s) => s.goal)
  const flash = useGameStore((s) => s.flash)
  const demolished = useGameStore((s) => s.demolished)

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-live="polite">
      {phase === 'countdown' && countdown > 0 && (
        <span key={countdown} className="animate-pop font-display text-9xl font-bold italic text-foreground drop-shadow-lg">
          {countdown}
        </span>
      )}
      {phase === 'goal' && goal && (
        <div className="flex flex-col items-center gap-2">
          <span
            className={cn(
              'animate-goal font-display text-8xl font-bold uppercase italic drop-shadow-lg md:text-9xl',
              goal.team === 0 ? 'text-team-blue' : 'text-team-orange',
            )}
          >
            Goal!
          </span>
          <span className="rounded-sm bg-background/80 px-4 py-1.5 font-display text-lg uppercase tracking-wider text-foreground">
            {goal.scorer ? `${goal.scorer}` : `${TEAM_NAMES[goal.team]} team`}
            {goal.assist ? ` · assist ${goal.assist}` : ''} · {goal.speedKph} km/h
          </span>
        </div>
      )}
      {flash && phase !== 'goal' && (
        <span key={flash.id} className="animate-pop absolute top-[28%] font-display text-5xl font-bold uppercase italic text-foreground drop-shadow-lg">
          {flash.text}
        </span>
      )}
      {demolished && phase === 'playing' && (
        <span className="absolute bottom-[30%] rounded-sm bg-background/80 px-4 py-2 font-display text-xl uppercase tracking-widest text-primary">
          Demolished — respawning
        </span>
      )}
    </div>
  )
}

function Feed() {
  const feed = useGameStore((s) => s.feed)
  return (
    <ul className="pointer-events-none absolute right-4 top-20 flex flex-col items-end gap-1.5" aria-live="polite">
      {feed.map((f) => (
        <li
          key={f.id}
          className={cn(
            'rounded-sm border-l-4 bg-background/80 px-3 py-1 font-display text-sm text-foreground',
            f.team === 0 ? 'border-team-blue' : f.team === 1 ? 'border-team-orange' : 'border-border',
          )}
        >
          {f.text}
        </li>
      ))}
    </ul>
  )
}

function Hints() {
  const ballCam = useGameStore((s) => s.ballCam)
  const muted = useGameStore((s) => s.muted)
  return (
    <div className="absolute bottom-5 left-5 flex items-center gap-2 md:bottom-8 md:left-8">
      <span className={cn('rounded-sm px-2 py-1 font-display text-xs font-semibold uppercase tracking-widest', ballCam ? 'bg-accent text-accent-foreground' : 'bg-background/80 text-muted-foreground')}>
        Ball cam {ballCam ? 'on' : 'off'} · C
      </span>
      <span className="hidden rounded-sm bg-background/80 px-2 py-1 font-display text-xs uppercase tracking-widest text-muted-foreground md:inline">
        Tab scores · Esc pause
      </span>
      <button
        type="button"
        onClick={() => {
          setMuted(!muted)
          useGameStore.setState({ muted: !muted })
        }}
        className="rounded-sm bg-background/80 p-1.5 text-muted-foreground hover:text-foreground"
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
    </div>
  )
}

function Overlay({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={label}>
      <div className="flex w-full max-w-2xl flex-col gap-5 rounded-lg border border-border bg-card p-6">{children}</div>
    </div>
  )
}

function MenuButton({ onClick, children, primary }: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-5 py-3 font-display text-lg font-bold uppercase italic tracking-wider transition-transform hover:scale-[1.02]',
        primary ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
      )}
    >
      {children}
    </button>
  )
}

function PauseMenu() {
  return (
    <Overlay label="Paused">
      <h2 className="font-display text-4xl font-bold uppercase italic text-foreground">Paused</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <MenuButton primary onClick={() => useGameStore.setState({ paused: false })}>Resume</MenuButton>
        <MenuButton onClick={restartMatch}>Restart</MenuButton>
        <MenuButton onClick={returnToMenu}>Main menu</MenuButton>
      </div>
      <ControlsList />
    </Overlay>
  )
}

function EndScreen() {
  const winner = useGameStore((s) => s.winner)
  const score = useGameStore((s) => s.score)
  const players = useGameStore((s) => s.players)
  if (winner === null) return null
  const mvp = players.filter((p) => p.team === winner).sort((a, b) => b.stats.score - a.stats.score)[0]
  const playerWon = players.some((p) => p.isPlayer && p.team === winner)
  return (
    <Overlay label="Match over">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">{playerWon ? 'Victory' : 'Defeat'}</span>
        <h2 className={cn('font-display text-5xl font-bold uppercase italic', winner === 0 ? 'text-team-blue' : 'text-team-orange')}>
          {TEAM_NAMES[winner]} wins
        </h2>
        <p className="font-display text-3xl font-bold tabular-nums text-foreground">
          <span className="text-team-blue">{score[0]}</span> — <span className="text-team-orange">{score[1]}</span>
        </p>
        {mvp && <p className="text-sm text-muted-foreground">MVP: <span className="font-semibold text-foreground">{mvp.name}</span></p>}
      </div>
      <ScoreboardTable />
      <div className="flex flex-col gap-2 sm:flex-row">
        <MenuButton primary onClick={restartMatch}>Play again</MenuButton>
        <MenuButton onClick={returnToMenu}>Main menu</MenuButton>
      </div>
    </Overlay>
  )
}

export function Hud() {
  const paused = useGameStore((s) => s.paused)
  const showScoreboard = useGameStore((s) => s.showScoreboard)
  const winner = useGameStore((s) => s.winner)

  return (
    <>
      <TopScore />
      <BoostMeter />
      <CenterBanners />
      <Feed />
      <Hints />
      {showScoreboard && !paused && winner === null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <ScoreboardTable />
          </div>
        </div>
      )}
      {paused && winner === null && <PauseMenu />}
      <EndScreen />
    </>
  )
}
