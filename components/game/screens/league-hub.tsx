"use client"

import { useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, Gift, Lock, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

type League = {
  id: string
  name: string
  tier: number
  locked?: boolean
}

const leagues: League[] = [
  { id: "league-4", name: "League 4", tier: 5 },
  { id: "premier", name: "Premier League", tier: 6 },
  { id: "champions", name: "Champions League", tier: 7, locked: true },
]

type Team = {
  pos: number
  club: string
  p: number
  w: number
  d: number
  l: number
  pts: number
  self?: boolean
}

const premierTeams: Team[] = [
  { pos: 1, club: "Grandmaster Royal FC", p: 14, w: 11, d: 2, l: 1, pts: 35 },
  { pos: 2, club: "Apex United FC", p: 14, w: 10, d: 3, l: 1, pts: 33, self: true },
  { pos: 3, club: "Grandmaster Titans", p: 14, w: 9, d: 3, l: 2, pts: 30 },
  { pos: 4, club: "Grandmaster Athletic", p: 14, w: 8, d: 4, l: 2, pts: 28 },
  { pos: 5, club: "Grandmaster City", p: 14, w: 7, d: 2, l: 5, pts: 23 },
  { pos: 6, club: "Grandmaster United", p: 14, w: 5, d: 4, l: 5, pts: 19 },
  { pos: 7, club: "Grandmaster Dynamo", p: 14, w: 4, d: 3, l: 7, pts: 15 },
  { pos: 8, club: "Grandmaster Rovers", p: 14, w: 3, d: 3, l: 8, pts: 12 },
]

const sideTeams: Team[] = premierTeams.map((team) => ({
  ...team,
  club: team.club.replace("Grandmaster", "Grandmaster"),
  self: false,
}))

export function LeagueHub() {
  const [leagueIndex, setLeagueIndex] = useState(1)
  const currentLeague = leagues[leagueIndex]

  const moveLeague = (direction: -1 | 1) => {
    setLeagueIndex((value) => Math.max(0, Math.min(leagues.length - 1, value + direction)))
  }

  return (
    <div className="min-h-full overflow-hidden bg-black pb-6 text-white">
      <header className="px-5 pb-4 pt-7 text-center">
        <h1 className="font-display text-4xl font-black tracking-tight">{currentLeague.name}</h1>
      </header>

      <section className="mx-auto w-[calc(100%-40px)] max-w-[560px]">
        <div className="rounded-[22px] border border-white/10 bg-[#0b0d0d] p-4 shadow-[0_8px_35px_rgba(0,0,0,0.5)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#332a12]">
                <Trophy className="h-4 w-4 text-[#e7b82f]" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-white">Season Finish</p>
                <p className="text-sm font-black uppercase tracking-wide text-white">Rewards</p>
                <p className="mt-1 text-[9px] text-white/45">Awarded automatically to all qualified</p>
                <p className="text-[9px] text-white/45">managers at season conclusion</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-emerald-400">(LEAGUE</p>
              <p className="text-xs font-black text-emerald-400">7)</p>
              <span className="mt-1 inline-flex rounded-full bg-emerald-900/60 px-3 py-1 text-[9px] font-black text-emerald-400">
                Guaranteed
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <RewardCard icon="▰" title={<>CLUB<br />CURRENCY</>} value="1,000" suffix="Box / Coins" tone="emerald" />
            <RewardCard icon="◆" title={<>PREMIUM<br />GEMS</>} value="50" suffix="Gems 💎" tone="cyan" />
            <RewardCard icon="★" title={<>#9 CB</>} value="89" suffix="SANDBERG (TITA..." tone="amber" />
          </div>
        </div>
      </section>

      <section className="relative mt-6">
        <div className="flex items-stretch justify-center gap-3">
          <button
            type="button"
            onClick={() => moveLeague(-1)}
            className="mt-10 hidden w-[calc((100vw-340px)/2)] min-w-[42px] max-w-[150px] overflow-hidden rounded-r-xl border border-white/10 bg-[#090b0b] text-left opacity-60 sm:block"
            aria-label="Previous league"
          >
            <SideTable teams={sideTeams} />
          </button>

          <div className="w-[calc(100vw-72px)] max-w-[380px] rounded-xl border-[5px] border-white/65 bg-[#080a0a] shadow-[0_0_30px_rgba(255,255,255,0.08)]">
            <StandingsTable teams={premierTeams} />
          </div>

          <button
            type="button"
            onClick={() => moveLeague(1)}
            className="mt-10 hidden w-[calc((100vw-340px)/2)] min-w-[42px] max-w-[150px] overflow-hidden rounded-l-xl border border-white/10 bg-[#090b0b] text-left opacity-60 sm:block"
            aria-label="Next league"
          >
            <SideTable teams={sideTeams} />
          </button>
        </div>

        <div className="mx-auto mt-3 flex max-w-[380px] items-center justify-between px-1">
          <button type="button" onClick={() => moveLeague(-1)} className="rounded-full p-2 text-white/45 sm:hidden" aria-label="Previous league">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5">
            {leagues.map((league, index) => (
              <button
                key={league.id}
                type="button"
                onClick={() => setLeagueIndex(index)}
                className={cn("h-1.5 rounded-full transition-all", index === leagueIndex ? "w-7 bg-emerald-400" : "w-1.5 bg-white/20")}
                aria-label={league.name}
              />
            ))}
          </div>
          <button type="button" onClick={() => moveLeague(1)} className="rounded-full p-2 text-white/45 sm:hidden" aria-label="Next league">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="mx-auto mt-5 flex w-[calc(100%-40px)] max-w-[560px] items-center justify-between rounded-2xl border border-white/10 bg-[#0b0d0d] px-4 py-3">
        <div className="flex items-center gap-2">
          {currentLeague.locked ? <Lock className="h-4 w-4 text-amber-400" /> : <Gift className="h-4 w-4 text-emerald-400" />}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
              {currentLeague.locked ? "League locked" : "Current league"}
            </p>
            <p className="text-xs font-bold">{currentLeague.name}</p>
          </div>
        </div>
        <p className="text-[10px] font-bold text-white/40">W +3 • D +1 • L -3</p>
      </section>
    </div>
  )
}

function RewardCard({
  icon,
  title,
  value,
  suffix,
  tone,
}: {
  icon: string
  title: ReactNode
  value: string
  suffix: string
  tone: "emerald" | "cyan" | "amber"
}) {
  const tones = {
    emerald: "border-emerald-500/35 bg-emerald-500/5 text-emerald-400",
    cyan: "border-cyan-500/30 bg-cyan-500/5 text-cyan-300",
    amber: "border-amber-500/40 bg-amber-500/5 text-amber-300",
  }
  return (
    <div className={cn("flex min-h-[128px] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center", tones[tone])}>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-black/30 text-base">{icon}</div>
      <p className="text-[9px] font-black leading-4 text-white/65">{title}</p>
      <p className="mt-1 font-display text-xl font-black">{value}</p>
      <p className="mt-0.5 max-w-full truncate text-[8px] font-bold text-white/40">{suffix}</p>
    </div>
  )
}

function StandingsTable({ teams }: { teams: Team[] }) {
  return (
    <div className="overflow-hidden">
      <div className="grid grid-cols-[25px_minmax(120px,1fr)_28px_28px_28px_28px_34px] gap-1 bg-[#111313] px-2 py-3 text-[8px] font-black uppercase tracking-wider text-white/50">
        <span>#</span>
        <span>Club</span>
        <span className="text-center">P</span>
        <span className="text-center">W</span>
        <span className="text-center">D</span>
        <span className="text-center">L</span>
        <span className="text-center">PTS</span>
      </div>

      {teams.map((team) => (
        <div key={team.pos}>
          {team.pos === 1 && (
            <div className="border-b border-emerald-500/20 bg-emerald-500/5 px-2 py-2 text-[8px] font-black uppercase tracking-widest text-emerald-400">
              <span>● Promotion</span>
              <span className="float-right">Qualify for League 8</span>
            </div>
          )}

          {team.pos === 7 && (
            <div className="border-y border-rose-500/20 bg-rose-500/5 px-2 py-2 text-[8px] font-black uppercase tracking-widest text-rose-400">
              <span>● Relegation danger zone</span>
              <span className="float-right">Drop risk</span>
            </div>
          )}

          <div className={cn(
            "grid grid-cols-[25px_minmax(120px,1fr)_28px_28px_28px_28px_34px] items-center gap-1 border-b border-white/5 px-2 py-2.5",
            team.self && "rounded-xl border border-emerald-500/45 bg-emerald-500/15",
          )}>
            <span className={cn(
              "text-xs font-black tabular-nums",
              team.pos <= 4 ? "text-emerald-400" : team.pos >= 7 ? "text-rose-400" : "text-white/70",
            )}>
              {team.pos}
            </span>
            <div className="flex min-w-0 items-center gap-1.5">
              <span className={cn("truncate text-[10px] font-semibold", team.self && "font-black text-emerald-300")}>{team.club}</span>
              {team.self && <span className="shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[7px] font-black text-black">YOU</span>}
            </div>
            <span className="text-center text-[10px] font-bold tabular-nums text-white/65">{team.p}</span>
            <span className="text-center text-[10px] font-bold tabular-nums text-emerald-300">+{team.w}</span>
            <span className="text-center text-[10px] font-bold tabular-nums text-white/60">+{team.d}</span>
            <span className="text-center text-[10px] font-black tabular-nums text-white">{team.pts}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function SideTable({ teams }: { teams: Team[] }) {
  return (
    <div className="min-w-[300px]">
      <StandingsTable teams={teams} />
    </div>
  )
}
