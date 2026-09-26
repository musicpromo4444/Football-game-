"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw, Battery, Hand, Star } from "lucide-react"
import { squad, type PlayerRole } from "@/components/game/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Point = { x: number; y: number }
type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "4-1-4-1"
type TeamInstruction = "Gegenpress" | "Possession" | "Counter Attack" | "Low Block" | "Direct Play"
type TacticalPresetId = "possession" | "tiki-taka" | "gegenpress" | "counter-attack" | "direct-play" | "wing-play" | "long-ball" | "high-press" | "low-block" | "balanced"
const tacticalPresets: Record<TacticalPresetId, { formation: Formation; instruction: TeamInstruction; width: number; tempo: number; line: number; direct: number }> = {
  possession: { formation: "4-3-3", instruction: "Possession", width: 0.9, tempo: 0.72, line: 2, direct: 0.2 },
  "tiki-taka": { formation: "4-3-3", instruction: "Possession", width: 0.82, tempo: 0.9, line: 1, direct: 0.1 },
  gegenpress: { formation: "4-3-3", instruction: "Gegenpress", width: 1.12, tempo: 1.35, line: -7, direct: 0.45 },
  "counter-attack": { formation: "4-2-3-1", instruction: "Counter Attack", width: 1.08, tempo: 1.2, line: -3, direct: 0.8 },
  "direct-play": { formation: "4-1-4-1", instruction: "Direct Play", width: 1.02, tempo: 1.08, line: -1, direct: 0.9 },
  "wing-play": { formation: "4-4-2", instruction: "Direct Play", width: 1.28, tempo: 1.0, line: -2, direct: 0.65 },
  "long-ball": { formation: "4-2-3-1", instruction: "Direct Play", width: 1.0, tempo: 1.18, line: -1, direct: 1.0 },
  "high-press": { formation: "4-3-3", instruction: "Gegenpress", width: 1.05, tempo: 1.3, line: -10, direct: 0.5 },
  "low-block": { formation: "3-5-2", instruction: "Low Block", width: 0.82, tempo: 0.62, line: 10, direct: 0.75 },
  balanced: { formation: "4-2-3-1", instruction: "Possession", width: 1.0, tempo: 0.95, line: 0, direct: 0.5 },
}

const formationSlots: Record<Formation, Point[]> = {
  "4-3-3": [{ x: 28, y: 30 }, { x: 72, y: 30 }, { x: 35, y: 55 }, { x: 65, y: 55 }, { x: 50, y: 76 }],
  "4-4-2": [{ x: 25, y: 32 }, { x: 75, y: 32 }, { x: 28, y: 55 }, { x: 72, y: 55 }, { x: 50, y: 76 }],
  "3-5-2": [{ x: 30, y: 36 }, { x: 70, y: 36 }, { x: 50, y: 48 }, { x: 27, y: 61 }, { x: 73, y: 61 }],
  "4-2-3-1": [{ x: 25, y: 34 }, { x: 75, y: 34 }, { x: 38, y: 58 }, { x: 62, y: 58 }, { x: 50, y: 76 }],
  "4-1-4-1": [{ x: 25, y: 34 }, { x: 75, y: 34 }, { x: 30, y: 54 }, { x: 70, y: 54 }, { x: 50, y: 76 }],
}

const instructionEffects: Record<TeamInstruction, { tempo: number; width: number; line: number }> = {
  Gegenpress: { tempo: 1.35, width: 1.12, line: -7 },
  Possession: { tempo: 0.72, width: 0.92, line: 2 },
  "Counter Attack": { tempo: 1.2, width: 1.08, line: -3 },
  "Low Block": { tempo: 0.62, width: 0.86, line: 10 },
  "Direct Play": { tempo: 1.08, width: 1.02, line: -1 },
}

function loadTactics(): { formation: Formation; instruction: TeamInstruction; preset: TacticalPresetId } {
  if (typeof window === "undefined") return { formation: "4-3-3", instruction: "Possession", preset: "possession" }
  const preset = (localStorage.getItem("pitchside-tactical-preset") as TacticalPresetId) || "possession"
  const config = tacticalPresets[preset] || tacticalPresets.possession
  const formation = (localStorage.getItem("pitchside-formation") as Formation) || config.formation
  const instruction = (localStorage.getItem("pitchside-instruction") as TeamInstruction) || config.instruction
  return { formation, instruction, preset }
}

const teammates: Point[] = [
  { x: 30, y: 30 },
  { x: 70, y: 28 },
  { x: 22, y: 62 },
  { x: 78, y: 64 },
  { x: 50, y: 80 },
]
const opponents: Point[] = [
  { x: 40, y: 18 },
  { x: 62, y: 45 },
  { x: 35, y: 48 },
  { x: 50, y: 12 },
]

