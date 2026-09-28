"use client"

import { useEffect, useState } from "react"
import {
  Banknote,
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
  queueForOnlineMatch,
  acceptRematch,
  declineRematch,
  completeOnlineMatch,
} from "@/lib/online-matchmaking"
import { supabase } from "@/lib/supabase"
import {
  wallet,
  manager,
  fixtures,
  seasonPassWidget,
  weeklyResetGrid,
  type TabId,
} from "@/components/game/data"
import { awardMatchWin, awardMatchDraw, type MatchWinLevel } from "@/lib/economy"
import { recordLeagueResult } from "@/lib/league-progression"

export function Play({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const [inMatch, setInMatch] = useState(false)
  const [showWatch, setShowWatch] = useState(false)
  const [queueing, setQueueing] = useState(false)
  const [onlineError, setOnlineError] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [matchLevel, setMatchLevel] = useState<MatchWinLevel>("academy")
  const [rematchOffer, setRematchOffer] = useState<any>(null)
  const [matchDone, setMatchDone] = useState(false)
  const [matchReward, setMatchReward] = useState<number | null>(null)
  const [matchRewardLabel, setMatchRewardLabel] = useState<"WIN" | "DRAW" | null>(null)
  const [leagueFixture, setLeagueFixture] = useState<{ leagueId: string; fixtureId: string; userIsHome: boolean } | null>(null)
  const [friendMatchId, setFriendMatchId] = useState<string | null>(null)
  const [friendRole, setFriendRole] = useState<"challenger" | "opponent" | null>(null)
  const [rankedRole, setRankedRole] = useState<"challenger" | "opponent" | null>(null)
  const [tournamentId, setTournamentId] = useState<string | null>(null)

  useEffect(() => {
    const startLeagueFixture = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (!detail?.leagueId || !detail?.fixtureId) return
      setLeagueFixture(detail)
      setMatchId("league-" + detail.fixtureId)
      setMatchDone(false)
      setMatchReward(null)
      setMatchRewardLabel(null)
      setOnlineError(null)
      setInMatch(true)
    }
    const startTournament = async () => { const id = window.localStorage.getItem("pitchside-tournament"); if (!id) return; const {data,error}=await supabase.rpc("pitchside_join_tournament",{p_tournament_id:id}); if(error){setOnlineError(error.message);return} setTournamentId(id); setLeagueFixture(null); setFriendMatchId(null); setMatchId("tournament-"+id); setMatchDone(false); setMatchReward(null); setMatchRewardLabel(null); setOnlineError(null); setInMatch(true) }
    const startFriendMatch = (event: Event) => { const detail = (event as CustomEvent).detail || {}; setTournamentId(null); setLeagueFixture(null); setFriendMatchId(detail.matchId || null); setFriendRole(detail.role || null); setMatchId(detail.matchId ? "friend-" + detail.matchId : "friend-match"); setMatchDone(false); setMatchReward(null); setMatchRewardLabel(null); setOnlineError(null); setInMatch(true) }
    window.addEventListener("pitchside-start-league-fixture", startLeagueFixture)
    window.addEventListener("pitchside-start-tournament", startTournament)
    window.addEventListener("pitchside-start-friend-match", startFriendMatch)
    return () => { window.removeEventListener("pitchside-start-league-fixture", startLeagueFixture); window.removeEventListener("pitchside-start-friend-match", startFriendMatch); window.removeEventListener("pitchside-start-tournament", startTournament) }
  }, [])

  useEffect(() => {
    if (!supabase) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    const connect = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session || cancelled) return
      const userId = data.session.user.id
      channel = supabase
        .channel("pitchside-online")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, (payload) => {
          const row = payload.new as any
          if (row.player_a === userId || row.player_b === userId) {
            setMatchId(row.id)
            setRankedRole(row.player_a === userId ? "challenger" : "opponent")
            setFriendMatchId(null)
            setFriendRole(null)
            setMatchLevel((row.league_id as MatchWinLevel) || "academy")
            setInMatch(true)
            setQueueing(false)
            setMatchDone(false)
            setMatchReward(null)
        setMatchRewardLabel(null)
            setMatchRewardLabel(null)
          }
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "rematch_offers" }, (payload) => {
          const row = payload.new as any
          if ((row.player_a === userId || row.player_b === userId) && row.status === "open") {
            setRematchOffer(row)
          }
        })
        .subscribe()
    }
    void connect()
    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [])

  const startOnlineMatch = async () => {
    setQueueing(true)
    setOnlineError(null)
    setRankedRole(null)
    try {
      for (let attempt = 0; attempt < 60; attempt++) {
        const result = await queueForOnlineMatch()
        if (result.match) {
          const { data: row } = await supabase.from("matches").select("player_a,player_b").eq("id", result.match.match_id).maybeSingle()
          const { data: me } = await supabase.auth.getUser()
          setMatchId(result.match.match_id)
          setMatchLevel(result.match.league_id || "academy")
          setRankedRole(row && me.user ? (row.player_a === me.user.id ? "challenger" : "opponent") : null)
          setInMatch(true)
          setMatchReward(null)
          setQueueing(false)
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      throw new Error("No opponent found yet. Please try again.")
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "Online matchmaking failed.")
      setQueueing(false)
    }
  }

  const handleFriendForfeit = async (forfeitUserId: string) => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const loser = forfeitUserId === data.user.id
    setMatchDone(true)
    setMatchReward(loser ? 0 : 180)
    setMatchRewardLabel(loser ? null : "WIN")
    setOnlineError(loser ? "You disconnected for 20 seconds and forfeited the match." : "Your opponent disconnected for 20 seconds and forfeited the match. You receive 180 Bux.")
    try {
      const { data: w } = await supabase.from("pitchside_wallets").select("bucks").eq("user_id", data.user.id).maybeSingle()
      if (w) { const { saveWallet, readWallet } = await import("@/lib/economy"); saveWallet({ ...readWallet(), bucks: Number(w.bucks) }) }
    } catch {}
    setFriendMatchId(null)
    setFriendRole(null)
  }

  const finishOnlineMatch = async (outcome: { home: number; away: number }) => {
    if (!matchId || matchDone) return
    setMatchDone(true)

    if (tournamentId) {
      try { const {error}=await supabase.rpc("pitchside_record_tournament_result",{p_tournament_id:tournamentId,p_goals:outcome.home,p_opponent_goals:outcome.away}); if(error) throw error; } catch(error) { setOnlineError(error instanceof Error ? error.message : "Could not save tournament result."); } setMatchReward(null); setMatchRewardLabel(null); setTournamentId(null); return
    }

    if (friendMatchId) {
      try {
        const { data, error } = await supabase.rpc("pitchside_submit_friend_result", {
          p_match_id: friendMatchId,
          p_home_goals: outcome.home,
          p_away_goals: outcome.away,
        })
        if (error) throw error
        if (data?.status === "disputed") {
          setOnlineError("The two players reported different scores. The match was cancelled and both 100 Bux stakes were refunded.");
          return;
        }
        if (data?.status === "completed") {
          const payout = Number(data?.payout || 0)
          setMatchReward(payout)
          setMatchRewardLabel(payout === 100 ? "DRAW" : "WIN")
          const { saveWallet, readWallet } = await import("@/lib/economy")
          const local = readWallet()
          saveWallet({ ...local, bucks: Number(data?.bucks ?? local.bucks) })
        } else {
          setMatchReward(null)
          setMatchRewardLabel(null)
        }
      } catch (error) {
        setOnlineError(error instanceof Error ? error.message : "Could not save the friend match result.")
      }
      setFriendMatchId(null)
      setFriendRole(null)
      return
    }

    if (leagueFixture) {
      const key = "pitchside-league-details"
      try {
        const all = JSON.parse(window.localStorage.getItem(key) || "{}")
        const d = all[leagueFixture.leagueId]
        if (d) {
          const fixture = d.fixtures?.find((f: any) => f.id === leagueFixture.fixtureId)
          if (fixture && !fixture.played) {
            const userGoals = leagueFixture.userIsHome ? outcome.home : outcome.away
            const opponentGoals = leagueFixture.userIsHome ? outcome.away : outcome.home
            fixture.homeGoals = leagueFixture.userIsHome ? userGoals : opponentGoals
            fixture.awayGoals = leagueFixture.userIsHome ? opponentGoals : userGoals
            fixture.played = true
            const userId = leagueFixture.userIsHome ? fixture.home : fixture.away
            const opponentId = leagueFixture.userIsHome ? fixture.away : fixture.home
            const userTeam = d.teams.find((t: any) => t.id === userId)
            const opponentTeam = d.teams.find((t: any) => t.id === opponentId)
            const apply = (team: any, gf: number, ga: number) => {
              if (!team) return
              team.played += 1; team.gf += gf; team.ga += ga
              if (gf > ga) team.wins += 1
              else if (gf === ga) team.draws += 1
              else team.losses += 1
            }
            apply(userTeam, userGoals, opponentGoals)
            apply(opponentTeam, opponentGoals, userGoals)
            const leagues = JSON.parse(window.localStorage.getItem("pitchside-user-leagues") || "[]")
            const meta = leagues.find((l:any) => l.id === leagueFixture.leagueId)
            if (meta?.mode === "Knockout") {
              const currentRound = Math.max(...(d.fixtures || []).map((f:any) => f.round || 1))
              const roundFixtures = (d.fixtures || []).filter((f:any) => (f.round || 1) === currentRound)
              if (roundFixtures.length && roundFixtures.every((f:any) => f.played)) {
                const winners = roundFixtures.map((f:any) => f.homeGoals > f.awayGoals ? f.home : f.away).filter(Boolean)
                if (winners.length > 1) {
                  const nextRound = currentRound + 1
                  for (let i=0;i+1<winners.length;i+=2) {
                    d.fixtures.push({id:crypto.randomUUID(),round:nextRound,home:winners[i],away:winners[i+1],homeGoals:null,awayGoals:null,played:false})
                  }
                  if (winners.length === 1) meta.status = "completed"
                  window.localStorage.setItem("pitchside-user-leagues", JSON.stringify(leagues))
                }
              }
            }
            window.localStorage.setItem(key, JSON.stringify(all))
            window.dispatchEvent(new Event("pitchside-leagues-updated"))
          }
        }
      } catch {}
      if (supabase) {
        await supabase.from("pitchside_private_league_fixtures").update({
          home_goals: outcome.home, away_goals: outcome.away, status: "completed", played_at: new Date().toISOString()
        }).eq("id", leagueFixture.fixtureId)
      }
      setLeagueFixture(null)
      setMatchReward(outcome.home === outcome.away ? 0 : Math.max(1, outcome.home > outcome.away ? 1 : 0))
      setMatchRewardLabel(outcome.home === outcome.away ? "DRAW" : "WIN")
      return
    }

    const leagueResult = recordLeagueResult(outcome.home, outcome.away)
    if (leagueResult.seasonResult === "promoted") setLeagueOutcome(`PROMOTED · +${leagueResult.reward.toLocaleString()} Bux`)
    else if (leagueResult.seasonResult === "relegated") setLeagueOutcome("RELEGATED · New season started")
    else if (leagueResult.seasonResult === "held") setLeagueOutcome("SEASON COMPLETE · League held")
    window.dispatchEvent(new Event("pitchside-show-store-promo"))
    try {
      const result = await completeOnlineMatch(matchId, outcome.home, outcome.away)
      if (outcome.home > outcome.away) {
        const reward = awardMatchWin(matchLevel)
        setMatchReward(reward.reward)
        setMatchRewardLabel("WIN")
      } else if (outcome.home === outcome.away) {
        const reward = awardMatchDraw()
        setMatchReward(reward.reward)
        setMatchRewardLabel("DRAW")
      }
      if (result?.rematch_offer_id) {
        setRematchOffer({ id: result.rematch_offer_id, status: "open" })
      }
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "Could not save the match result.")
    }
  }

  const respondToRematch = async (accept: boolean) => {
    if (!rematchOffer?.id) return
    try {
      const result = accept ? await acceptRematch(rematchOffer.id) : await declineRematch(rematchOffer.id)
      setRematchOffer(null)
      if (result?.next_match_id) {
        setMatchId(result.next_match_id)
        setMatchLevel((result.league_id as MatchWinLevel) || matchLevel)
        setMatchDone(false)
        setMatchReward(null)
        setInMatch(true)
      }
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "Could not respond to rematch.")
    }
  }

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
            <p className="text-xs text-muted-foreground">Online Ranked · Sudden Death</p>
          </div>
        </div>
        <MatchCanvas onMatchComplete={finishOnlineMatch} onMatchForfeit={handleFriendForfeit} onlineMatch={friendMatchId && friendRole ? { matchId: friendMatchId, role: friendRole, kind: "friend" as const } : rankedRole && matchId ? { matchId, role: rankedRole, kind: "ranked" as const } : undefined} />
        {leagueOutcome ? <div className="mx-5 mt-3 rounded-2xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-3 text-center"><p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">League Update</p><p className="mt-1 text-sm font-black text-cyan-100">{leagueOutcome}</p></div> : null}
        {matchReward !== null ? (
          <div className="mx-5 mt-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">{matchRewardLabel === "DRAW" ? "Draw Reward" : "Match Win Reward"}</p>
            <p className="mt-1 text-xl font-black text-emerald-200">+{matchReward.toLocaleString()} Bux</p>
          </div>
        ) : null}
        {rematchOffer ? (
          <div className="mx-5 mt-3 rounded-2xl border border-primary/40 bg-card p-4 shadow-xl">
            <p className="font-display text-base font-black">Rematch?</p>
            <p className="mt-1 text-xs text-muted-foreground">Both players must accept. Maximum 3 consecutive games.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => void respondToRematch(false)} className="rounded-xl border border-border px-4 py-3 text-sm font-bold">Decline</button>
              <button onClick={() => void respondToRematch(true)} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Accept</button>
            </div>
          </div>
        ) : null}
        {onlineError ? <p className="mx-5 mt-2 text-center text-[11px] text-destructive">{onlineError}</p> : null}
      </div>
    )
  }

  return (
    <div className="pb-6">
      <TopHeaderBar />
      <div className="space-y-5 px-5">
        <LiveStatusBanner />
        <QuickPlay onQueue={() => void startOnlineMatch()} />
        {queueing ? <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-center text-xs font-semibold text-primary">Searching for an opponent in your current league…</div> : null}
        {onlineError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-xs text-destructive">{onlineError}</div> : null}
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
          <CurrencyChip icon={<Banknote className="h-3.5 w-3.5 text-chart-4" />} value={wallet.bucks} />
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
