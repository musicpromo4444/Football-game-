"use client"

import { useEffect, useState } from "react"
import { Coins, Gem, ShoppingBag, Check, Play, Lock, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Pill, ScreenHeader } from "@/components/game/ui-bits"
import { readWallet, purchaseShopItem, readShopItems, saveWallet, type Wallet } from "@/lib/economy"
import { formatRealMoney, getCountry, readProfile } from "@/lib/locale"
import { readRealMoneyPacks } from "@/lib/shop-pricing"

const FREE_CLAIMS_KEY = "pitchside-free-store-claims"
const FREE_COOLDOWN = 30 * 60 * 1000
const FREE_REWARDS = [
  { id: "coin-small", name: "Coin Boost", icon: "🪙", coins: 2500, gems: 0, text: "2,500 Coins" },
  { id: "coin-medium", name: "Gem Boost", icon: "💎", coins: 0, gems: 10, text: "10 Gems" },
  { id: "gem-small", name: "Training Boost", icon: "⚡", coins: 1200, gems: 5, text: "1,200 Coins + 5 Gems" },
  { id: "stamina-boost", name: "Stamina Boost", icon: "🔥", coins: 1800, gems: 0, text: "1,800 Coins" },
]

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

export function Shop() {
  const [wallet, setWallet] = useState<Wallet>(() => readWallet())
  const [message, setMessage] = useState("")
  const [claims, setClaims] = useState<Record<string, number>>({})
  const [, setTick] = useState(0)
  const profile = readProfile()
  const country = getCountry(profile?.countryCode)
  const items = readShopItems().filter((item) => item.enabled)
  const realMoneyPacks = readRealMoneyPacks().filter((pack) => pack.enabled)

  useEffect(() => {
    setClaims(readClaims())
    const timer = window.setInterval(() => setTick((v) => v + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const claimFree = (reward: typeof FREE_REWARDS[number]) => {
    const now = Date.now()
    const last = Number(claims[reward.id] || 0)
    if (last && now - last < FREE_COOLDOWN) {
      setMessage("This reward is still locked.")
      return
    }
    const nextWallet = { coins: wallet.coins + reward.coins, gems: wallet.gems + reward.gems }
    saveWallet(nextWallet)
    const nextClaims = { ...claims, [reward.id]: now }
    localStorage.setItem(FREE_CLAIMS_KEY, JSON.stringify(nextClaims))
    setWallet(nextWallet)
    setClaims(nextClaims)
    setMessage(reward.name + " claimed free.")
    window.setTimeout(() => setMessage(""), 1800)
  }

  const buy = (id: string) => {
    const result = purchaseShopItem(id)
    setWallet(result.wallet)
    setMessage(result.message)
    window.setTimeout(() => setMessage(""), 1800)
  }

  return (
    <div className="px-4 pb-8 pt-4">
      <ScreenHeader title="Store" subtitle={country.flag + " " + country.name + " · " + country.currency} />
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Card className="p-3"><div className="flex items-center gap-2"><Coins className="h-4 w-4 text-amber-300" /><div><p className="text-[9px] text-muted-foreground">Coins</p><p className="font-black">{wallet.coins.toLocaleString()}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Gem className="h-4 w-4 text-primary" /><div><p className="text-[9px] text-muted-foreground">Gems</p><p className="font-black">{wallet.gems.toLocaleString()}</p></div></div></Card>
      </div>
      {message && <div className="mb-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-xs font-bold text-primary"><Check className="mr-1 inline h-3 w-3" />{message}</div>}

      <div className="mb-3 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" /><p className="font-black">Free Rewards</p><Pill accent="cyan">Watch Ad</Pill></div>
      <p className="mb-3 text-[10px] text-muted-foreground">Four different free items. Each card unlocks again 30 minutes after its own ad reward.</p>
      <div className="grid grid-cols-2 gap-3">
        {FREE_REWARDS.map((reward) => {
          const remaining = Math.max(0, FREE_COOLDOWN - (Date.now() - Number(claims[reward.id] || 0)))
          const locked = remaining > 0
          return (
            <Card key={reward.id} className="relative overflow-hidden p-3">
              <div className="absolute right-2 top-2 rounded-full bg-primary/10 px-2 py-1 text-[8px] font-black text-primary">FREE</div>
              <div className="flex h-16 items-center justify-center text-5xl">{reward.icon}</div>
              <p className="mt-2 font-black">{reward.name}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{reward.text}</p>
              <Button disabled={locked} onClick={() => claimFree(reward)} size="sm" className="mt-3 w-full rounded-xl">
                {locked ? <><Lock className="mr-1 inline h-3 w-3" />{formatCooldown(remaining)}</> : <><Play className="mr-1 inline h-3 w-3" />Watch Ad</>}
              </Button>
              {locked && <p className="mt-1 flex items-center justify-center gap-1 text-[8px] text-muted-foreground"><Timer className="h-3 w-3" />30 min cooldown</p>}
            </Card>
          )
        })}
      </div>

      <div className="mb-3 mt-7 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" /><p className="font-black">Club Store</p><Pill accent="cyan">Admin controlled</Pill></div>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-2xl">{item.icon}</div>
              <div className="min-w-0 flex-1"><p className="font-black">{item.name}</p><p className="text-[10px] text-muted-foreground">{item.description}</p></div>
              <Button size="sm" onClick={() => buy(item.id)} className="shrink-0 rounded-xl px-3">{item.price.toLocaleString()} {item.currency === "gems" ? "Gems" : "Coins"}</Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-3 mt-7"><p className="font-black">Premium Store</p><p className="text-[10px] text-muted-foreground">Real-money bundles use your selected country.</p></div>
      <div className="grid grid-cols-2 gap-3">
        {realMoneyPacks.map((pack) => (
          <Card key={pack.id} className="p-4">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">{pack.icon}</div>
            <p className="font-black">{pack.name}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{pack.description}</p>
            <p className="mt-3 font-display text-lg font-black">{formatRealMoney(pack.usd, profile?.countryCode)}</p>
            <Button size="sm" className="mt-2 w-full rounded-xl" onClick={() => setMessage("Payment will open when store billing is connected.")}>Purchase</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
