"use client"

import { useState } from "react"
import { Coins, Gift, X, Play, Sparkles, RefreshCw } from "lucide-react"
import { dailyLoginBonus } from "@/components/game/data"

export function DailyLoginModal() {
  const [open, setOpen] = useState(true)
  const [reward, setReward] = useState(dailyLoginBonus.reward)
  const [doubled, setDoubled] = useState(false)
  const [claimed, setClaimed] = useState(false)

  if (!open) return null

  const rerollPool = ["150 Coins", "2 Gems", "Bronze Crate", "500 Coins", "Stamina x2"]

  function handleReroll() {
    const next = rerollPool[Math.floor(Math.random() * rerollPool.length)]
    setReward(next)
    setDoubled(false)
  }

  function handleDouble() {
    setDoubled(true)
  }

  function close() {
    setClaimed(true)
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <button
        aria-label="Close daily bonus"
        onClick={close}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-indigo-400 via-violet-500 to-sky-400 p-[1.5px] shadow-2xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/90 via-violet-500/85 to-sky-400/90 px-6 pb-6 pt-8 text-center">
          {/* decorative glows */}
          <span className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-sky-300/40 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-12 -right-10 h-44 w-44 rounded-full bg-fuchsia-300/40 blur-3xl" />

          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white/90 transition active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
              <Sparkles className="h-3 w-3" />
              Daily Login Bonus
            </span>

            <h2 className="mt-4 font-display text-2xl font-black text-white drop-shadow">
              Day {dailyLoginBonus.day} Reward
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {dailyLoginBonus.streak}-day streak · come back tomorrow for more
            </p>

            {/* Reward showcase */}
            <div className="relative mx-auto mt-5 flex h-32 w-32 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/25 [animation-duration:2.4s]" />
              <span className="absolute inset-2 rounded-full bg-white/15" />
              <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-white/50 bg-white/20 backdrop-blur">
                <Coins className="h-9 w-9 text-yellow-200 drop-shadow" />
              </div>
              {doubled ? (
                <span className="absolute -right-1 top-0 rotate-12 rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-black text-emerald-950 shadow-lg">
                  x2
                </span>
              ) : null}
            </div>

            <p className="mt-4 font-display text-3xl font-black text-white drop-shadow">
              {doubled ? doubleReward(reward) : reward}
            </p>

            {/* Ad reward actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleReroll}
                className="flex flex-col items-center gap-1 rounded-2xl border border-white/30 bg-white/15 px-3 py-3 text-white transition active:scale-95"
              >
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <RefreshCw className="h-4 w-4" />
                  Reroll
                </span>
                <span className="flex items-center gap-1 text-[11px] text-white/80">
                  <Play className="h-3 w-3 fill-current" />
                  Watch ad
                </span>
              </button>
              <button
                onClick={handleDouble}
                disabled={doubled}
                className="flex flex-col items-center gap-1 rounded-2xl border border-emerald-300/50 bg-emerald-400/25 px-3 py-3 text-white transition active:scale-95 disabled:opacity-60"
              >
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <Gift className="h-4 w-4" />
                  {doubled ? "Doubled" : "Double"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-white/80">
                  <Play className="h-3 w-3 fill-current" />
                  Watch ad
                </span>
              </button>
            </div>

            <button
              onClick={close}
              className="mt-3 w-full rounded-2xl bg-white px-4 py-3 font-display text-base font-black text-violet-700 shadow-lg transition active:scale-[0.98]"
            >
              Claim Reward
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function doubleReward(reward: string): string {
  const match = reward.match(/^([\d,]+)\s+(.*)$/)
  if (match) {
    const num = Number.parseInt(match[1].replace(/,/g, ""), 10)
    return `${(num * 2).toLocaleString()} ${match[2]}`
  }
  return `${reward} x2`
}
