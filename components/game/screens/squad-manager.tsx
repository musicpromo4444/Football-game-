"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, Layers, Dumbbell, Gavel, Battery, ChevronRight, Timer, Shield, Swords, SlidersHorizontal, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScreenHeader, Card, Pill, StatBar } from "@/components/game/ui-bits"
import { squad, playstyles, trainingGames, auctionLots } from "@/components/game/data"
import { cn } from "@/lib/utils"

type View = "squad" | "styles" | "training" | "market"
type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "4-1-4-1"
type TacticalPresetId = "possession" | "tiki-taka" | "gegenpress" | "counter-attack" | "direct-play" | "wing-play" | "long-ball" | "high-press" | "low-block" | "balanced"
type TacticalPreset = { id: TacticalPresetId; name: string; formation: Formation; instruction: "Possession" | "Gegenpress" | "Counter Attack" | "Low Block" | "Direct Play"; description: string; motion: string }

const tacticalPresets: TacticalPreset[] = [
  { id: "possession", name: "Possession", formation: "4-3-3", instruction: "Possession", description: "Short passes, close support and patient buildup.", motion: "pass" },
  { id: "tiki-taka", name: "Tiki-Taka", formation: "4-3-3", instruction: "Possession", description: "Quick one-touch passing and constant rotations.", motion: "pass" },
  { id: "gegenpress", name: "Gegenpress", formation: "4-3-3", instruction: "Gegenpress", description: "Lose it, hunt it. The team swarms the ball immediately.", motion: "press" },
  { id: "counter-attack", name: "Counter Attack", formation: "4-2-3-1", instruction: "Counter Attack", description: "Absorb pressure, then explode forward into space.", motion: "counter" },
  { id: "direct-play", name: "Direct Play", formation: "4-1-4-1" as Formation, instruction: "Direct Play", description: "Move the ball forward early and attack space quickly.", motion: "direct" },
  { id: "wing-play", name: "Wing Play", formation: "4-4-2", instruction: "Direct Play", description: "Stretch the pitch and attack through wide players.", motion: "wing" },
  { id: "long-ball", name: "Long Ball", formation: "4-2-3-1", instruction: "Direct Play", description: "Find the forward early and attack second balls.", motion: "long" },
  { id: "high-press", name: "High Press", formation: "4-3-3", instruction: "Gegenpress", description: "Push high and force mistakes near the opponent's goal.", motion: "high" },
  { id: "low-block", name: "Low Block", formation: "3-5-2", instruction: "Low Block", description: "Stay compact, protect the box and break quickly.", motion: "low" },
  { id: "balanced", name: "Balanced", formation: "4-2-3-1", instruction: "Possession", description: "A measured mix of buildup, pressing and defensive shape.", motion: "balanced" },
]

const formations: Formation[] = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "4-1-4-1"]

const tabs: { id: View; label: string; icon: typeof Users }[] = [
  { id: "squad", label: "Tactics", icon: SlidersHorizontal },
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

function PlayerFace({ player }: { player: (typeof squad)[number] }) {
  const initials = player.name.replace(/[^A-Za-z ]/g, "").split(" ").map((n) => n[0]).join("").slice(0, 2)
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-gradient-to-b from-amber-200/90 via-orange-300/80 to-amber-700/90 shadow-inner">
      <div className="absolute -top-1 h-5 w-12 rounded-full bg-slate-900/90" />
      <span className="relative mt-2 text-sm font-black text-slate-950">{initials}</span>
      <span className="absolute left-3 top-7 h-1 w-1 rounded-full bg-slate-950" />
      <span className="absolute right-3 top-7 h-1 w-1 rounded-full bg-slate-950" />
      <span className="absolute bottom-2 h-1 w-3 rounded-full bg-slate-950/70" />
    </div>
  )
}

