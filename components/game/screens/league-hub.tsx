"use client"

import { useMemo, useState } from "react"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gift,
  Info,
  Lock,
  ShieldAlert,
  Trophy,
} from "lucide-react"
import { Card, Pill } from "@/components/game/ui-bits"
import { cn } from "@/lib/utils"

type League = {
  id: string
  name: string
  tier: number
  unlockPoints: number
  reward: string
  color: "cyan" | "emerald" | "amber"
}

const leagues: League[] = [
  { id: "rookie", name: "Rookie League", tier: 1, unlockPoints: 0, reward: "250 Coins", color: "cyan" },
  { id: "bronze", name: "Bronze League", tier: 2, unlockPoints: 12, reward: "500 Coins + 5 Gems", color: "cyan" },
  { id: "silver", name: "Silver League", tier: 3, unlockPoints: 18, reward: "750 Coins + 10 Gems", color: "emerald" },
  { id: "gold", name: "Gold League", tier: 4, unlockPoints: 24, reward: "1,000 Coins + 20 Gems", color: "amber" },
  { id: "premier", name: "Premier League", tier: 5, unlockPoints: 30, reward: "1,500 Coins + 50 Gems", color: "emerald" },
  { id: "elite", name: "Elite League", tier: 6, unlockPoints: 36, reward: "2,500 Coins + 75 Gems", color: "amber" },
  { id: "master", name: "Master League", tier: 7, unlockPoints: 45, reward: "5,000 Coins + 100 Gems", color: "amber" },
]

type Team = {
  pos: number
  club: string
  short: string
  w: number
  d: number
  l: number
  pts: number
  self?: boolean
}

const featuredTeams: Team[] = [
  { pos: 1, club: "Neon Rovers", short: "NRV", w: 11, d: 2, l: 1, pts: 35 },
  { pos: 2, club: "Obsidian FC", short: "OBS", w: 10, d: 3, l: 1, pts: 33 },
  { pos: 3, club: "Vertex United", short: "VTX", w: 9, d: 3, l: 2, pts: 30 },
  { pos: 4, club: "Aurora FC", short: "AUR", w: 9, d: 2, l: 3, pts: 29, self: true },
]

const relegationTeams: Team[] = [
  { pos: 77, club: "Ember Wanderers", short: "EMB", w: 4, d: 3, l: 7, pts: 9 },
  { pos: 78, club: "Halcyon Town", short: "HAL", w: 3, d: 3, l: 8, pts: 6 },
  { pos: 79, club: "Redwood Athletic", short: "RWA", w: 2, d: 3, l: 9, pts: 3 },
  { pos: 80, club: "Cobalt Rovers", short: "CBR", w: 1, d: 3, l: 10, pts: 0 },
]

const middleTeams: Team[] = Array.from({ length: 72 }, (_, index) => {
  const pos = index + 5
  const names = [
    "Pulse City", "Titan Athletic", "Metro United", "Summit FC", "Royal City",
    "Northstar FC", "Velocity", "Ironbridge", "Blue Harbor", "Capital FC",
    "Phoenix Town", "Crown Athletic",
  ]
  const base = 27 - Math.floor((pos - 5) * 0.31)
  const w = Math.max(2, Math.min(8, Math.floor(base / 3)))
  const d = 3 + (pos % 3)
  const l = Math.max(2, 14 - w - d)
  return {
    pos,
    club: `${names[index % names.length]} ${Math.floor(index / names.length) + 1}`,
    short: `${String.fromCharCode(65 + (index % 26))}${String((index * 7) % 100).padStart(2, "0")}`,
    w,
    d,
    l,
    pts: Math.max(12, base),
  }
})

const allTeams = [...featuredTeams, ...middleTeams, ...relegationTeams]

