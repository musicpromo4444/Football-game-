"use client"

import { useMemo, useState } from "react"
import { Plus, Copy, Check, Users, Crown, Sparkles, Globe2, MapPin, ShieldCheck, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScreenHeader, Card } from "@/components/game/ui-bits"

type League = {
  id: string
  name: string
  scope: "Worldwide" | "Country"
  country?: string
  minRating: number | null
  maxUsers: number
  members: number
  code: string
  owner: boolean
}

const STORAGE_KEY = "pitchside-user-leagues"

const starterLeagues: League[] = []

function readLeagues(): League[] {
  if (typeof window === "undefined") return starterLeagues
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]")
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function saveLeagues(leagues: League[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leagues))
  window.dispatchEvent(new Event("pitchside-leagues-updated"))
}

function makeCode() {
  return "PS-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.floor(10 + Math.random() * 90)
}

export function PrivateLeagues({ onBack }: { onBack?: () => void }) {
  const [leagues, setLeagues] = useState<League[]>(readLeagues)
  const [leagueName, setLeagueName] = useState("")
  const [scope, setScope] = useState<"Worldwide" | "Country">("Worldwide")
  const [country, setCountry] = useState("")
  const [minRating, setMinRating] = useState("Minimum")
  const [maxUsers, setMaxUsers] = useState("8")
  const [joinCode, setJoinCode] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const codePreview = useMemo(() => makeCode(), [leagueName])

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500)
  }

  const createLeague = () => {
    if (!leagueName.trim()) {
      setMessage("Enter a league name.")
      return
    }
    if (scope === "Country" && !country.trim()) {
      setMessage("Choose a country.")
      return
    }

    const league: League = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      name: leagueName.trim(),
      scope,
      country: scope === "Country" ? country.trim() : undefined,
      minRating: minRating === "Minimum" ? null : Number(minRating),
      maxUsers: Number(maxUsers),
      members: 1,
      code: codePreview,
      owner: true,
    }

    const next = [league, ...leagues]
    setLeagues(next)
    saveLeagues(next)
    setLeagueName("")
    setMessage("League created. Share the invitation code to let others join.")
    setCopied(null)
  }

  const joinLeague = () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) {
      setMessage("Enter an invitation code.")
      return
    }

    const existing = leagues.find((l) => l.code.toUpperCase() === code)
    if (!existing) {
      setMessage("League not found. Check the invitation code.")
      return
    }
    if (existing.members >= existing.maxUsers) {
      setMessage("This league is full.")
      return
    }

    const next = leagues.map((l) => l.id === existing.id ? { ...l, members: l.members + 1, owner: false } : l)
    setLeagues(next)
    saveLeagues(next)
    setJoinCode("")
    setMessage("You joined the league successfully.")
  }

  return (
    <div className="pb-6">
      <ScreenHeader title="Leagues" subtitle="Create a league, invite players and compete" />
      <div className="space-y-4 px-5">
        <Card glow="emerald" className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><Sparkles className="h-5 w-5" /></span>
            <div>
              <p className="font-display text-sm font-bold">Create a League</p>
              <p className="text-xs text-muted-foreground">Set who can join and how many players you want.</p>
            </div>
          </div>

          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">League name</label>
          <input value={leagueName} onChange={(e) => setLeagueName(e.target.value)} placeholder="e.g. Weekend Warriors" className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/60 px-3.5 text-sm outline-none focus:border-accent" />

          <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">League scope</label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setScope("Worldwide")} className={`rounded-xl border px-3 py-3 text-left ${scope === "Worldwide" ? "border-primary bg-primary/10" : "border-border bg-secondary/40"}`}>
              <Globe2 className="mb-1 h-4 w-4 text-primary" /><p className="text-xs font-bold">Worldwide</p><p className="text-[9px] text-muted-foreground">Players from anywhere</p>
            </button>
            <button type="button" onClick={() => setScope("Country")} className={`rounded-xl border px-3 py-3 text-left ${scope === "Country" ? "border-primary bg-primary/10" : "border-border bg-secondary/40"}`}>
              <MapPin className="mb-1 h-4 w-4 text-primary" /><p className="text-xs font-bold">Country</p><p className="text-[9px] text-muted-foreground">Players from one country</p>
            </button>
          </div>

          {scope === "Country" && (
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country name" className="mt-2 h-10 w-full rounded-xl border border-border bg-secondary/60 px-3 text-xs outline-none focus:border-primary" />
          )}

          <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Minimum team rating</label>
          <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/60 px-3 text-sm outline-none">
            <option>Minimum</option><option>70</option><option>75</option><option>80</option><option>85</option><option>90</option>
          </select>

          <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Players required</label>
          <select value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/60 px-3 text-sm outline-none">
            {[4, 8, 12, 16, 20, 32, 64].map((n) => <option key={n} value={n}>{n} users</option>)}
          </select>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-border bg-secondary/40 px-3.5 py-2.5">
            <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Invitation code</p><p className="font-mono text-sm font-bold text-accent">{codePreview}</p></div>
            <button type="button" onClick={() => copy(codePreview)} className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 py-1.5 text-xs font-semibold text-accent">{copied === codePreview ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}Copy</button>
          </div>

          <Button onClick={createLeague} className="mt-4 h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" />Create League</Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-primary" /><div><p className="font-display text-sm font-bold">Join a League</p><p className="text-[10px] text-muted-foreground">Enter the invitation code from the league creator.</p></div></div>
          <div className="mt-3 flex gap-2">
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="PS-XXXX-00" className="h-11 flex-1 rounded-xl border border-border bg-secondary/60 px-3.5 font-mono text-sm uppercase outline-none focus:border-primary" />
            <Button onClick={joinLeague} className="h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">Join</Button>
          </div>
        </Card>

        {message && <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary">{message}</div>}

        <div>
          <h2 className="mb-3 font-display text-sm font-bold">Your Leagues</h2>
          {leagues.length === 0 ? (
            <Card className="p-5 text-center"><Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" /><p className="text-xs text-muted-foreground">No leagues yet. Create one or join with an invitation code.</p></Card>
          ) : (
            <div className="space-y-3">
              {leagues.map((l) => (
                <Card key={l.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><Users className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><p className="truncate font-semibold">{l.name}</p>{l.owner && <Crown className="h-3.5 w-3.5 shrink-0 text-chart-4" />}</div>
                      <p className="text-[10px] text-muted-foreground">{l.scope}{l.country ? ` · ${l.country}` : ""} · {l.members}/{l.maxUsers} players</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{l.minRating ? `Minimum team rating: ${l.minRating}` : "No minimum team rating"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2">
                    <div><p className="text-[9px] uppercase tracking-wide text-muted-foreground">Invitation code</p><p className="font-mono text-xs font-bold">{l.code}</p></div>
                    <button type="button" onClick={() => copy(l.code)} className="flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-[10px] font-bold">{copied === l.code ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}Copy</button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[9px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" />{l.owner ? "You created this league." : "You joined this league."}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
