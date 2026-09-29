"use client"

import { useEffect, useMemo, useState } from "react"
import { Gift, Check, Flame, Gem, Banknote, X } from "lucide-react"
import { Card } from "@/components/game/ui-bits"
import { readWallet, saveWallet } from "@/lib/economy"

const KEY = "pitchside-daily-rewards"
const REWARDS = [
  { day: 1, bucks: 100, gems: 0, label: "100 Bux" },
  { day: 2, bucks: 150, gems: 0, label: "150 Bux" },
  { day: 3, bucks: 200, gems: 0, label: "200 Bux" },
  { day: 4, bucks: 250, gems: 0, label: "250 Bux" },
  { day: 5, bucks: 0, gems: 3, label: "3 Gems" },
  { day: 6, bucks: 0, gems: 5, label: "5 Gems" },
  { day: 7, bucks: 1000, gems: 10, label: "1,000 Bux + 10 Gems" },
]

type State = { streak: number; lastClaim: string | null }

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function previousKey() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function readState(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null")
    if (!s || typeof s !== "object") return { streak: 0, lastClaim: null }
    return { streak: Math.max(0, Math.min(7, Number(s.streak) || 0)), lastClaim: typeof s.lastClaim === "string" ? s.lastClaim : null }
  } catch { return { streak: 0, lastClaim: null } }
}

export function DailyRewards({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<State>(() => readState())
  const [message, setMessage] = useState("")
  const today = todayKey()
  const claimedToday = state.lastClaim === today
  const streak = state.lastClaim && state.lastClaim !== today && state.lastClaim !== previousKey() ? 0 : state.streak
  const nextDay = claimedToday ? Math.min(7, state.streak) : Math.min(7, streak + 1)
  const currentReward = REWARDS[nextDay - 1]

  useEffect(() => {
    if (streak !== state.streak) {
      const next = { streak, lastClaim: state.lastClaim }
      localStorage.setItem(KEY, JSON.stringify(next))
      setState(next)
    }
  }, [streak, state.streak, state.lastClaim])

  const claim = () => {
    if (claimedToday || !currentReward) return
    const wallet = readWallet()
    const nextWallet = { bucks: wallet.bucks + currentReward.bucks, gems: wallet.gems + currentReward.gems }
    saveWallet(nextWallet)
    const next = { streak: nextDay, lastClaim: today }
    localStorage.setItem(KEY, JSON.stringify(next))
    setState(next)
    setMessage(currentReward.label + " claimed!")
    window.setTimeout(() => setMessage(""), 2200)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md border-emerald-400/20 bg-[#0b0f0f] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-300">DAILY REWARDS</p>
            <p className="mt-1 text-xl font-black">Build your streak</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-orange-300/15 bg-orange-300/5 p-3">
          <Flame className="h-6 w-6 text-orange-300" />
          <div><p className="text-xs font-black">{state.streak}-day streak</p><p className="text-[9px] text-muted-foreground">{claimedToday ? "Come back tomorrow for the next reward." : "Claim today's reward to keep it going."}</p></div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {REWARDS.map((reward) => {
            const done = reward.day < nextDay || (claimedToday && reward.day <= state.streak)
            const active = reward.day === nextDay && !claimedToday
            return <div key={reward.day} className={`rounded-xl border p-2 text-center ${done ? "border-emerald-400/30 bg-emerald-400/10" : active ? "border-amber-300/40 bg-amber-300/10" : "border-white/5 bg-white/[.02]"}`}>
              <p className="text-[7px] font-black text-muted-foreground">DAY {reward.day}</p>
              <Gift className={`mx-auto my-2 h-5 w-5 ${done ? "text-emerald-300" : active ? "text-amber-300" : "text-white/30"}`} />
              <p className="text-[7px] font-black leading-3">{reward.label}</p>
              {done && <Check className="mx-auto mt-1 h-3 w-3 text-emerald-300" />}
            </div>
          })}
        </div>

        <button type="button" disabled={claimedToday} onClick={claim} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-xs font-black text-black disabled:opacity-40">
          {claimedToday ? "CLAIMED TODAY" : <>CLAIM {currentReward?.label}<span>→</span></>}
        </button>
        {message && <p className="mt-2 text-center text-xs font-black text-emerald-300">{message}</p>}
      </Card>
    </div>
  )
}
