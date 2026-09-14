"use client"

import { useState } from "react"
import { Plus, Copy, Check, Users, Crown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScreenHeader, Card, Pill } from "@/components/game/ui-bits"
import { privateLeagues } from "@/components/game/data"

export function PrivateLeagues() {
  const [copied, setCopied] = useState<string | null>(null)
  const [leagueName, setLeagueName] = useState("")
  const [joinCode, setJoinCode] = useState("")

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500)
  }

  const generatedCode =
    (leagueName.trim().slice(0, 5).toUpperCase().replace(/\s/g, "") || "LEAGUE") + "-" +
    Math.floor(10 + Math.random() * 89)

  return (
    <div className="pb-4">
      <ScreenHeader title="Private Leagues" subtitle="Play with friends, your rules" />

      <div className="space-y-5 px-5">
        {/* Create */}
        <Card glow="emerald" className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-sm font-bold">Create a League</p>
              <p className="text-xs text-muted-foreground">Custom rules &amp; invite-only</p>
            </div>
          </div>

          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            League name
          </label>
          <input
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            placeholder="e.g. Weekend Warriors"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/60 px-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent"
          />

          <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-border bg-secondary/40 px-3.5 py-2.5">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Invite code</p>
              <p className="font-mono text-sm font-bold text-accent">{generatedCode}</p>
            </div>
            <button
              onClick={() => copy(generatedCode)}
              className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 py-1.5 text-xs font-semibold text-accent"
            >
              {copied === generatedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === generatedCode ? "Copied" : "Copy"}
            </button>
          </div>

          <Button className="mt-4 h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" />
            Create League
          </Button>
        </Card>

        {/* Join */}
        <Card className="p-5">
          <p className="font-display text-sm font-bold">Join with a code</p>
          <div className="mt-3 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ENTER-CODE"
              className="h-11 flex-1 rounded-xl border border-border bg-secondary/60 px-3.5 font-mono text-sm uppercase outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Button className="h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
              Join
            </Button>
          </div>
        </Card>

        {/* My leagues */}
        <div>
          <h2 className="mb-3 font-display text-sm font-bold">Your Leagues</h2>
          <div className="space-y-3">
            {privateLeagues.map((l) => (
              <Card key={l.id} className="flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Users className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{l.name}</p>
                    {l.owner && (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-chart-4" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{l.members} members</p>
                </div>
                <button
                  onClick={() => copy(l.code)}
                  className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5"
                >
                  <span className="font-mono text-xs font-bold">{l.code}</span>
                  {copied === l.code ? (
                    <Check className="h-3.5 w-3.5 text-accent" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