const playerArchetypes = squad.slice(1, 6).map((p, i) => ({
  name: p.name, role: p.style as PlayerRole, specialStyle: p.specialStyle, specialName: p.specialName,
  x: [30, 70, 22, 78, 50][i], y: [30, 28, 62, 64, 80][i],
}))

const teamStamina = [
  { name: "Silvana", value: 55 },
  { name: "Cruz", value: 38 },
  { name: "Adeyemi", value: 69 },
]

function format(t: number) {
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function MatchCanvas() {
  const [time, setTime] = useState(120)
  const [running, setRunning] = useState(false)
  const [ball, setBall] = useState<Point>({ x: 50, y: 55 })
  const [drag, setDrag] = useState<{ start: Point; current: Point } | null>(null)
  const [score, setScore] = useState({ home: 2, away: 1 })
  const [passes, setPasses] = useState(0)
  const [actions, setActions] = useState(0)
  const [message, setMessage] = useState("Swipe from the ball to pass")
  const [tactics] = useState(loadTactics)
  const [positions, setPositions] = useState(() => formationSlots[loadTactics().formation].map((p) => ({ ...p })))
  const [opponentPositions, setOpponentPositions] = useState(() => opponents.map((p) => ({ ...p })))
  const [ballOwner, setBallOwner] = useState<number | null>(null)
  const [turnover, setTurnover] = useState(false)
  const pitchRef = useRef<HTMLDivElement>(null)
  const lastBallRef = useRef(ball)

  useEffect(() => {
    if (!running || time <= 0) return
    const id = setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [running, time])

  useEffect(() => {
    if (time === 0) setRunning(false)
  }, [time])

  useEffect(() => {
    if (!running) return
    const base = formationSlots[tactics.formation]
    const preset = tacticalPresets[tactics.preset] || tacticalPresets.possession
    const id = setInterval(() => {
      const t = Date.now() / 1000
      const ballNow = lastBallRef.current
      setPositions((current) => current.map((p, i) => {
        const player = playerArchetypes[i]
        const anchor = base[i] || p
        const dx = ballNow.x - p.x
        const dy = ballNow.y - p.y
        const distanceToBall = Math.hypot(dx, dy)
        const side = i % 2 === 0 ? -1 : 1
        let x = anchor.x
        let y = anchor.y

        // Start from the chosen formation, then add role-specific movement.
        if (tactics.preset === "possession" || tactics.preset === "tiki-taka") {
          x += Math.sin(t * (tactics.preset === "tiki-taka" ? 1.5 : 0.7) + i) * 2
          y += Math.cos(t * 0.7 + i) * 2
          if (distanceToBall < 32 && i !== ballOwner) {
            x += dx * 0.18
            y += dy * 0.12
          }
        }

        if (tactics.preset === "gegenpress" || tactics.preset === "high-press") {
          const chase = i < 3 ? 0.32 : 0.12
          x += dx * chase
          y += dy * chase
          y -= tactics.preset === "high-press" ? 7 : 4
        }

        if (tactics.preset === "counter-attack") {
          y -= player.pos === "FWD" ? 15 : i === 1 ? 8 : 2
          if (i === 0 || i === 1) x += side * 3
        }

        if (tactics.preset === "wing-play") {
          if (player.role === "Winger" || player.role === "Wingback") {
            x = 50 + side * 34
            y -= 5
          } else {
            x = 50 + (x - 50) * 0.78
          }
        }

        if (tactics.preset === "low-block") {
          y += 11
          x = 50 + (x - 50) * 0.72
          if (distanceToBall < 35) {
            x += dx * 0.08
            y += dy * 0.06
          }
        }

        if (tactics.preset === "long-ball") {
          if (player.pos === "FWD") {
            y -= 18
            x += side * 4
          } else if (i === 1 || i === 4) {
            y -= 6
          }
        }

        if (tactics.preset === "direct-play") {
          y -= player.pos === "FWD" ? 13 : 4
        }

        // Role behavior remains visible regardless of team preset.
        if (player.role === "Winger") x += side * 8
        if (player.role === "Inside Forward") x += side * -5
        if (player.role === "Mezzala") x += side * 5
        if (player.role === "Playmaker" || player.role === "Deep-Lying Playmaker") {
          y += 4
          if (distanceToBall < 30) x += dx * 0.1
        }
        if (player.role === "Ball Winner" || player.role === "Pressing Forward") {
          x += dx * 0.2
          y += dy * 0.2
        }
        if (player.role === "Wingback") x += side * 7
        if (player.role === "Holding Midfielder" || player.role === "Ball-Playing Defender" || player.role === "Stopper") {
          y += preset.line * 0.45
        }

        return {
          x: Math.max(7, Math.min(93, x)),
          y: Math.max(7, Math.min(92, y)),
        }
      }))

      // Opponents react to the ball: compact when defending, press when it enters their zone.
      setOpponentPositions((current) => current.map((p, i) => {
        const dx = ballNow.x - p.x
        const dy = ballNow.y - p.y
        const d = Math.hypot(dx, dy)
        const press = d < 32 ? 0.12 : 0.035
        const compactX = 50 + (p.x - 50) * 0.985
        const compactY = p.y + (ballNow.y - p.y) * press
        return {
          x: Math.max(8, Math.min(92, compactX + dx * press)),
          y: Math.max(6, Math.min(88, compactY + dy * 0.04)),
        }
      }))
    }, 180)
    return () => clearInterval(id)
  }, [running, tactics, ballOwner])

  const toPct = useCallback((clientX: number, clientY: number): Point => {
    const rect = pitchRef.current?.getBoundingClientRect()
    if (!rect) return { x: 50, y: 50 }
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    }
  }, [])

  const classifySwipe = (start: Point, end: Point) => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const dist = Math.hypot(dx, dy)
    if (dist < 6) return "tap"
    if (dy < -14 && Math.abs(dx) < 30) return "shoot"
    if (dy < -7) return "through"
    return "pass"
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toPct(e.clientX, e.clientY)
    setDrag({ start: ball, current: p })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    setDrag({ ...drag, current: toPct(e.clientX, e.clientY) })
  }

  const onPointerUp = () => {
    if (!drag) return
    const dist = Math.hypot(drag.current.x - drag.start.x, drag.current.y - drag.start.y)
    if (dist > 6) {
      const nextBall = { ...drag.current }
      const action = classifySwipe(drag.start, nextBall)
      lastBallRef.current = nextBall
      setBall(nextBall)
      setPasses((n) => n + 1)
      setActions((n) => n + 1)
      setBallOwner(null)
      setTurnover(false)

      // The selected tactic changes what happens after the gesture.
      if (tactics.preset === "possession" || tactics.preset === "tiki-taka") {
        setMessage(action === "through" ? "Threaded pass — teammates rotate into support" : "Short pass — teammates move into passing lanes")
      } else if (tactics.preset === "gegenpress" || tactics.preset === "high-press") {
        setMessage("Turnover pressure — nearest players hunt the ball")
        setTurnover(true)
      } else if (tactics.preset === "counter-attack") {
        setMessage("Counter launched — forwards sprint beyond the line")
      } else if (tactics.preset === "wing-play") {
        setMessage("Wide overload — winger and wingback attack the flank")
      } else if (tactics.preset === "low-block") {
        setMessage("Low block — team stays compact behind the ball")
      } else if (tactics.preset === "long-ball") {
        setMessage("Long ball — target forward attacks the space")
      } else {
        setMessage("Direct play — runners push forward")
      }

      if (nextBall.y < 22 && Math.abs(nextBall.x - 50) < 22) {
        setScore((s) => ({ ...s, home: s.home + 1 }))
        setMessage("GOAL! Tactical move finished.")
      }
    }
    setDrag(null)
  }

  const reset = () => {
    setTime(120)
    setRunning(false)
    const center = { x: 50, y: 55 }
    lastBallRef.current = center
    setBall(center)
    setOpponentPositions(opponents.map((p) => ({ ...p })))
    setBallOwner(null)
    setTurnover(false)
    setPasses(0)
    setActions(0)
    setMessage("Swipe from the ball to pass")
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-4">
      <div className="mt-4 rounded-xl border border-primary/20 bg-card/70 px-3 py-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Formation</span><span className="font-bold text-primary">{tactics.formation}</span>
          <span>Preset</span><span className="font-bold text-accent">{tactics.preset.replace("-", " ")}</span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Shape controls positioning · instruction controls team behaviour</p>
      </div>

      {/* Scoreboard */}
      <div className="flex items-center justify-between pt-6">
        <div className="text-center">
          <p className="font-display text-sm font-bold">AUR</p>
          <p className="font-display text-3xl font-black tabular-nums text-glow-cyan">{score.home}</p>
        </div>

        <div className="flex flex-col items-center">
          <span className="rounded-full bg-destructive/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-destructive">
            Sudden Death
          </span>
          <p
            className={cn(
              "mt-1 font-mono text-2xl font-bold tabular-nums",
              time <= 15 ? "text-destructive" : time <= 45 ? "text-chart-4" : "text-foreground",
            )}
          >
            {format(time)}
          </p>
        </div>

        <div className="text-center">
          <p className="font-display text-sm font-bold">PLS</p>
          <p className="font-display text-3xl font-black tabular-nums">{score.away}</p>
        </div>
      </div>

      {/* Pitch viewport */}
      <div
        ref={pitchRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="pitch-bg relative mt-4 aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-3xl border border-accent/20"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* pitch markings */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-white/15" />
        <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/15" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
        <div className="pointer-events-none absolute left-1/2 top-3 h-14 w-28 -translate-x-1/2 rounded-b-lg border border-t-0 border-white/15" />
        <div className="pointer-events-none absolute bottom-3 left-1/2 h-14 w-28 -translate-x-1/2 rounded-t-lg border border-b-0 border-white/15" />

        {/* gesture arrow */}
        {drag && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4 Z" className="fill-primary" />
              </marker>
            </defs>
            <line
              x1={drag.start.x}
              y1={drag.start.y}
              x2={drag.current.x}
              y2={drag.current.y}
              className="stroke-primary"
              strokeWidth="1"
              strokeDasharray="2 2"
              markerEnd="url(#arrow)"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {/* opponents — move toward the ball instead of staying as static dots */}
        {opponentPositions.map((p, i) => (
          <span
            key={`o${i}`}
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-destructive/70"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
        ))}

        {/* player archetypes */}
        {playerArchetypes.map((p, i) => (
          <div
            key={`a${p.name}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${positions[i]?.x ?? p.x}%`, top: `${positions[i]?.y ?? p.y}%` }}
          >
            {p.specialStyle ? <div className="mb-0.5 text-[7px] font-black uppercase text-chart-4"><Star className="mr-0.5 inline h-2.5 w-2.5 fill-current" />{p.specialName}</div> : null}<div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/40 bg-primary text-[9px] font-bold text-primary-foreground">
              {i + 1}
            </div>
            <span className="mt-0.5 block whitespace-nowrap rounded bg-background/65 px-1 text-[7px] font-semibold text-foreground">
              {p.role}
            </span>
          </div>
        ))}

        {/* teammates */}
        {teammates.map((p, i) => (
          <span
            key={`t${i}`}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-primary text-[9px] font-bold text-primary-foreground"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {i + 1}
          </span>
        ))}

        {/* tactical status */}
        {running && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-background/70 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-primary backdrop-blur-sm">
            {turnover ? "PRESSING TRIGGERED" : tactics.preset.replace("-", " ")}
          </div>
        )}

        {/* ball */}
        <span
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"
          style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
        />

        {/* hint */}
        {!drag && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
            <Hand className="h-3.5 w-3.5" />
            Swipe from the ball to pass
          </div>
        )}
      </div>

      <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground">
        {message}
      </div>

      {/* passes counter */
      <div className="mt-3 grid grid-cols-2 gap-2">
        {playerArchetypes.slice(0, 4).map((p) => (
          <div key={p.name} className="rounded-xl border border-border bg-card/70 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold">{p.name}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-primary">{p.role}</span>
            </div>
            <div className="mt-1 text-[9px] text-muted-foreground">
              {p.role === "Winger" ? "Stays wide and looks for crosses" : p.role === "Inside Forward" ? "Cuts inside to attack goal" : p.role === "Playmaker" ? "Finds passing lanes" : p.role === "Ball Winner" ? "Presses and wins possession" : p.role === "Mezzala" ? "Attacks the half-space" : p.role === "Wingback" ? "Overlaps and recovers" : "Follows role instructions"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card/70 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Gesture passes
        </span>
        <span className="font-display text-sm font-bold tabular-nums text-primary">{passes} / {actions}</span>
      </div>

      {/* stamina */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {teamStamina.map((s) => (
          <div key={s.name} className="rounded-xl border border-border bg-card/70 p-2.5">
            <div className="flex items-center gap-1">
              <Battery className={cn("h-3 w-3", s.value < 40 ? "text-destructive" : "text-muted-foreground")} />
              <span className="truncate text-[11px] font-semibold">{s.name}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  s.value < 40 ? "bg-destructive" : s.value < 70 ? "bg-chart-4" : "bg-accent",
                )}
                style={{ width: `${s.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* controls */}
      <div className="mt-4 flex gap-2">
        <Button
          onClick={() => setRunning((r) => !r)}
          disabled={time === 0}
          className="h-12 flex-1 gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {running ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          {running ? "Pause" : time === 0 ? "Full time" : "Kick off"}
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          className="h-12 w-12 rounded-xl border-border bg-card/70 p-0"
          aria-label="Reset match"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
