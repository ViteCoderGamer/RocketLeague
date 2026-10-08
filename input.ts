import { clamp } from './math'
import type { CarInput } from './types'

const keys = new Set<string>()
let mouseLeft = false
let mouseRight = false
const prevPad: boolean[] = []

interface InputHandlers {
  onBallCam: () => void
  onPause: () => void
  onScoreboard: (show: boolean) => void
}

const BLOCKED = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'AltLeft', 'AltRight'])

export function attachInput(handlers: InputHandlers) {
  const isTyping = (e: Event) => {
    const t = e.target as HTMLElement | null
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
  }
  const down = (e: KeyboardEvent) => {
    if (isTyping(e)) return
    if (BLOCKED.has(e.code)) e.preventDefault()
    keys.add(e.code)
    if (e.repeat) return
    if (e.code === 'KeyC') handlers.onBallCam()
    if (e.code === 'Escape' || e.code === 'KeyP') handlers.onPause()
    if (e.code === 'Tab') handlers.onScoreboard(true)
  }
  const up = (e: KeyboardEvent) => {
    keys.delete(e.code)
    if (e.code === 'Tab') handlers.onScoreboard(false)
  }
  const mdown = (e: MouseEvent) => {
    if ((e.target as HTMLElement | null)?.tagName !== 'CANVAS') return
    if (e.button === 0) mouseLeft = true
    if (e.button === 2) mouseRight = true
  }
  const mup = (e: MouseEvent) => {
    if (e.button === 0) mouseLeft = false
    if (e.button === 2) mouseRight = false
  }
  const ctx = (e: MouseEvent) => {
    if ((e.target as HTMLElement | null)?.tagName === 'CANVAS') e.preventDefault()
  }
  const blur = () => {
    keys.clear()
    mouseLeft = false
    mouseRight = false
  }
  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('mousedown', mdown)
  window.addEventListener('mouseup', mup)
  window.addEventListener('contextmenu', ctx)
  window.addEventListener('blur', blur)

  const pollMeta = () => {
    const pad = getPad()
    if (!pad) return
    const edge = (i: number) => {
      const pressed = !!pad.buttons[i]?.pressed
      const was = prevPad[i] ?? false
      prevPad[i] = pressed
      return pressed && !was
    }
    if (edge(3)) handlers.onBallCam()
    if (edge(9)) handlers.onPause()
    const back = !!pad.buttons[8]?.pressed
    if (back !== (prevPad[8] ?? false)) handlers.onScoreboard(back)
    prevPad[8] = back
  }

  return {
    pollMeta,
    detach: () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('mousedown', mdown)
      window.removeEventListener('mouseup', mup)
      window.removeEventListener('contextmenu', ctx)
      window.removeEventListener('blur', blur)
    },
  }
}

function getPad(): Gamepad | null {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return null
  for (const p of navigator.getGamepads()) if (p && p.connected) return p
  return null
}

const dz = (v: number) => (Math.abs(v) < 0.15 ? 0 : v)

export function readPlayerInput(out: CarInput) {
  const k = (c: string) => keys.has(c)
  let throttle = (k('KeyW') || k('ArrowUp') ? 1 : 0) - (k('KeyS') || k('ArrowDown') ? 1 : 0)
  let steer = (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0)
  let pitch = throttle
  let roll = (k('KeyE') ? 1 : 0) - (k('KeyQ') ? 1 : 0)
  let jump = k('Space') || mouseRight
  let boost = k('ShiftLeft') || k('ShiftRight') || mouseLeft
  let handbrake = k('KeyX') || k('AltLeft') || k('AltRight')

  const pad = getPad()
  if (pad) {
    const b = (i: number) => pad.buttons[i]?.value ?? 0
    const sx = dz(pad.axes[0] ?? 0)
    const sy = dz(pad.axes[1] ?? 0)
    throttle += b(7) - b(6)
    steer += sx
    pitch += -sy
    roll += b(5) - b(4)
    jump = jump || b(0) > 0.5
    boost = boost || b(1) > 0.5
    handbrake = handbrake || b(2) > 0.5
  }

  out.throttle = clamp(throttle, -1, 1)
  out.steer = clamp(steer, -1, 1)
  out.pitch = clamp(pitch, -1, 1)
  out.yaw = out.steer
  out.roll = clamp(roll, -1, 1)
  out.jump = jump
  out.boost = boost
  out.handbrake = handbrake
}
