const CONTROLS: [string, string, string][] = [
  ['Drive / Reverse', 'W / S', 'RT / LT'],
  ['Steer / Air yaw', 'A / D', 'Left stick'],
  ['Air pitch', 'W / S', 'Left stick'],
  ['Jump · Double jump · Dodge', 'Space / Right mouse', 'A'],
  ['Boost', 'Shift / Left mouse', 'B'],
  ['Powerslide / Air roll', 'X / Alt', 'X'],
  ['Air roll left / right', 'Q / E', 'LB / RB'],
  ['Ball cam', 'C', 'Y'],
  ['Scoreboard', 'Tab', 'Back'],
  ['Pause', 'Esc / P', 'Start'],
]

export function ControlsList() {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left font-display text-xs uppercase tracking-widest text-muted-foreground">
          <th className="pb-2 font-medium">Action</th>
          <th className="pb-2 font-medium">Keyboard</th>
          <th className="pb-2 font-medium">Gamepad</th>
        </tr>
      </thead>
      <tbody>
        {CONTROLS.map(([action, kb, pad]) => (
          <tr key={action} className="border-t border-border">
            <td className="py-1.5 pr-3 text-foreground">{action}</td>
            <td className="py-1.5 pr-3 font-display text-foreground">{kb}</td>
            <td className="py-1.5 font-display text-muted-foreground">{pad}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
