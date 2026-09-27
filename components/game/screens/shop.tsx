"use client"

import { useEffect, useState } from "react"
import { Coins, Gem, ShoppingBag, Lock, Play, Sparkles, Crown, Zap, Shield, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Pill, ScreenHeader } from "@/components/game/ui-bits"
import { readWallet, purchaseShopItem, readShopItems, saveWallet, type Wallet } from "@/lib/economy"
import { formatRealMoney, getCountry, readProfile } from "@/lib/locale"
import { readRealMoneyPacks } from "@/lib/shop-pricing"
import { loadClubSquad } from "@/lib/club-squad"
import { grantTrainingBoost, readPlayerTrainingBoost, TRAINING_BOOST_PACKAGES, type TrainingBoostTier } from "@/lib/training-boosts"
import { activateTeamBoost, TEAM_BOOSTS, type TeamBoostDuration, type TeamBoostType } from "@/lib/team-boosts"
import { squad } from "@/components/game/data"

const FREE_CLAIMS_KEY = "pitchside-free-store-claims"
const FREE_COOLDOWN = 30 * 60 * 1000
const FREE_REWARDS = [
  { id: "coin-small", name: "Coin Boost", icon: "🪙", coins: 2500, gems: 0, text: "2,500 Coins" },
  { id: "coin-medium", name: "Gem Boost", icon: "💎", coins: 0, gems: 10, text: "10 Gems" },
  { id: "gem-small", name: "Training Boost", icon: "⚡", coins: 1200, gems: 5, text: "1,200 Coins + 5 Gems" },
  { id: "stamina-boost", name: "Stamina Boost", icon: "🔥", coins: 1800, gems: 0, text: "1,800 Coins" },
]
const BOOST_TYPES: TeamBoostType[] = ["ghost-formation", "team-boost", "captain-boost", "defense-shield", "goalkeeper-boost"]
const BOOST_DURATIONS: TeamBoostDuration[] = ["1-match", "3-matches", "24-hours"]

function readClaims(): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(FREE_CLAIMS_KEY) || "{}")
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch { return {} }
}

function formatCooldown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0")
}

function durationLabel(duration: TeamBoostDuration) {
  return duration === "1-match" ? "1 Match" : duration === "3-matches" ? "3 Matches" : "24 Hours"
}

