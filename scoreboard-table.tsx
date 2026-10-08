'use client'

import { TEAM_NAMES } from '@/lib/game/constants'
import { useGameStore } from '@/lib/game/store'
import { cn } from '@/lib/utils'

const COLS = ['Score', 'Goals', 'Assists', 'Saves', 'Shots', 'Demos'] as const

export function ScoreboardTable() {
  const players = useGameStore((s) => s.players)
  const score = useGameStore((s) => s.score)

  return (
    <div className="flex w-full flex-col gap-4">
      {([0, 1] as const).map((team) => {
        const rows = players.filter((p) => p.team === team).sort((a, b) => b.stats.score - a.stats.score)
        return (
          <table key={team} className="w-full overflow-hidden rounded-md text-sm">
            <caption className="sr-only">{TEAM_NAMES[team]} team</caption>
            <thead>
              <tr className={cn('font-display text-xs uppercase tracking-widest text-foreground', team === 0 ? 'bg-team-blue' : 'bg-team-orange')}>
                <th className="px-3 py-2 text-left">
                  {TEAM_NAMES[team]} <span className="ml-2 text-base">{score[team]}</span>
                </th>
                {COLS.map((c) => (
                  <th key={c} className="px-2 py-2 text-right font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-background/80">
              {rows.map((p) => (
                <tr key={p.id} className={cn('border-t border-border', p.isPlayer && 'bg-secondary')}>
                  <td className="px-3 py-2 font-display font-semibold text-foreground">
                    {p.name}
                    {p.isPlayer && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-foreground">{p.stats.score}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-foreground">{p.stats.goals}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-foreground">{p.stats.assists}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-foreground">{p.stats.saves}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-foreground">{p.stats.shots}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-foreground">{p.stats.demos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      })}
    </div>
  )
}
