"use client"

import { useState } from "react"
import {
  Coins,
  Gem,
  Swords,
  Wifi,
  ChevronRight,
  Radio,
  ChevronLeft,
  Trophy,
  Crown,
  Lock,
  Check,
  Vault,
  Zap,
  CalendarDays,
  Gift,
} from "lucide-react"
import { Card, Pill, StatBar } from "@/components/game/ui-bits"
import { MatchCanvas } from "@/components/game/screens/match-canvas"
import {
  wallet,
  manager,
  fixtures,
  seasonPassWidget,
  weeklyResetGrid,
  type TabId,
} from "@/components/game/data"

export function Play({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const [inMatch, setInMatch] = useState(false)

  if (inMatch) {
    return (
      <div className="pb-4">
        <div className="flex items-center gap-3 px-5 pt-6">
          <button
            onClick={() => setInMatch(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/70 text-muted-foreground transition active:scale-95"
            aria-label="Leave match"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="font-display text-lg font-bold leading-tight">Live Match</p>
            <p className="text-xs text-muted-foreground">Ranked · Sudden Death</p>
          </div>
        </div>
        <MatchCanvas />
      </div>
    )
  }

  return (
    <div className="pb-6">
      <TopHeaderBar />
      <div className="space-y-5 px-5">
        <LiveStatusBanner />
        <QuickPlay onQueue={() => setInMatch(true)} />
        <SeasonPassWidget />
        <WeeklyResetGrid />
      </div>
    </div>
  )
}

function TopHeaderBar() {
  return (
    <header className="sticky top-0 z-10 -mb-1 border-b border-border bg-background/80 px-5 pb-3 pt-6 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 font-display text-sm font-bold text-primary glow-cyan">
            {manager.crest}
            <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-accent px-1 text-[10px] font-black text-accent-foreground">
              {manager.level}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold leading-tight">{manager.club}</p>
            <p className="truncate text-xs text-muted-foreground">{manager.name}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CurrencyChip icon={<Coins className="h-3.5 w-3.5 text-chart-4" />} value={wallet.coins} />
          <CurrencyChip icon={<Gem className="h-3.5 w-3.5 text-primary" />} value={wallet.gems} plus />
        </div>
      </div>
    </header>
  )
}

function CurrencyChip({
  icon,
  value,
  plus,
}: {
  icon: React.ReactNode
  value: number
  plus?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/70 py-1 pl-2 pr-1.5">
      {icon}
      <span className="text-xs font-semibold tabular-nums">{value.toLocaleString()}</span>
      {plus ? (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[11px] font-black leading-none text-primary-foreground">
          +
        </span>
      ) : null}
    </div>
  )
}

function LiveStatusBanner() {
  const live = fixtures.find((f) => f.live)
  if (!live) return null
  return (
    <section className="pt-5">
      <Card glow="cyan" className="flex items-center gap-3 overflow-hidden p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Radio className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Pill accent="cyan">
              <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Live now
            </Pill>
            <span className="text-[11px] text-muted-foreground">{live.day} · {live.time}</span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold">
            {live.home} <span className="text-muted-foreground">vs</span> {live.away}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Card>
    </section>
  )
}

function QuickPlay({ onQueue }: { onQueue: () => void }) {
  return (
    <section>
      <div className="relative">
        <span className="pointer-events-none absolute inset-0 -z-0 animate-ping rounded-3xl bg-primary/20 [animation-duration:2.2s]" />
        <button
          onClick={onQueue}
          className="group relative z-10 flex w-full flex-col items-center gap-1 overflow-hidden rounded-3xl border border-primary/50 bg-gradient-to-br from-primary/25 via-card to-accent/15 px-6 py-7 text-center glow-cyan transition active:scale-[0.98]"
        >
          <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
          <Pill accent="cyan" className="relative">
            <Wifi className="h-3 w-3" />
            Quick Play
          </Pill>
          <span className="relative mt-3 flex h-16 w-16 items-center justify-center rounded-full border border-primary/50 bg-primary/15">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30 [animation-duration:1.8s]" />
            <Swords className="relative h-8 w-8 text-primary" />
          </span>
          <span className="relative mt-3 font-display text-2xl font-black tracking-tight text-glow-cyan">
            Find Online Opponent
          </span>
          <span className="relative text-xs text-muted-foreground">
            Queue for a live random match · avg wait 12s
          </span>
          <span className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground">
            Tap to Queue
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </section>
  )
}

function SeasonPassWidget() {
  const sp = seasonPassWidget
  const xpPct = (sp.xp / sp.xpGoal) * 100
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-400" />
          <h2 className="font-display text-sm font-bold">Season Pass</h2>
        </div>
        <span className="text-[11px] font-medium text-amber-400/80">Ends in {sp.endsIn}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {/* Promo / activate card */}
        <div className="relative flex w-52 shrink-0 flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/80 via-yellow-900/40 to-stone-950 p-4">
          <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/25 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-orange-500/20 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
              <Zap className="h-3 w-3" />
              Premium
            </span>
            <p className="mt-2 font-display text-base font-black leading-tight text-amber-50">{sp.season}</p>
            <p className="mt-1 text-[11px] text-amber-200/70">Tier {sp.tier} of {sp.maxTier}</p>
          </div>
          <div className="relative mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-amber-200/80">
              <span>XP</span>
              <span className="tabular-nums">{sp.xp}/{sp.xpGoal}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
          <button className="relative mt-3 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-2 font-display text-sm font-black text-amber-950 shadow-[0_0_16px_rgba(251,191,36,0.45)] transition active:scale-[0.98]">
            Activate Pass!
          </button>
        </div>

        {/* Tiered reward timeline */}
        <div className="flex shrink-0 items-stretch gap-2 rounded-2xl border border-border bg-stone-950/60 p-3">
          {sp.rewards.map((r) => (
            <div key={r.tier} className="flex w-16 flex-col items-center gap-1.5">
              <RewardNode label={r.free} claimed={r.freeClaimed} variant="free" />
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-[10px] font-black text-amber-300">
                {r.tier}
              </span>
              <RewardNode label={r.paid} claimed={r.paidClaimed} variant="paid" />
            </div>
          ))}
        </div>

        {/* Progress Bank vault */}
        <div className="relative flex w-32 shrink-0 flex-col items-center justify-center rounded-2xl border border-amber-500/40 bg-gradient-to-b from-stone-900 to-amber-950/60 p-4 text-center">
          <span className="pointer-events-none absolute inset-x-4 top-3 h-8 rounded-full bg-amber-400/15 blur-xl" />
          <Vault className="relative h-8 w-8 text-amber-300" />
          <p className="relative mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-200/70">
            {sp.bankLabel}
          </p>
          <p className="relative font-display text-2xl font-black text-amber-100">{sp.bankValue}</p>
          <p className="relative text-[10px] text-amber-200/60">rewards banked</p>
        </div>
      </div>
    </section>
  )
}

function RewardNode({
  label,
  claimed,
  variant,
}: {
  label: string
  claimed?: boolean
  variant: "free" | "paid"
}) {
  return (
    <div
      className={`flex h-14 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 text-center ${
        variant === "paid"
          ? "border-amber-500/40 bg-gradient-to-b from-amber-500/15 to-transparent"
          : "border-border bg-secondary/40"
      } ${claimed ? "opacity-50" : ""}`}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {variant === "paid" ? "Paid" : "Free"}
      </span>
      <span className="line-clamp-2 text-[10px] font-bold leading-tight text-foreground">{label}</span>
      {claimed ? <Check className="h-3 w-3 text-accent" /> : null}
    </div>
  )
}

function WeeklyResetGrid() {
  const w = weeklyResetGrid
  return (
    <section>
      {/* Electric blue gradient header */}
      <div className="overflow-hidden rounded-t-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-white" />
            <h2 className="font-display text-sm font-black uppercase tracking-wide text-white drop-shadow">
              {w.title}
            </h2>
          </div>
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold text-white">
            Resets in {w.resetsIn}
          </span>
        </div>
      </div>

      <div className="rounded-b-2xl border border-t-0 border-border bg-slate-950/80 p-4">
        {/* Day 1-7 reward node row */}
        <div className="flex items-center justify-between gap-1">
          {w.days.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`relative flex h-11 w-full flex-col items-center justify-center rounded-xl border text-center ${
                  d.state === "claimed"
                    ? "border-emerald-500/40 bg-emerald-500/15"
                    : d.state === "today"
                      ? "border-sky-400 bg-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                      : "border-slate-700 bg-slate-900"
                }`}
              >
                {d.state === "claimed" ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : d.state === "locked" ? (
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                ) : (
                  <Gift className="h-4 w-4 text-sky-300" />
                )}
              </div>
              <span
                className={`text-[9px] font-bold ${
                  d.state === "today" ? "text-sky-300" : "text-slate-500"
                }`}
              >
                D{d.day}
              </span>
            </div>
          ))}
        </div>

        {/* Objectives */}
        <div className="mt-4 space-y-3">
          {w.objectives.map((o) => {
            const pct = (o.progress / o.goal) * 100
            return (
              <div key={o.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-slate-100">{o.title}</p>
                  {o.claimable ? (
                    <button className="shrink-0 rounded-lg bg-gradient-to-r from-emerald-500 to-green-400 px-3 py-1 text-[11px] font-black text-emerald-950 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition active:scale-95">
                      Claim
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-400">
                      {o.reward}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                    {o.progress}/{o.goal}
                  </span>
                </div>
                {o.claimable ? (
                  <p className="mt-1.5 text-[11px] font-semibold text-emerald-400">Ready: {o.reward}</p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
