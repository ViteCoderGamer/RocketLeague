'use client'

import { initAudio } from '@/lib/game/audio'
import { startMatch } from '@/lib/game/controller'
import { useGameStore } from '@/lib/game/store'
import type { Difficulty, MatchSettings } from '@/lib/game/types'
import { cn } from '@/lib/utils'
import { ControlsList } from './controls-list'

function Segmented<T extends string | number>({
  label, value, options, onChange,
}: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-display text-xs uppercase tracking-widest text-muted-foreground">{label}</legend>
      <div className="grid gap-1 rounded-md bg-secondary p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-sm px-3 py-2 font-display text-sm font-semibold uppercase tracking-wide transition-colors',
              value === o.value ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function MainMenu() {
  const settings = useGameStore((s) => s.settings)
  const update = (p: Partial<MatchSettings>) => useGameStore.setState({ settings: { ...settings, ...p } })

  const play = () => {
    initAudio()
    startMatch(settings)
  }

  return (
    <div className="absolute inset-0 flex flex-col gap-6 overflow-y-auto bg-background/40 p-5 md:flex-row md:items-end md:justify-between md:p-10">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-border bg-background/85 p-6 backdrop-blur-md">
        <header className="flex flex-col gap-1">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-primary">Exhibition</p>
          <p className="font-display text-5xl font-bold uppercase italic leading-none tracking-tight text-foreground text-balance">
            Rocket <span className="text-team-blue">Ar</span>
            <span className="text-team-orange">ena</span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            Rocket-powered car soccer. Boost, jump, flip, drive the walls, and put the ball in the net.
          </p>
        </header>

        <Segmented
          label="Mode"
          value={settings.teamSize}
          options={[
            { value: 1, label: '1v1' },
            { value: 2, label: '2v2' },
            { value: 3, label: '3v3' },
          ]}
          onChange={(v) => update({ teamSize: v as 1 | 2 | 3 })}
        />
        <Segmented<Difficulty>
          label="Bot difficulty"
          value={settings.difficulty}
          options={[
            { value: 'rookie', label: 'Rookie' },
            { value: 'pro', label: 'Pro' },
            { value: 'allstar', label: 'All-Star' },
          ]}
          onChange={(v) => update({ difficulty: v })}
        />
        <Segmented
          label="Match length"
          value={settings.matchMinutes}
          options={[
            { value: 2, label: '2 min' },
            { value: 5, label: '5 min' },
            { value: 10, label: '10 min' },
          ]}
          onChange={(v) => update({ matchMinutes: v })}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="player-name" className="font-display text-xs uppercase tracking-widest text-muted-foreground">
            Player name
          </label>
          <input
            id="player-name"
            value={settings.playerName}
            maxLength={16}
            onChange={(e) => update({ playerName: e.target.value })}
            className="rounded-md border border-input bg-secondary px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <button
          type="button"
          onClick={play}
          className="rounded-md bg-primary px-6 py-4 font-display text-2xl font-bold uppercase italic tracking-wider text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Play match
        </button>
        <p className="text-xs leading-relaxed text-muted-foreground md:hidden">
          Rocket Arena needs a keyboard or gamepad.
        </p>
      </section>

      <section className="hidden w-full max-w-md rounded-lg border border-border bg-background/85 p-6 backdrop-blur-md md:block">
        <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wider text-foreground">Controls</h2>
        <ControlsList />
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Jump twice for a double jump, or tilt while pressing jump the second time to dodge. Hit someone at supersonic speed to demolish them.
        </p>
      </section>
    </div>
  )
}
