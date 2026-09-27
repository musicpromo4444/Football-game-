"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, Gift, Lock, Trophy, RefreshCw, Banknote, Gem } from "lucide-react"
import { getPromotionReward, type MatchWinLevel } from "@/lib/economy"
import { cn } from "@/lib/utils"
import { readLeagueProgress, LEAGUE_SEASON_MATCHES, LEAGUE_PROMOTION_POINTS, LEAGUE_RELEGATION_POINTS, type LeagueProgress } from "@/lib/league-progression"

type League = {
  id: string
  name: string
  tier: number
  locked?: boolean
}

const leagues: League[] = [
  { id: "academy", name: "Academy", tier: 1 },
  { id: "league-1", name: "League 1", tier: 2 },
  { id: "league-2", name: "League 2", tier: 3 },
  { id: "league-3", name: "League 3", tier: 4 },
  { id: "league-4", name: "League 4", tier: 5 },
  { id: "premier", name: "Premier League", tier: 6 },
  { id: "champions", name: "Champions League", tier: 7, locked: true },
  { id: "super", name: "Super League", tier: 8, locked: true },
  { id: "legendary", name: "Legendary League", tier: 9, locked: true },
  { id: "elite", name: "Elite League", tier: 10, locked: true },
  { id: "hall-of-fame", name: "Hall of Fame", tier: 11, locked: true },
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
  const [leagueIndex, setLeagueIndex] = useState(5)
  const [progress, setProgress] = useState<LeagueProgress>({ leagueIndex: 5, played: 0, points: 0, wins: 0, draws: 0, losses: 0 })
  const [packSeed, setPackSeed] = useState(0)
  useEffect(() => { const next = readLeagueProgress(); setProgress(next); setLeagueIndex(next.leagueIndex) }, [])
  const currentLeague = leagues[leagueIndex]
  const promotionLevel = currentLeague.id as MatchWinLevel
  const promotionReward = getPromotionReward(promotionLevel)

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

          <div className="mb-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Live Season</span><span className="text-[10px] font-bold text-white/60">{progress.played}/{LEAGUE_SEASON_MATCHES} matches</span></div><div className="mt-2 flex items-end justify-between"><div><p className="text-2xl font-black">{progress.points} <span className="text-xs text-white/40">PTS</span></p><p className="text-[9px] text-white/45">W {progress.wins} · D {progress.draws} · L {progress.losses}</p></div><div className="text-right text-[9px] text-white/50"><p>Promotion: {LEAGUE_PROMOTION_POINTS} pts</p><p>Relegation: {LEAGUE_RELEGATION_POINTS} pts</p></div></div></div>\n\n          <div className="mt-4 grid grid-cols-3 gap-2">
            <RewardCard icon="▰" title={<>CLUB<br />CURRENCY</>} value="1,000" suffix="Box / Bucks" tone="emerald" />
            <RewardCard icon="◆" title={<>PREMIUM<br />GEMS</>} value="50" suffix="Gems 💎" tone="cyan" />
            <RewardCard icon="★" title={<>#9 CB</>} value="89" suffix="SANDBERG (TITA..." tone="amber" />
          </div>
        </div>
      </section>

      <LeagueProgression leagues={leagues} currentIndex={leagueIndex} onSelect={setLeagueIndex} />

      <PromotionRewardPanel
        league={currentLeague.name}
        reward={promotionReward}
        seed={packSeed}
        onReroll={() => setPackSeed((value) => value + 1)}
      />

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


function LeagueProgression({ leagues, currentIndex, onSelect }: { leagues: League[]; currentIndex: number; onSelect: (index: number) => void }) {
  return (
    <section className="mx-auto mt-5 w-[calc(100%-40px)] max-w-[560px]">
      <div className="rounded-2xl border border-white/10 bg-[#0b0d0d] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-400">League Progression</p>
            <p className="mt-1 text-xs font-bold text-white/55">Your journey through the divisions</p>
          </div>
          <Trophy className="h-5 w-5 text-amber-300" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {leagues.map((league, index) => {
            const active = index === currentIndex
            const reached = index <= currentIndex
            return (
              <button key={league.id} type="button" onClick={() => onSelect(index)}
                className={cn("min-w-[96px] rounded-xl border px-2.5 py-3 text-left transition",
                  active ? "border-emerald-400 bg-emerald-500/15" : "border-white/10 bg-white/[0.03]",
                  !reached && "opacity-60")}>
                <div className="flex items-center justify-between">
                  <span className={cn("text-[8px] font-black uppercase", active ? "text-emerald-300" : "text-white/35")}>DIV {league.tier}</span>
                  {league.locked && <Lock className="h-3 w-3 text-amber-400" />}
                </div>
                <p className="mt-2 truncate text-[10px] font-black">{league.name}</p>
                <div className="mt-2 h-1 rounded-full bg-white/10">
                  <div className={cn("h-1 rounded-full", reached ? "w-full bg-emerald-400" : "w-0")} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function PromotionRewardPanel({
  league,
  reward,
  seed,
  onReroll,
}: {
  league: string
  reward: { bux: number; gems: number }
  seed: number
  onReroll: () => void
}) {
  const names = [
    "A. Silva", "K. Mensah", "J. Okafor", "L. Rossi", "M. Diallo",
    "D. Costa", "T. Berg", "R. Santos", "E. Adeyemi", "N. Karim",
  ]
  const positions = ["FWD", "MID", "DEF", "GK"]
  const players = Array.from({ length: 10 }, (_, i) => {
    const index = (i + seed) % names.length
    return {
      name: names[index],
      position: positions[(i + seed) % positions.length],
      rating: 74 + ((i * 2 + seed) % 13),
    }
  })

  return (
    <section className="mx-auto mt-5 w-[calc(100%-40px)] max-w-[560px]">
      <div className="rounded-2xl border border-emerald-500/25 bg-[#0b0d0d] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{league} • Promotion Rewards</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-black text-emerald-300"><Banknote className="h-3 w-3" />{reward.bux.toLocaleString()}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-black text-cyan-300"><Gem className="h-3 w-3" />{reward.gems}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onReroll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/80"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Watch Ad & Reroll
          </button>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/45">Choose 1 player from 10</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {players.map((player, i) => (
              <button key={player.name + i} type="button" className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition active:scale-95">
                <p className="text-sm font-black">{player.name}</p>
                <p className="mt-1 text-[9px] font-bold text-emerald-300">{player.position} · {player.rating} OVR</p>
                <p className="mt-2 text-[9px] text-white/40">Tap to choose</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
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
            <span className="text-center text-[10px] font-bold tabular-nums text-emerald-300">{team.w}</span>
            <span className="text-center text-[10px] font-bold tabular-nums text-white/60">{team.d}</span>
            <span className="text-center text-[10px] font-bold tabular-nums text-rose-300">{team.l}</span>
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
