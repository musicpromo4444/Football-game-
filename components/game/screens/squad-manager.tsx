"use client"

import { useState } from "react"
import { Users, Layers, Dumbbell, Gavel, Battery, ChevronRight, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScreenHeader, Card, Pill, StatBar } from "@/components/game/ui-bits"
import { squad, playstyles, trainingGames, auctionLots } from "@/components/game/data"
import { cn } from "@/lib/utils"

type View = "squad" | "styles" | "training" | "market"

const tabs: { id: View; label: string; icon: typeof Users }[] = [
  { id: "squad", label: "Squad", icon: Users },
  { id: "styles", label: "Styles", icon: Layers },
  { id: "training", label: "Train", icon: Dumbbell },
  { id: "market", label: "Market", icon: Gavel },
]

const posColor: Record<string, string> = {
  GK: "bg-chart-4/20 text-chart-4",
  DEF: "bg-primary/15 text-primary",
  MID: "bg-accent/15 text-accent",
  FWD: "bg-destructive/20 text-destructive",
}

function staminaAccent(v: number): "cyan" | "emerald" | "amber" | "red" {
  if (v < 40) return "red"
  if (v < 70) return "amber"
  return "emerald"
}

export function SquadManager() {
  const [view, setView] = useState<View>("squad")
  const [activeStyle, setActiveStyle] = useState(playstyles[0])

  return (
    <div className="pb-4">
      <ScreenHeader title="Squad & Playstyle" subtitle="Manage, train, and recruit" />

      <div className="px-5">
        <div className="flex rounded-xl border border-border bg-card/70 p-1">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = view === t.id
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold transition",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 space-y-3 px-5">
        {view === "squad" &&
          squad.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-4">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold", posColor[p.pos])}>
                {p.pos}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{p.name}</p>
                  <span className="font-display text-sm font-black text-primary">{p.rating}</span>
                </div>
                <p className="mb-1.5 truncate text-xs text-muted-foreground">{p.style}</p>
                <div className="flex items-center gap-2">
                  <Battery className={cn("h-3.5 w-3.5", p.stamina < 40 ? "text-destructive" : "text-muted-foreground")} />
                  <StatBar value={p.stamina} accent={staminaAccent(p.stamina)} />
                  <span className="w-8 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                    {p.stamina}%
                  </span>
                </div>
              </div>
            </Card>
          ))}

        {view === "styles" && (
          <div>
            <Card glow="cyan" className="mb-3 p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active playstyle</p>
              <p className="font-display text-xl font-bold text-glow-cyan">{activeStyle}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap any of the 25 styles below to set your team&apos;s tactical identity.
              </p>
            </Card>
            <div className="grid grid-cols-2 gap-2">
              {playstyles.map((s) => {
                const active = s === activeStyle
                return (
                  <button
                    key={s}
                    onClick={() => setActiveStyle(s)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition active:scale-[0.98]",
                      active
                        ? "border-primary/50 bg-primary/15 text-primary glow-cyan"
                        : "border-border bg-card/70 text-foreground",
                    )}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {view === "training" && (
          <div className="grid grid-cols-2 gap-3">
            {trainingGames.map((g) => (
              <Card key={g.id} className="p-4" glow={g.accent}>
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    g.accent === "cyan" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent",
                  )}
                >
                  <Dumbbell className="h-5 w-5" />
                </span>
                <p className="mt-3 font-semibold leading-tight">{g.name}</p>
                <Pill accent={g.accent} className="mt-1.5">
                  {g.attribute}
                </Pill>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] uppercase text-muted-foreground">Best</span>
                  <span className="font-display text-sm font-bold tabular-nums">{g.best}</span>
                </div>
                <Button
                  size="sm"
                  className={cn(
                    "mt-2 h-8 w-full rounded-lg text-xs font-semibold",
                    g.accent === "cyan"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-accent text-accent-foreground hover:bg-accent/90",
                  )}
                >
                  Play drill
                </Button>
              </Card>
            ))}
          </div>
        )}

        {view === "market" && (
          <div className="space-y-3">
            <Card className="flex items-center justify-between p-4">
              <div>
                <p className="font-display text-sm font-bold">Transfer Auction</p>
                <p className="text-xs text-muted-foreground">Live bids · values in M coins</p>
              </div>
              <Pill accent="emerald">Open</Pill>
            </Card>
            {auctionLots.map((lot) => (
              <Card key={lot.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold", posColor[lot.pos])}>
                    {lot.pos}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{lot.name}</p>
                      <span className="font-display text-sm font-black text-primary">{lot.rating}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{lot.style}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-chart-4">
                    <Timer className="h-3.5 w-3.5" />
                    <span className="font-mono tabular-nums">{lot.timeLeft}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 rounded-lg bg-secondary/60 px-3 py-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Current bid</p>
                    <p className="font-display text-sm font-bold tabular-nums">{lot.bid}M</p>
                  </div>
                  <Button className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    Bid
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-accent/40 bg-accent/10 px-4 text-sm font-semibold text-accent hover:bg-accent/20"
                  >
                    {lot.buyNow}M
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
