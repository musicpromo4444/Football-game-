"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Plus, Save, Trash2, LockKeyhole, ShieldCheck, CreditCard, Megaphone, ToggleLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Pill, ScreenHeader } from "@/components/game/ui-bits"
import { AdminShop } from "@/components/game/admin-shop"
import { AuctionPlayer, generateAuctionPlayers, readAuctionPlayers, saveAuctionPlayers } from "@/lib/auction"
import { AuctionDisplaySettings, DEFAULT_AUCTION_DISPLAY, readAuctionDisplay, saveAuctionDisplay } from "@/lib/auction-display"

const emptyPlayer = (): AuctionPlayer => generateAuctionPlayers(1)[0]

export default function AdminPage() {
  const [players, setPlayers] = useState<AuctionPlayer[]>([])
  const [count, setCount] = useState(4)
  const [generateAmount, setGenerateAmount] = useState(10)
  const [saved, setSaved] = useState(false)
  const [display, setDisplay] = useState<AuctionDisplaySettings>(DEFAULT_AUCTION_DISPLAY)
  const [adminToken, setAdminToken] = useState("")
  const [secretStatus, setSecretStatus] = useState<Record<string, boolean>>({})
  const [secretValues, setSecretValues] = useState<Record<string, string>>({})
  const [secretMessage, setSecretMessage] = useState("")
  const [features, setFeatures] = useState({ onlineMatches: true, auctions: true, playerCards: true, ghostFormation: true, injuryShield: true, ads: true, purchases: true })

  useEffect(() => {
    const loaded = readAuctionPlayers()
    setPlayers(loaded); setCount(loaded.length); setDisplay(readAuctionDisplay())
  }, [])

  const enabledPlayers = useMemo(() => players.filter((p) => p.enabled), [players])
  const update = (id: string, patch: Partial<AuctionPlayer>) => setPlayers((current) => current.map((p) => p.id === id ? { ...p, ...patch } : p))
  const updateAttr = (id: string, key: keyof AuctionPlayer["attributes"], value: number) => setPlayers((current) => current.map((p) => p.id === id ? { ...p, attributes: { ...p.attributes, [key]: Math.max(1, Math.min(99, value)) } } : p))
  const setAuctionCount = (value: number) => {
    const next = Math.max(1, Math.min(30, value)); setCount(next)
    setPlayers((current) => current.length >= next ? current.slice(0, next) : [...current, ...Array.from({ length: next - current.length }, emptyPlayer)])
  }
  const save = () => { saveAuctionPlayers(players.slice(0, count)); setSaved(true); window.setTimeout(() => setSaved(false), 1800) }

  const secretKeys = [
    ["pitchside.payment.provider", "Payment provider"],
    ["pitchside.payment.public_key", "Payment public key"],
    ["pitchside.payment.secret_key", "Payment secret key"],
    ["pitchside.payment.webhook_secret", "Payment webhook secret"],
    ["pitchside.ads.provider", "Ads provider"],
    ["pitchside.ads.publisher_id", "Ads publisher ID"],
    ["pitchside.ads.app_id", "Ads app ID"],
    ["pitchside.ads.api_key", "Ads API key"],
    ["pitchside.ads.api_secret", "Ads API secret"],
  ] as const

  const loadSecretStatus = async () => {
    if (!adminToken) return
    const res = await fetch("/api/admin/secrets", { headers: { "x-pitchside-admin-token": adminToken } })
    const data = await res.json()
    if (!res.ok) { setSecretMessage(data.error || "Admin access failed"); return }
    setSecretStatus(Object.fromEntries((data.configured || []).map((x: { name: string; configured: boolean }) => [x.name, x.configured])))
    setSecretMessage("Secure configuration loaded")
  }

  const saveSecrets = async () => {
    if (!adminToken) { setSecretMessage("Enter the Admin Access Key first"); return }
    const secrets = Object.entries(secretValues).filter(([, value]) => value.trim()).map(([name, value]) => ({ name, value }))
    const res = await fetch("/api/admin/secrets", { method: "POST", headers: { "Content-Type": "application/json", "x-pitchside-admin-token": adminToken }, body: JSON.stringify({ secrets }) })
    const data = await res.json()
    setSecretMessage(res.ok ? "Saved securely" : (data.error || "Could not save"))
    if (res.ok) { setSecretValues({}); await loadSecretStatus() }
  }

  return (
    <main className="min-h-screen bg-background pb-8">
      <ScreenHeader title="PitchSide Admin" subtitle="Auction & shop control" />
      <div className="space-y-3 px-5">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Auction button</p><p className="font-bold">{display.enabled ? "Visible to players" : "Hidden from players"}</p></div>
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={display.enabled} onChange={(e) => setDisplay({ ...display, enabled: e.target.checked })} /> ON</label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-muted-foreground">Icon<input value={display.icon} onChange={(e) => setDisplay({ ...display, icon: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
            <label className="text-[10px] font-bold text-muted-foreground">Name<input value={display.title} onChange={(e) => setDisplay({ ...display, title: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
          </div>
          <label className="mt-2 block text-[10px] font-bold text-muted-foreground">Write-up<input value={display.writeUp} onChange={(e) => setDisplay({ ...display, writeUp: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
          <Button onClick={() => { saveAuctionDisplay(display); setSaved(true); window.setTimeout(() => setSaved(false), 1800) }} variant="outline" className="mt-3 w-full rounded-xl">Save auction button</Button>
        </Card>

        <Card glow="cyan" className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Auction players</p><p className="font-display text-2xl font-black text-primary">{enabledPlayers.length}</p></div>
            <div className="flex items-center gap-2"><input aria-label="Auction player count" type="number" min={1} max={30} value={count} onChange={(e) => setAuctionCount(Number(e.target.value) || 1)} className="w-20 rounded-xl border border-border bg-card px-3 py-2 text-center font-black" /><Button onClick={save} className="rounded-xl"><Save className="mr-1 h-4 w-4" />{saved ? "Saved" : "Save"}</Button></div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Choose exactly how many players appear in the public auction. Edit every player's name, look, style, price and attributes below.</p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <select value={generateAmount} onChange={(e) => setGenerateAmount(Number(e.target.value))} className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold">
              {[5,10,20,30].map((n) => <option key={n} value={n}>{n} random players</option>)}
            </select>
            <Button variant="outline" className="rounded-xl" onClick={() => { const generated = generateAuctionPlayers(generateAmount); setPlayers(generated); setCount(generated.length); }}>
              Auction Player
            </Button>
          </div>
        </Card>

        {players.slice(0, count).map((player, index) => (
          <Card key={player.id} className="p-4">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Pill accent="cyan">#{index + 1}</Pill><span className="text-xs font-bold">Auction Player</span></div><Button variant="ghost" size="sm" onClick={() => setPlayers((current) => current.filter((p) => p.id !== player.id))}><Trash2 className="h-4 w-4" /></Button></div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Name", player.name, (v: string) => update(player.id, { name: v })],
                ["Look / initials", player.face, (v: string) => update(player.id, { face: v.slice(0, 3).toUpperCase() })],
                ["Style", player.style, (v: string) => update(player.id, { style: v })],
              ].map(([label, value, fn]) => <label key={String(label)} className="text-[10px] font-bold text-muted-foreground">{label}<input value={String(value)} onChange={(e) => (fn as (v: string) => void)(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs text-foreground" /></label>)}
              <label className="text-[10px] font-bold text-muted-foreground">Position<select value={player.position} onChange={(e) => update(player.id, { position: e.target.value as AuctionPlayer["position"] })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"><option>GK</option><option>DEF</option><option>MID</option><option>FWD</option></select></label>
              <label className="text-[10px] font-bold text-muted-foreground">Rating<input type="number" min={1} max={99} value={player.rating} onChange={(e) => update(player.id, { rating: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-[10px] font-bold text-muted-foreground">Starting Bucks<input type="number" min={0} value={player.startingBucks} onChange={(e) => update(player.id, { startingBucks: Number(e.target.value), currentBucks: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
              <label className="text-[10px] font-bold text-muted-foreground">Starting Gems<input type="number" min={0} value={player.startingGems} onChange={(e) => update(player.id, { startingGems: Number(e.target.value), currentGems: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
              <label className="text-[10px] font-bold text-muted-foreground">Buy Now Bucks<input type="number" min={0} value={player.buyNowBucks} onChange={(e) => update(player.id, { buyNowBucks: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
              <label className="text-[10px] font-bold text-muted-foreground">Buy Now Gems<input type="number" min={0} value={player.buyNowGems} onChange={(e) => update(player.id, { buyNowGems: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1">{(Object.keys(player.attributes) as (keyof AuctionPlayer["attributes"])[]).map((key) => <label key={key} className="text-center text-[8px] font-bold uppercase text-muted-foreground">{key}<input type="number" min={1} max={99} value={player.attributes[key]} onChange={(e) => updateAttr(player.id, key, Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-1 py-2 text-center text-[10px]" /></label>)}</div>
            <label className="mt-3 flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={player.enabled} onChange={(e) => update(player.id, { enabled: e.target.checked })} /> Show in auction</label>
          </Card>
        ))}

        <Button variant="outline" onClick={() => setPlayers((current) => [...current, emptyPlayer()])} className="w-full rounded-xl"><Plus className="mr-1 h-4 w-4" /> Add player</Button>
        <Card glow="cyan" className="p-4">
          <div className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-cyan-300" /><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Admin Security</p><p className="font-bold">Private configuration</p></div></div>
          <p className="mt-2 text-xs text-muted-foreground">Payment and advertising credentials never enter the player frontend or local storage. They are sent only to the protected server endpoint and stored in Supabase Vault.</p>
          <input type="password" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="Admin Access Key" className="mt-3 w-full rounded-xl border border-border bg-secondary/50 px-3 py-3 text-xs" />
          <Button onClick={loadSecretStatus} variant="outline" className="mt-2 w-full rounded-xl"><ShieldCheck className="mr-1 h-4 w-4" />Verify Admin Access</Button>
        </Card>

        <Card glow="emerald" className="p-4">
          <div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-emerald-300" /><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Payments</p><p className="font-bold">Provider & private keys</p></div></div>
          <div className="mt-3 space-y-2">
            {secretKeys.slice(0, 4).map(([name, label]) => <label key={name} className="block text-[10px] font-bold text-muted-foreground">{label}{secretStatus[name] && !secretValues[name] ? <span className="ml-2 text-emerald-400">Configured</span> : null}<input type={name.includes("secret") || name.includes("key") ? "password" : "text"} value={secretValues[name] || ""} onChange={(e) => setSecretValues({ ...secretValues, [name]: e.target.value })} placeholder={secretStatus[name] ? "Leave blank to keep current" : label} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>)}
          </div>
        </Card>

        <Card glow="cyan" className="p-4">
          <div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-cyan-300" /><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Advertising</p><p className="font-bold">Ad network configuration</p></div></div>
          <div className="mt-3 space-y-2">
            {secretKeys.slice(4).map(([name, label]) => <label key={name} className="block text-[10px] font-bold text-muted-foreground">{label}{secretStatus[name] && !secretValues[name] ? <span className="ml-2 text-emerald-400">Configured</span> : null}<input type={name.includes("secret") || name.includes("key") ? "password" : "text"} value={secretValues[name] || ""} onChange={(e) => setSecretValues({ ...secretValues, [name]: e.target.value })} placeholder={secretStatus[name] ? "Leave blank to keep current" : label} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>)}
          </div>
          <Button onClick={saveSecrets} className="mt-3 w-full rounded-xl"><Save className="mr-1 h-4 w-4" />Save secure keys</Button>
          {secretMessage ? <p className="mt-2 text-center text-[10px] font-bold text-emerald-300">{secretMessage}</p> : null}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2"><ToggleLeft className="h-5 w-5 text-amber-300" /><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Game Controls</p><p className="font-bold">Feature switches</p></div></div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(Object.keys(features) as (keyof typeof features)[]).map((key) => <label key={key} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2 text-[10px] font-bold"><input type="checkbox" checked={features[key]} onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })} />{key.replace(/([A-Z])/g, " $1")}</label>)}
          </div>
          <p className="mt-2 text-[9px] text-muted-foreground">These controls are the admin UI layer; production-wide enforcement will use the same server-side settings.</p>
        </Card>

        <AdminShop />
        <a href="/" className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back to PitchSide</a>
      </div>
    </main>
  )
}