export function LeagueHub() {
  const [leagueIndex, setLeagueIndex] = useState(4)
  const currentLeague = leagues[leagueIndex]
  const nextLeague = leagues[Math.min(leagueIndex + 1, leagues.length - 1)]
  const currentPoints = 29
  const pointsNeeded = Math.max(0, nextLeague.unlockPoints - currentPoints)
  const progress = Math.min(100, Math.round((currentPoints / nextLeague.unlockPoints) * 100))

  const currentTable = useMemo(() => allTeams, [])

  const moveLeague = (direction: -1 | 1) => {
    setLeagueIndex((value) => Math.max(0, Math.min(leagues.length - 1, value + direction)))
  }

  return (
    <div className="pb-5">
      <header className="px-5 pb-3 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Season 7 · League Stage</p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-tight">{currentLeague.name}</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
        </div>
      </header>

      <div className="px-5">
        <Card className="overflow-hidden border-primary/15">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-chart-4" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Season finish rewards</p>
                <p className="text-sm font-bold">Guaranteed for qualified managers</p>
              </div>
            </div>
            <Pill accent="emerald">Guaranteed</Pill>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            <Reward label="Club currency" value="1,500" />
            <Reward label="Premium gems" value="50" />
            <Reward label="League reward" value="Elite Kit" />
          </div>
        </Card>
      </div>

      <section className="mt-4">
        <div className="mb-2 flex items-center justify-between px-5">
          <div>
            <p className="text-sm font-bold">League progression</p>
            <p className="text-[11px] text-muted-foreground">Swipe to inspect other leagues</p>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => moveLeague(-1)} className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground" aria-label="Previous league">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => moveLeague(1)} className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground" aria-label="Next league">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-5 pb-1">
          {leagues.map((league) => {
            const active = league.id === currentLeague.id
            return (
              <button
                key={league.id}
                type="button"
                onClick={() => active && setLeagueIndex(leagues.findIndex((item) => item.id === league.id))}
                className={cn(
                  "relative min-w-[150px] snap-center rounded-2xl border p-3 text-left transition",
                  active
                    ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                    : "border-border bg-card/45 opacity-45",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">League {league.tier}</span>
                  {active ? <span className="h-2 w-2 rounded-full bg-primary" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="mt-2 font-display text-base font-black">{league.name}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{league.unlockPoints} pts required</p>
                <p className="mt-2 truncate text-[10px] font-semibold text-chart-4">{league.reward}</p>
              </button>
            )
          })}
        </div>
      </section>

      <div className="mt-4 grid gap-3 px-5 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Next league</p>
              <p className="mt-1 font-display text-xl font-black">{nextLeague.name}</p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <span className="font-display text-2xl font-black text-primary">{currentPoints}</span>
              <span className="ml-1 text-xs text-muted-foreground">/ {nextLeague.unlockPoints} pts</span>
            </div>
            <span className="text-xs font-bold text-chart-4">{pointsNeeded} more</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">League rules</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Rule value="+3" label="Win" tone="text-accent" />
            <Rule value="+1" label="Draw" tone="text-chart-4" />
            <Rule value="-3" label="Loss" tone="text-destructive" />
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
            Finish in the promotion zone to qualify for the next league. The bottom four enter relegation danger.
          </p>
        </Card>
      </div>

      <section className="mt-5 px-5">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold">League table</p>
            <p className="text-[11px] text-muted-foreground">80 clubs · 14 matches</p>
          </div>
          <Pill accent="emerald">Top 4 promote</Pill>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[360px]">
              <div className="grid grid-cols-[30px_minmax(150px,1fr)_34px_34px_34px_42px] gap-1 border-b border-border bg-secondary/25 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                <span>#</span><span>Club</span><span className="text-center">W</span><span className="text-center">D</span><span className="text-center">L</span><span className="text-center">Pts</span>
              </div>

              <div className="max-h-[520px] overflow-y-auto">
                {currentTable.map((row) => (
                  <div key={row.pos}>
                    {row.pos === 1 && (
                      <div className="flex items-center gap-2 border-b border-primary/15 bg-primary/5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Promotion zone · positions 1–4
                      </div>
                    )}

                    {row.pos === 77 && (
                      <div className="flex items-center gap-2 border-y border-destructive/15 bg-destructive/5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-destructive">
                        <ShieldAlert className="h-3 w-3" /> Relegation danger · positions 77–80
                      </div>
                    )}

                    <div
                      className={cn(
                        "grid grid-cols-[30px_minmax(150px,1fr)_34px_34px_34px_42px] items-center gap-1 border-b border-border/70 px-3 py-2.5",
                        row.self && "bg-primary/10",
                      )}
                    >
                      <span className={cn("text-xs font-black tabular-nums", row.pos <= 4 ? "text-primary" : row.pos >= 77 ? "text-destructive" : "text-muted-foreground")}>
                        {row.pos}
                      </span>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[8px] font-black", row.self ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                          {row.short}
                        </span>
                        <span className={cn("truncate text-xs", row.self ? "font-black text-primary" : "font-semibold")}>{row.club}</span>
                        {row.self && <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-black text-primary-foreground">YOU</span>}
                      </div>
                      <span className="text-center text-xs font-bold tabular-nums text-accent">{row.w}</span>
                      <span className="text-center text-xs font-bold tabular-nums text-muted-foreground">{row.d}</span>
                      <span className="text-center text-xs font-bold tabular-nums text-destructive">{row.l}</span>
                      <span className="text-center text-xs font-black tabular-nums">{row.pts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-card/50 px-3 py-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Your club is marked <span className="font-bold text-primary">YOU</span> only when it appears in the promotion or relegation positions. Other league tiers stay locked until they are reached.
          </p>
        </div>
      </section>
    </div>
  )
}

function Reward({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-display text-sm font-black">{value}</p>
    </div>
  )
}

function Rule({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/25 px-2 py-2">
      <p className={cn("font-display text-lg font-black", tone)}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}
