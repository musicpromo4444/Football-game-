"use client"

import { useState } from "react"
import { CheckCircle2, FileSignature, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/game/ui-bits"
import { MatchCanvas } from "@/components/game/screens/match-canvas"
import { readLeagueProgress, saveLeagueProgress } from "@/lib/league-progression"

const TUTORIAL_KEY = "pitchside-fast-match-complete"
const CONTRACT_KEY = "pitchside-professional-contract"

export function FastMatchTutorial({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<"intro" | "match" | "contract">("intro")
  const [message, setMessage] = useState<string | null>(null)

  const start = () => {
    setMessage(null)
    setStage("match")
  }

  const finish = (outcome: { home: number; away: number }) => {
    if (outcome.home <= outcome.away) {
      setMessage(outcome.home === outcome.away
        ? "The tutorial must be won. Try the Fast Match again."
        : "You need to win this Fast Match to earn your professional contract.")
      return
    }

    localStorage.setItem(TUTORIAL_KEY, "true")
    localStorage.setItem(CONTRACT_KEY, JSON.stringify({
      signed: true,
      signedAt: new Date().toISOString(),
      type: "Professional Contract",
    }))

    const progress = readLeagueProgress()
    if (progress.leagueIndex !== 0 || progress.played !== 0) {
      saveLeagueProgress({
        leagueIndex: 0,
        played: 0,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      })
    }
    setMessage(null)
    setStage("contract")
  }

  if (stage === "match") {
    return (
      <main className="app-bg min-h-screen px-4 pb-6 pt-4">
        <div className="mx-auto max-w-md">
          <div className="mb-3 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">New Player Tutorial</p>
            <h1 className="mt-1 font-display text-2xl font-black">FAST MATCH</h1>
            <p className="mt-1 text-xs text-muted-foreground">Win this match to earn your professional contract.</p>
          </div>
          <MatchCanvas onMatchComplete={finish} />
          {message ? (
            <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-center">
              <p className="text-xs font-black text-amber-200">{message}</p>
              <Button onClick={() => { setMessage(null); setStage("match") }} className="mt-3 w-full rounded-xl">Play Again</Button>
            </div>
          ) : null}
        </div>
      </main>
    )
  }

  if (stage === "contract") {
    return (
      <main className="app-bg flex min-h-screen items-center justify-center px-5">
        <Card glow="emerald" className="w-full max-w-md overflow-hidden p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10">
            <FileSignature className="h-9 w-9 text-emerald-300" />
          </div>
          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.3em] text-emerald-300">Career Unlocked</p>
          <h1 className="mt-2 font-display text-3xl font-black">PROFESSIONAL CONTRACT</h1>
          <p className="mt-3 text-sm text-muted-foreground">You won your first match. Your professional career starts now.</p>

          <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-4 text-left">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-amber-300" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                <p className="text-lg font-black text-emerald-200">Professional Player</p>
              </div>
              <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-300" />
            </div>
          </div>

          <Button onClick={onComplete} className="mt-5 w-full rounded-xl py-6 font-display text-base font-black">
            Enter Division 1
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="app-bg flex min-h-screen items-center justify-center px-5">
      <Card glow="cyan" className="w-full max-w-md p-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-4xl">⚽</div>
        <p className="mt-5 text-[9px] font-black uppercase tracking-[0.3em] text-primary">Your First Match</p>
        <h1 className="mt-2 font-display text-3xl font-black">FAST MATCH</h1>
        <p className="mt-3 text-sm text-muted-foreground">Learn the controls in a short match. Win to receive your professional contract and enter Division 1.</p>
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left">
          <p className="text-xs font-black">YOUR PATH</p>
          <p className="mt-2 text-xs text-muted-foreground">Register → Fast Match → Win → Professional Contract → Division 1</p>
        </div>
        <Button onClick={start} className="mt-5 w-full rounded-xl py-6 font-display text-base font-black">Start Fast Match</Button>
      </Card>
    </main>
  )
}
