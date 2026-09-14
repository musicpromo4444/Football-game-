"use client"

import { useState } from "react"
import {
  Volume2,
  Mic,
  Vibrate,
  Bell,
  Coins,
  Gem,
  Wallet,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { ScreenHeader, Card } from "@/components/game/ui-bits"
import { wallet } from "@/components/game/data"
import { cn } from "@/lib/utils"

type Toggles = {
  sound: boolean
  commentary: boolean
  haptics: boolean
  notifications: boolean
}

const toggleMeta: { id: keyof Toggles; label: string; hint: string; icon: typeof Volume2 }[] = [
  { id: "sound", label: "Sound Effects", hint: "In-game kicks, whistles and crowd", icon: Volume2 },
  { id: "commentary", label: "Live Commentary", hint: "Play-by-play match commentary", icon: Mic },
  { id: "haptics", label: "Haptics", hint: "Vibration feedback on key events", icon: Vibrate },
  { id: "notifications", label: "Match Alerts", hint: "Push alerts for queues and results", icon: Bell },
]

const topUps: { id: string; kind: "coins" | "gems"; amount: number; price: string; best?: boolean }[] = [
  { id: "g1", kind: "gems", amount: 100, price: "$0.99" },
  { id: "g2", kind: "gems", amount: 550, price: "$4.99", best: true },
  { id: "c1", kind: "coins", amount: 25000, price: "$2.99" },
  { id: "c2", kind: "coins", amount: 120000, price: "$9.99" },
]

export function Settings() {
  const [toggles, setToggles] = useState<Toggles>({
    sound: true,
    commentary: true,
    haptics: false,
    notifications: true,
  })
  const [signedIn, setSignedIn] = useState(false)

  return (
    <div className="pb-6">
      <ScreenHeader title="Settings" subtitle="Game, audio & account" />

      <div className="space-y-5 px-5">
        {/* Account */}
        <section>
          <h2 className="mb-2.5 font-display text-sm font-bold">Account</h2>
          <Card className="p-4">
            {signedIn ? (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Signed in with Google</p>
                  <p className="truncate text-xs text-muted-foreground">a.vega@gmail.com</p>
                </div>
                <button
                  onClick={() => setSignedIn(false)}
                  className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition active:scale-95"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSignedIn(true)}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background/60 py-3 text-sm font-semibold transition active:scale-[0.98]"
              >
                <GoogleGlyph />
                Sign in with Google
              </button>
            )}
          </Card>
        </section>

        {/* Game configuration */}
        <section>
          <h2 className="mb-2.5 font-display text-sm font-bold">Game Configuration</h2>
          <Card className="divide-y divide-border overflow-hidden">
            {toggleMeta.map((t) => {
              const Icon = t.icon
              const on = toggles[t.id]
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      on ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{t.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{t.hint}</p>
                  </div>
                  <Toggle on={on} onToggle={() => setToggles((s) => ({ ...s, [t.id]: !s[t.id] }))} label={t.label} />
                </div>
              )
            })}
          </Card>
        </section>

        {/* Wallet / top-ups */}
        <section>
          <h2 className="mb-2.5 font-display text-sm font-bold">Wallet &amp; Top-ups</h2>
          <Card glow="emerald" className="mb-3 flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold">Your balance</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm font-bold tabular-nums">
                <Coins className="h-4 w-4 text-chart-4" />
                {wallet.coins.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold tabular-nums">
                <Gem className="h-4 w-4 text-primary" />
                {wallet.gems.toLocaleString()}
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {topUps.map((p) => {
              const isGems = p.kind === "gems"
              return (
                <button
                  key={p.id}
                  className={cn(
                    "relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border bg-card/70 p-4 text-left transition active:scale-[0.98]",
                    p.best ? "border-accent/50 glow-emerald" : "border-border",
                  )}
                >
                  {p.best ? (
                    <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-black uppercase text-accent-foreground">
                      Best value
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      isGems ? "bg-primary/15 text-primary" : "bg-chart-4/15 text-chart-4",
                    )}
                  >
                    {isGems ? <Gem className="h-5 w-5" /> : <Coins className="h-5 w-5" />}
                  </span>
                  <span className="font-display text-lg font-black tabular-nums">
                    {p.amount.toLocaleString()}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {isGems ? "Gems" : "Coins"}
                  </span>
                  <span className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-2 font-display text-sm font-bold text-primary-foreground">
                    {p.price}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Payments are processed securely. Prices include applicable taxes.
          </p>
        </section>
      </div>
    </div>
  )
}

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        on ? "border-primary/50 bg-primary/80" : "border-border bg-secondary",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-background shadow transition-transform",
          on ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

function GoogleGlyph() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.67 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}
