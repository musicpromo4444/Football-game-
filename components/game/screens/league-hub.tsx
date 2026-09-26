"use client"

import { Lock, Trophy, Gift, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, Pill } from "@/components/game/ui-bits"
import { cn } from "@/lib/utils"
import { useState } from "react"

type League = {
  id: string
  name: string
  unlockPoints: number
  reward: string
}

const leagues: League[] = [
  { id: "academy", name: "Academy League", unlockPoints: 0, reward: "Starter rewards" },
  { id: "league-1", name: "League 1", unlockPoints: 9, reward: "League 1 rewards" },
  { id: "league-2", name: "League 2", unlockPoints: 60, reward: "League 2 rewards" },
  { id: "league-3", name: "League 3", unlockPoints: 110, reward: "League 3 rewards" },
  { id: "league-4", name: "League 4", unlockPoints: 250, reward: "League 4 rewards" },
  { id: "premier", name: "Premier League", unlockPoints: 400, reward: "Premier League rewards" },
  { id: "champions", name: "Champions League", unlockPoints: 750, reward: "Champions League rewards" },
  { id: "super", name: "Super League", unlockPoints: 1200, reward: "Super League rewards" },
  { id: "legendary", name: "Legendary League", unlockPoints: 1800, reward: "Legendary League rewards" },
  { id: "elite", name: "Elite League", unlockPoints: 2450, reward: "Elite League rewards" },
  { id: "hall-of-fame", name: "HALL OF FAME", unlockPoints: 0, reward: "Special requirement" },
]

const currentLeagueIndex = 1
const currentPoints = 6

export function LeagueHub() {
  const [leagueIndex, setLeagueIndex] = useState(currentLeagueIndex)
  const current = leagues[leagueIndex]
  const next = leagues[Math.min(leagueIndex + 1, leagues.length - 1)]
  const isCurrent = leagueIndex === currentLeagueIndex
  const points = isCurrent ? currentPoints : current.unlockPoints
  const nextRequirement = next.id === "hall-of-fame" ? "Special requirement" : next.unlockPoints.toLocaleString()
  const pointsNeeded = next.id === "hall-of-fame" ? null : Math.max(0, next.unlockPoints - points)
  const progress = next.id === "hall-of-fame" ? 100 : Math.min(100, Math.round((points / Math.max(1, next.unlockPoints)) * 100))

  return (
    <div className="pb-6">
      <header className="px-5 pb-3 pt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Your current league</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight">{current.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{points.toLocaleString()} league points</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
        </div>
      </header>

      <section className="px-5">
        <Card className="overflow-hidden border-primary/15">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Gift className="h-4 w-4 text-chart-4" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">League reward</p>
              <p className="text-sm font-bold">{current.reward}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            <Rule value="+3" label="WIN" tone="text-primary" />
            <Rule value="+1" label="DRAW" tone="text-foreground" />
            <Rule value="-3" label="LOSS" tone="text-destructive" />
          </div>
        </Card>
      </section>

      <section className="mt-5 px-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">League progression</p>
            <p className="text-[11px] text-muted-foreground">Reach the required points to move up</p>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => setLeagueIndex(v => Math.max(0, v - 1))} className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground" aria-label="Previous league">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setLeagueIndex(v => Math.min(leagues.length - 1, v + 1))} className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground" aria-label="Next league">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {leagues.map((league, index) => {
            const active = index === leagueIndex
            const reached = index <= currentLeagueIndex
            const isHall = league.id === "hall-of-fame"
            return (
              <button
                key={league.id}
                type="button"
                onClick={() => setLeagueIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                  active ? "border-primary/55 bg-primary/10" : "border-border bg-card/45",
                  !reached && !active && "opacity-70",
                )}
              >
                <div className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                  reached ? "border-primary/30 bg-primary/10" : "border-border bg-secondary",
                )}>
                  {reached ? (
                    <span className="font-display text-sm font-black text-primary">{index + 1}</span>
                  ) : (
                    <Lock className="h-5 w-5 text-foreground" strokeWidth={2.5} aria-label="Locked" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-black">{league.name}</p>
                    {active && <Pill accent="emerald">YOU</Pill>}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {isHall ? "Special requirement" : league.unlockPoints.toLocaleString() + " points required"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-chart-4">{league.reward}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-5 px-5">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Next league</p>
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-xl font-black">{next.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {next.id === "hall-of-fame" ? "Special requirement" : nextRequirement + " points required"}
              </p>
            </div>
            {pointsNeeded !== null && (
              <p className="font-display text-lg font-black text-primary">{pointsNeeded.toLocaleString()} more</p>
            )}
          </div>
          {next.id !== "hall-of-fame" && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </Card>
      </section>

      <section className="mt-4 px-5">
        <Card className="p-4">
          <p className="text-sm font-bold">How league matchmaking works</p>
          <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
            <li>• You are matched randomly only with players in your current league.</li>
            <li>• A league has no fixed number of players. Everyone stays until they reach the next point requirement.</li>
            <li>• The same opponent can be rematched up to 2 times after the first match — 3 matches total between the pair.</li>
            <li>• After 3 matches against the same opponent, they cannot be selected as a rematch again for that pair.</li>
          </ul>
        </Card>
      </section>
    </div>
  )
}

function Rule({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/25 px-2 py-2 text-center">
      <p className={cn("font-display text-xl font-black", tone)}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}
