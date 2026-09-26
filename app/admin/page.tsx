"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Pill, ScreenHeader } from "@/components/game/ui-bits"
import { AdminShop } from "@/components/game/admin-shop"
import { AuctionPlayer, readAuctionPlayers, saveAuctionPlayers } from "@/lib/auction"
import { AuctionDisplaySettings, DEFAULT_AUCTION_DISPLAY, readAuctionDisplay, saveAuctionDisplay } from "@/lib/auction-display"

const emptyPlayer = (): AuctionPlayer => ({
  id: `a-${Date.now()}`, name: "New Player", position: "MID", rating: 80, style: "Balanced", face: "NP",
  attributes: { pace: 80, passing: 80, shooting: 80, defending: 80, stamina: 80 },
  startingBid: 1, currentBid: 1, buyNow: 2, endsAt: Date.now() + 60 * 60 * 1000, enabled: true,
})

export default function AdminPage() {
  const [players, setPlayers] = useState<AuctionPlayer[]>([])
  const [count, setCount] = useState(4)
  const [saved, setSaved] = useState(false)
  const [display, setDisplay] = useState<AuctionDisplaySettings>(DEFAULT_AUCTION_DISPLAY)

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
              <label className="text-[10px] font-bold text-muted-foreground">Starting bid<input type="number" min={0.1} value={player.startingBid} onChange={(e) => update(player.id, { startingBid: Number(e.target.value), currentBid: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
              <label className="text-[10px] font-bold text-muted-foreground">Buy now<input type="number" min={0.1} value={player.buyNow} onChange={(e) => update(player.id, { buyNow: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" /></label>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1">{(Object.keys(player.attributes) as (keyof AuctionPlayer["attributes"])[]).map((key) => <label key={key} className="text-center text-[8px] font-bold uppercase text-muted-foreground">{key}<input type="number" min={1} max={99} value={player.attributes[key]} onChange={(e) => updateAttr(player.id, key, Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-1 py-2 text-center text-[10px]" /></label>)}</div>
            <label className="mt-3 flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={player.enabled} onChange={(e) => update(player.id, { enabled: e.target.checked })} /> Show in auction</label>
          </Card>
        ))}

        <Button variant="outline" onClick={() => setPlayers((current) => [...current, emptyPlayer()])} className="w-full rounded-xl"><Plus className="mr-1 h-4 w-4" /> Add player</Button>
        <AdminShop />
        <a href="/" className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back to PitchSide</a>
      </div>
    </main>
  )
}
