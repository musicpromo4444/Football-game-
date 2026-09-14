"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw, Battery, Hand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Point = { x: number; y: number }

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
  const pitchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!running || time <= 0) return
    const id = setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [running, time])

  useEffect(() => {
    if (time === 0) setRunning(false)
  }, [time])

  const toPct = useCallback((clientX: number, clientY: number): Point => {
    const rect = pitchRef.current?.getBoundingClientRect()
    if (!rect) return { x: 50, y: 50 }
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    }
  }, [])

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
      setBall(drag.current)
      setPasses((n) => n + 1)
      if (drag.current.y < 22 && Math.abs(drag.current.x - 50) < 22) {
        setScore((s) => ({ ...s, home: s.home + 1 }))
      }
    }
    setDrag(null)
  }

  const reset = () => {
    setTime(120)
    setRunning(false)
    setBall({ x: 50, y: 55 })
    setPasses(0)
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-4">
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

        {/* opponents */}
        {opponents.map((p, i) => (
          <span
            key={`o${i}`}
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-destructive/70"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
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

      {/* passes counter */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card/70 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Gesture passes
        </span>
        <span className="font-display text-sm font-bold tabular-nums text-primary">{passes}</span>
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