function PlayerCard({ player, compact = false }: { player: (typeof squad)[number]; compact?: boolean }) {
  const main = [player.rating, Math.min(99, Math.round((player.rating + player.stamina) / 2)), Math.min(99, player.rating - 3), Math.min(99, player.stamina + 5)]
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg",
      compact ? "p-2" : "p-3",
    )}>
      <div className="absolute right-2 top-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-[8px] font-black text-primary">
        {player.rating} OVR
      </div>
      <div className="flex items-center gap-2">
        <PlayerFace player={player} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{player.name}</p>
          <p className="truncate text-[9px] font-semibold text-primary">{player.specialName || player.style}</p>
          <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{player.style} · {player.pos}</p>
        </div>
      </div>
      {!compact && (
        <>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {[
              ["RAT", main[0]],
              ["PAS", main[1]],
              ["DEF", main[2]],
              ["STA", player.stamina],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-secondary/60 px-1 py-1 text-center">
                <p className="text-[7px] font-bold text-muted-foreground">{label}</p>
                <p className="text-[10px] font-black">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[8px] font-bold text-amber-300">
            <Star className="h-3 w-3 fill-current" />
            Special: {player.specialStyle || "Standard"}
          </div>
        </>
      )}
    </div>
  )
}

export function SquadManager() {
  const [view, setView] = useState<View>("squad")
  const [previewTick, setPreviewTick] = useState(0)
  useEffect(() => { const id = window.setInterval(() => setPreviewTick((v) => v + 1), 500); return () => window.clearInterval(id) }, [])
  const [activeStyle, setActiveStyle] = useState(playstyles[0])
  const [formation, setFormation] = useState<Formation>(() => typeof window === "undefined" ? "4-3-3" : (localStorage.getItem("pitchside-formation") as Formation) || "4-3-3")
  const [presetId, setPresetId] = useState<TacticalPresetId>(() => typeof window === "undefined" ? "possession" : (localStorage.getItem("pitchside-tactical-preset") as TacticalPresetId) || "possession")
  const activePreset = tacticalPresets.find((p) => p.id === presetId) || tacticalPresets[0]
  const [instruction, setInstruction] = useState(activePreset.instruction)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [lineup, setLineup] = useState<string[]>(() => typeof window === "undefined" ? squad.map((p) => p.id) : JSON.parse(localStorage.getItem("pitchside-lineup") || JSON.stringify(squad.map((p) => p.id))))
  const selectedPlayer = useMemo(() => squad.find((p) => p.id === selectedPlayerId) || null, [selectedPlayerId])
  const swapPlayer = (targetId: string) => {
    if (!selectedPlayerId || selectedPlayerId === targetId) return
    setLineup((current) => {
      const a = current.indexOf(selectedPlayerId), b = current.indexOf(targetId)
      if (a < 0 || b < 0) return current
      const next = [...current]; [next[a], next[b]] = [next[b], next[a]]
      localStorage.setItem("pitchside-lineup", JSON.stringify(next))
      return next
    })
    setSelectedPlayerId(null)
  }

  const chooseFormation = (value: Formation) => { setFormation(value); localStorage.setItem("pitchside-formation", value) }
  const choosePreset = (preset: TacticalPreset) => {
    setPresetId(preset.id)
    setFormation(preset.formation)
    setInstruction(preset.instruction)
    localStorage.setItem("pitchside-tactical-preset", preset.id)
    localStorage.setItem("pitchside-formation", preset.formation)
    localStorage.setItem("pitchside-instruction", preset.instruction)
  }

  return (
    <div className="pb-4">
      <ScreenHeader title="Tactics" subtitle="Set your formation, roles, and match approach" />

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
        {view === "squad" && (
          <div className="space-y-3">
            <Card glow="cyan" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Starting formation</p>
                  <p className="font-display text-2xl font-black text-glow-cyan">{formation}</p>
                </div>
                <Pill accent="cyan">{activePreset.name}</Pill>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Set the shape first, then choose how the team behaves in attack and defence.
              </p>
            </Card>

            <Card className="p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Formation</p>
              <div className="grid grid-cols-2 gap-2">
                {formations.map((f) => (
                  <button
                    key={f}
                    onClick={() => chooseFormation(f)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-black transition",
                      formation === f ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/70 text-foreground",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Tactical focus</p>
                <span className="text-[10px] text-muted-foreground">Changes match behaviour</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "defending", label: "Defending", icon: Shield },
                  { id: "balanced", label: "Balanced", icon: SlidersHorizontal },
                  { id: "attacking", label: "Attacking", icon: Swords },
                ].map(({ id, label, icon: Icon }) => {
                  const active = (typeof window !== "undefined" ? localStorage.getItem("pitchside-tactical-focus") : null) === id
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        localStorage.setItem("pitchside-tactical-focus", id)
                        setPresetId(id === "defending" ? "low-block" : id === "attacking" ? "high-press" : "balanced")
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[10px] font-bold",
                        active ? "border-accent bg-accent/15 text-accent" : "border-border bg-card/70 text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card className="overflow-hidden p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Starting XI</p>
                  <p className="text-[10px] text-muted-foreground">Fixed squad players · tap a card to inspect abilities</p>
                </div>
                <Pill accent="cyan">{squad.length} players</Pill>
              </div>

              <div className="relative mx-auto aspect-[4/5] max-w-[290px] overflow-hidden rounded-2xl border border-primary/20 bg-emerald-950/60">
                <div className="absolute inset-2 rounded-xl border border-white/15" />
                <div className="absolute left-1/2 top-1/2 h-px w-[calc(100%-16px)] -translate-x-1/2 bg-white/15" />
                <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
                {lineup.map((playerId, i) => {\n                  const p = squad.find((player) => player.id === playerId) || squad[i]
                  const slot = [
                    { x: 50, y: 88 }, { x: 20, y: 69 }, { x: 50, y: 68 }, { x: 80, y: 69 },
                    { x: 33, y: 48 }, { x: 67, y: 48 }, { x: 50, y: 22 },
                  ][i]
                  return (
                    <button type="button" key={p.id} onClick={() => selectedPlayerId ? swapPlayer(p.id) : setSelectedPlayerId(p.id)} className={cn("absolute -translate-x-1/2 -translate-y-1/2 text-center rounded-xl p-1 transition", selectedPlayerId === p.id ? "bg-primary/25 ring-2 ring-primary scale-110" : "hover:bg-white/10") } style={{ left: slot.x + "%", top: slot.y + "%" }} aria-label={selectedPlayerId ? `Swap with ${p.name}` : `Select ${p.name}`}>
                      <div className="relative mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-primary text-[8px] font-black text-primary-foreground shadow-[0_0_16px_rgba(0,0,0,.35)]">
                        {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        <span className="absolute -right-1 -top-1 rounded-full bg-background px-1 text-[6px] text-primary">{p.rating}</span>
                      </div>
                      <span className="mt-0.5 block max-w-[62px] truncate rounded bg-background/80 px-1 text-[7px] font-bold">{p.name}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">\n                <p className="text-[9px] text-muted-foreground">{selectedPlayer ? `${selectedPlayer.name} selected — tap another player to swap` : "Tap a player to select, then tap another to swap."}</p>\n                {selectedPlayer ? <button type="button" onClick={() => setSelectedPlayerId(null)} className="rounded-lg border border-border px-2 py-1 text-[9px] font-bold">Cancel</button> : null}\n              </div>
            </Card>

            <div className="grid grid-cols-1 gap-2">
              {lineup.map((id) => { const p = squad.find((player) => player.id === id); return p ? <button type="button" key={p.id} onClick={() => setSelectedPlayerId(p.id)} className="text-left">{<PlayerCard player={p} />}</button> : null })}
            </div>

            <Card className="p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Starting XI</p>
              <div className="space-y-2">
                {squad.slice(0, 7).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/70 px-3 py-2.5">
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-[9px] font-black", posColor[p.pos])}>{p.pos}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{p.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{p.style}</p>
                    </div>
                    <span className="font-display text-xs font-black text-primary">{p.rating}</span>
                    {i === 0 ? <Pill accent="cyan">GK</Pill> : null}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Quick tactical presets</p>
              <div className="grid grid-cols-2 gap-2">
                {tacticalPresets.slice(0, 8).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => choosePreset(preset)}
                    className={cn(
                      "rounded-xl border p-3 text-left",
                      preset.id === presetId ? "border-primary bg-primary/15" : "border-border bg-card/70",
                    )}
                  >
                    <p className="text-xs font-black">{preset.name}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">{preset.formation} · {preset.instruction}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {view === "styles" && (
          <div>
            <Card glow="cyan" className="mb-3 p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active playstyle</p>
              <p className="font-display text-xl font-bold text-glow-cyan">{activeStyle}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap any of the 25 styles below to set your team&apos;s tactical identity.
              </p>
            </Card>
            <Card className="mb-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tactical preset</p>
                  <p className="font-display text-lg font-bold text-primary">{activePreset.name}</p>
                </div>
                <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">{activePreset.formation}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{activePreset.description}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {tacticalPresets.map((preset) => {
                  const active = preset.id === presetId
                  const phase = previewTick * 0.65
                  const move = (i: number) => {
                    const bx = [22,78,30,70,50][i]
                    const by = [25,25,52,52,72][i]
                    if (preset.motion === "pass") return { x: bx + Math.sin(phase + i) * 6, y: by + Math.cos(phase + i) * 3 }
                    if (preset.motion === "press" || preset.motion === "high") return { x: bx + (50 - bx) * 0.08 + Math.sin(phase + i) * 2, y: by - 5 + Math.sin(phase + i) * 2 }
                    if (preset.motion === "counter") return { x: bx + (i % 2 ? 5 : -5), y: by - 7 + Math.sin(phase + i) * 2 }
                    if (preset.motion === "wing") return { x: i % 2 ? 86 : 14, y: by + Math.sin(phase + i) * 3 }
                    if (preset.motion === "long") return { x: bx, y: by - 8 + Math.sin(phase + i) * 2 }
                    if (preset.motion === "low") return { x: 50 + (bx - 50) * 0.65, y: by + 8 + Math.sin(phase + i) * 1.5 }
                    return { x: bx + Math.sin(phase + i) * 2, y: by + Math.cos(phase + i) * 2 }
                  }
                  return (
                    <button key={preset.id} onClick={() => choosePreset(preset)} className={cn("rounded-xl border p-2 text-left transition", active ? "border-primary bg-primary/15" : "border-border bg-card/70")}>
                      <div className="relative mx-auto h-20 w-full max-w-[92px] overflow-hidden rounded-lg border border-white/15 bg-emerald-950/60">
                        <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-white/15" />
                        <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
                        {[0,1,2,3,4].map((i) => (
                          <span key={i} className={cn("absolute h-2.5 w-2.5 rounded-full border border-white/40", active ? "bg-primary" : "bg-primary/70")} style={{ left: move(i).x + "%", top: move(i).y + "%", transition: "left 450ms ease, top 450ms ease" }} />
                        ))}
                        {[0,1,2,3].map((i) => <span key={i} className="absolute h-2.5 w-2.5 rounded-full border border-white/30 bg-blue-400/70" style={{ left: [35,65,50,58][i] + "%", top: [18,38,48,62][i] + "%" }} />)}
                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white" style={{ left: (50 + Math.sin(phase) * 18) + "%", transition: "left 450ms linear" }} />
                      </div>
                      <p className={cn("mt-2 text-xs font-bold", active ? "text-primary" : "text-foreground")}>{preset.name}</p>
                      <p className="text-[9px] leading-tight text-muted-foreground">{preset.description}</p>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">Green dots = your team · blue dots = opponents. Tap a preset to preview its movement and make it active in matches.</p>
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
