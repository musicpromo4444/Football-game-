"use client"

import { useState } from "react"
import { Calendar, ListOrdered, Radio } from "lucide-react"
import { ScreenHeader, Card, Pill, FormDots } from "@/components/game/ui-bits"
import { standings, fixtures, results } from "@/components/game/data"
import { cn } from "@/lib/utils"

type View = "table" | "fixtures" | "results"

const tabs: { id: View; label: string; icon: typeof ListOrdered }[] = [
  { id: "table", label: "Table", icon: ListOrdered },
  { id: "fixtures", label: "Fixtures", icon: Calendar },
  { id: "results", label: "Results", icon: Radio },
]

export function LeagueHub() {
  const [view, setView] = useState<View>("table")

  return (
    <div className="pb-4">
      <ScreenHeader title="League Hub" subtitle="Division 2 · Season 7" />

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
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition",
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

      <div className="mt-4 px-5">
        {view === "table" && (
          <Card className="overflow-hidden">
            <div className="grid grid-cols-[24px_1fr_32px_32px_28px] items-center gap-2 border-b border-border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <span>#</span>
              <span>Club</span>
              <span className="text-center">Pld</span>
              <span className="text-center">GD</span>
              <span className="text-center">Pts</span>
            </div>
            <div className="divide-y divide-border">
              {standings.map((row) => (
                <div
                  key={row.pos}
                  className={cn(
                    "grid grid-cols-[24px_1fr_32px_32px_28px] items-center gap-2 px-4 py-3",
                    row.self && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      row.pos <= 3 ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    {row.pos}
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-[9px] font-bold">
                      {row.short}
                    </span>
                    <span className={cn("truncate text-sm", row.self ? "font-bold text-primary" : "font-medium")}>
                      {row.club}
                    </span>
                  </div>
                  <span className="text-center text-sm tabular-nums text-muted-foreground">{row.pld}</span>
                  <span className="text-center text-sm tabular-nums text-muted-foreground">
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </span>
                  <span className="text-center text-sm font-bold tabular-nums">{row.pts}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {view === "fixtures" && (
          <div className="space-y-3">
            {fixtures.map((f) => (
              <Card key={f.id} className="flex items-center gap-3 p-4" glow={f.live ? "cyan" : undefined}>
                <div className="flex w-14 flex-col items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {f.day}
                  </span>
                  <span className="font-display text-sm font-bold tabular-nums">{f.time}</span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{f.home}</p>
                  <p className="text-sm font-semibold text-muted-foreground">{f.away}</p>
                </div>
                {f.live ? (
                  <Pill accent="cyan">
                    <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Live
                  </Pill>
                ) : (
                  <Pill>Upcoming</Pill>
                )}
              </Card>
            ))}
          </div>
        )}

        {view === "results" && (
          <div className="space-y-3">
            {results.map((r) => {
              const win = r.hs > r.as
              const draw = r.hs === r.as
              return (
                <Card key={r.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.home}</p>
                    <p className="text-sm font-semibold text-muted-foreground">{r.away}</p>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 font-display text-lg font-black tabular-nums">
                    <span>{r.hs}</span>
                    <span className="text-muted-foreground">{r.as}</span>
                  </div>
                  <FormDots form={[draw ? "D" : win ? "W" : "L"]} />
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