export function Shop() {
  const [wallet, setWallet] = useState<Wallet>(() => readWallet())
  const [message, setMessage] = useState("")
  const [claims, setClaims] = useState<Record<string, number>>({})
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => loadClubSquad(squad)[0]?.id || "")
  const [boostAd, setBoostAd] = useState<{ tier: TrainingBoostTier; seconds: number } | null>(null)
  const [tab, setTab] = useState<"featured" | "training" | "team" | "currency">("featured")
  const [selectedDuration, setSelectedDuration] = useState<Record<TeamBoostType, TeamBoostDuration>>({
    "ghost-formation": "1-match",
    "team-boost": "3-matches",
    "captain-boost": "1-match",
    "defense-shield": "3-matches",
    "goalkeeper-boost": "24-hours",
  })
  const [, setTick] = useState(0)
  const profile = readProfile()
  const country = getCountry(profile?.countryCode)
  const items = readShopItems().filter((item) => item.enabled)
  const realMoneyPacks = readRealMoneyPacks().filter((pack) => pack.enabled)
  const club = loadClubSquad(squad)
  const selectedPlayer = club.find((p) => p.id === selectedPlayerId)

  useEffect(() => {
    setClaims(readClaims())
    const timer = window.setInterval(() => setTick((v) => v + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const flash = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(""), 2200)
  }

  const claimFree = (reward: typeof FREE_REWARDS[number]) => {
    const now = Date.now()
    const last = Number(claims[reward.id] || 0)
    if (last && now - last < FREE_COOLDOWN) return flash("This reward is still locked.")
    const nextWallet = { coins: wallet.coins + reward.coins, gems: wallet.gems + reward.gems }
    saveWallet(nextWallet)
    const nextClaims = { ...claims, [reward.id]: now }
    localStorage.setItem(FREE_CLAIMS_KEY, JSON.stringify(nextClaims))
    setWallet(nextWallet); setClaims(nextClaims)
    flash(reward.name + " claimed free.")
  }

  const applyTrainingBoost = (tier: TrainingBoostTier) => {
    if (!selectedPlayerId) return flash("Select a player first.")
    const result = grantTrainingBoost(selectedPlayerId, tier)
    flash(`${TRAINING_BOOST_PACKAGES[tier].label} applied instantly to ${selectedPlayer?.name || "player"}.`)
  }

  const buyTrainingBoost = (tier: TrainingBoostTier) => {
    if (!selectedPlayerId) return flash("Select a player first.")
    if (tier === "starter") { setBoostAd({ tier, seconds: 5 }); return }
    if (tier === "power") {
      if (wallet.gems < 30) return flash("Not enough Gems.")
      const next = { ...wallet, gems: wallet.gems - 30 }
      saveWallet(next); setWallet(next); applyTrainingBoost(tier); return
    }
    flash("Payment will open when store billing is connected.")
  }

  useEffect(() => {
    if (!boostAd) return
    if (boostAd.seconds <= 0) { applyTrainingBoost(boostAd.tier); setBoostAd(null); return }
    const id = window.setTimeout(() => setBoostAd((v) => v ? { ...v, seconds: v.seconds - 1 } : null), 1000)
    return () => window.clearTimeout(id)
  }, [boostAd])

  const buyTeamBoost = (type: TeamBoostType) => {
    const duration = selectedDuration[type]
    const price = TEAM_BOOSTS[type].prices[duration]
    if (wallet.gems < price) return flash("Not enough Gems.")
    const next = { ...wallet, gems: wallet.gems - price }
    saveWallet(next); setWallet(next)
    activateTeamBoost(type, duration)
    flash(`${TEAM_BOOSTS[type].name} activated for ${durationLabel(duration)}.`)
  }

  const buy = (id: string) => {
    const result = purchaseShopItem(id)
    setWallet(result.wallet); flash(result.message)
  }

  return (
    <div className="px-4 pb-8 pt-4">
      <ScreenHeader title="Store" subtitle={country.flag + " " + country.name + " · " + country.currency} />
      <div className="mb-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/15 via-card to-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15"><Sparkles className="h-6 w-6 text-primary" /></div>
          <div className="min-w-0 flex-1"><p className="font-display text-lg font-black">PitchSide Store</p><p className="text-[10px] text-muted-foreground">Permanent player upgrades and temporary match boosts.</p></div>
          <Pill accent="cyan">LIVE</Pill>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-2">
        {(["featured", "training", "team", "currency"] as const).map((value) => (
          <Button key={value} size="sm" variant={tab === value ? "default" : "outline"} onClick={() => setTab(value)} className="rounded-xl px-2 text-[10px] capitalize">{value}</Button>
        ))}
      </div>

      {(tab === "featured" || tab === "currency") && <>
        <div className="mb-3 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" /><p className="font-black">Daily Free Rewards</p><Pill accent="cyan">Watch Ad</Pill></div>
        <div className="grid grid-cols-2 gap-3">
          {FREE_REWARDS.map((reward) => {
            const remaining = Math.max(0, FREE_COOLDOWN - (Date.now() - Number(claims[reward.id] || 0)))
            const locked = remaining > 0
            return <Card key={reward.id} className="relative overflow-hidden p-3">
              <div className="absolute right-2 top-2 rounded-full bg-primary/10 px-2 py-1 text-[8px] font-black text-primary">FREE</div>
              <div className="flex h-14 items-center justify-center text-4xl">{reward.icon}</div>
              <p className="mt-2 font-black">{reward.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{reward.text}</p>
              <Button disabled={locked} onClick={() => claimFree(reward)} size="sm" className="mt-3 w-full rounded-xl">{locked ? <><Lock className="mr-1 inline h-3 w-3" />{formatCooldown(remaining)}</> : <><Play className="mr-1 inline h-3 w-3" />Watch Ad</>}</Button>
            </Card>
          })}
        </div>
      </>}

      {(tab === "featured" || tab === "training") && <>
        <div className="mb-3 mt-7 flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /><p className="font-black">Player Training Boosts</p><Pill accent="cyan">Permanent</Pill></div>
        <Card className="mb-3 border-primary/20 bg-primary/5 p-3">
          <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Selected player</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary font-black">{selectedPlayer?.rating ?? "--"}</div>
            <div className="min-w-0 flex-1"><p className="truncate font-black">{selectedPlayer?.name ?? "Select a player"}</p><p className="text-[9px] text-muted-foreground">Permanent and usable immediately.</p></div><Crown className="h-5 w-5 text-amber-300" />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{club.map((player) => {
            const active = player.id === selectedPlayerId
            const boost = readPlayerTrainingBoost(player.id)
            return <button key={player.id} type="button" onClick={() => setSelectedPlayerId(player.id)} className={`min-w-[96px] rounded-xl border px-2 py-2 text-left ${active ? "border-primary bg-primary/15" : "border-border bg-card/60"}`}><p className="truncate text-[10px] font-black">{player.name}</p><p className="text-[9px] text-muted-foreground">{player.pos} · OVR {player.rating + boost.ovr}</p></button>
          })}</div>
        </Card>
        <div className="space-y-3">
          <Card className="p-4"><div className="flex items-center gap-3"><div className="text-xl">⚡</div><div className="flex-1"><p className="font-black">Starter Boost</p><p className="text-[10px] text-muted-foreground">+1 OVR · +1 to 3 random stats</p></div><Button size="sm" onClick={() => buyTrainingBoost("starter")}>Watch Ad</Button></div></Card>
          <Card className="p-4"><div className="flex items-center gap-3"><div className="text-xl">💎</div><div className="flex-1"><p className="font-black">Power Boost</p><p className="text-[10px] text-muted-foreground">+2 OVR · +3 to 3 random stats</p></div><Button size="sm" onClick={() => buyTrainingBoost("power")}>30 Gems</Button></div></Card>
          <Card className="p-4"><div className="flex items-center gap-3"><div className="text-xl">👑</div><div className="flex-1"><p className="font-black">Elite Boost</p><p className="text-[10px] text-muted-foreground">+4 OVR · +5 to 4 random stats</p></div><Button size="sm" onClick={() => buyTrainingBoost("elite")}>$1.25</Button></div></Card>
        </div>
      </>}

      {(tab === "featured" || tab === "team") && <>
        <div className="mb-3 mt-7 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><p className="font-black">Temporary Team Boosts</p><Pill accent="cyan">Match Boosts</Pill></div>
        <p className="mb-3 text-[10px] text-muted-foreground">Each boost has its own effect, duration option and price. Active boosts work in real matches.</p>
        <div className="space-y-3">
          {BOOST_TYPES.map((type) => {
            const item = TEAM_BOOSTS[type]
            const duration = selectedDuration[type]
            return <Card key={type} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl">{item.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-black">{item.name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{item.description}</p>
                  <p className="mt-1 text-[9px] text-primary">{item.effect}</p>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {BOOST_DURATIONS.map((d) => <button key={d} type="button" onClick={() => setSelectedDuration((v) => ({ ...v, [type]: d }))} className={`min-w-[76px] rounded-lg border px-2 py-2 text-center text-[9px] font-black ${duration === d ? "border-primary bg-primary/15" : "border-border"}`}><Timer className="mx-auto mb-1 h-3 w-3" />{durationLabel(d)}<br/><span className="text-primary">{item.prices[d]} Gems</span></button>)}
                  </div>
                  <Button size="sm" className="mt-3 w-full rounded-xl" onClick={() => buyTeamBoost(type)}>Activate · {item.prices[duration]} Gems</Button>
                </div>
              </div>
            </Card>
          })}
        </div>
      </>}

      {(tab === "featured" || tab === "currency") && <>
        <div className="mb-3 mt-7 flex items-center gap-2"><Coins className="h-4 w-4 text-amber-300" /><p className="font-black">Club Currency</p></div>
        <div className="space-y-3">{items.map((item) => <Card key={item.id} className="p-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-xl">{item.icon}</div><div className="min-w-0 flex-1"><p className="font-black">{item.name}</p><p className="text-[10px] text-muted-foreground">{item.description}</p></div><Button size="sm" onClick={() => buy(item.id)} className="shrink-0 rounded-xl px-3">{item.price.toLocaleString()} {item.currency === "gems" ? "Gems" : "Coins"}</Button></div></Card>)}</div>
        <div className="mb-3 mt-7"><p className="font-black">Premium Bundles</p><p className="text-[10px] text-muted-foreground">Prices are shown in your selected currency.</p></div>
        <div className="grid grid-cols-2 gap-3">{realMoneyPacks.map((pack) => <Card key={pack.id} className="p-4"><div className="mb-2 text-2xl">{pack.icon}</div><p className="font-black">{pack.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{pack.description}</p><p className="mt-3 font-display text-lg font-black">{formatRealMoney(pack.usd, profile?.countryCode)}</p><Button size="sm" className="mt-2 w-full rounded-xl" onClick={() => flash("Payment will open when store billing is connected.")}>Purchase</Button></Card>)}</div>
      </>}

      {message && <div className="fixed bottom-5 left-4 right-4 z-50 rounded-2xl border border-primary/30 bg-card p-3 text-center text-xs font-bold shadow-2xl">{message}</div>}
      {boostAd && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"><Card glow="cyan" className="w-full max-w-sm p-5 text-center"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sponsored Boost</p><p className="mt-2 font-display text-xl font-black">Training Boost Ad</p><p className="mt-2 text-sm text-muted-foreground">Boost applies immediately after the ad. {boostAd.seconds}s</p></Card></div>}
    </div>
  )
}
