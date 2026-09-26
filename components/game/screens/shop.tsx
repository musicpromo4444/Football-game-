"use client"

import { useState } from "react"
import { Coins, Gem, ShoppingBag, Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Pill, ScreenHeader } from "@/components/game/ui-bits"
import { readWallet, purchaseShopItem, readShopItems, type Wallet } from "@/lib/economy"
import { formatRealMoney, getCountry, readProfile } from "@/lib/locale"
import { readRealMoneyPacks } from "@/lib/shop-pricing"

export function Shop() {
  const [wallet, setWallet] = useState<Wallet>(() => readWallet())
  const [message, setMessage] = useState("")
  const profile = readProfile()
  const country = getCountry(profile?.countryCode)
  const items = readShopItems().filter((item) => item.enabled)
  const realMoneyPacks = readRealMoneyPacks().filter((pack) => pack.enabled)

  const buy = (id: string) => {
    const result = purchaseShopItem(id)
    setWallet(result.wallet)
    setMessage(result.message)
    window.setTimeout(() => setMessage(""), 1800)
  }

  return (
    <div className="px-4 pb-6 pt-4">
      <ScreenHeader title="Shop" subtitle={country.flag + " " + country.name + " · prices shown in " + country.currency} />
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Card className="p-3"><div className="flex items-center gap-2"><Coins className="h-4 w-4 text-amber-300" /><div><p className="text-[9px] text-muted-foreground">Coins</p><p className="font-black">{wallet.coins.toLocaleString()}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Gem className="h-4 w-4 text-primary" /><div><p className="text-[9px] text-muted-foreground">Gems</p><p className="font-black">{wallet.gems.toLocaleString()}</p></div></div></Card>
      </div>
      {message && <div className="mb-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-xs font-bold text-primary"><Check className="mr-1 inline h-3 w-3" />{message}</div>}

      <div className="mb-3 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" /><p className="font-black">Club Shop</p><Pill accent="cyan">Admin controlled</Pill></div>
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

      <div className="mb-3 mt-6 flex items-center justify-between"><div><p className="font-black">Premium Shop</p><p className="text-[10px] text-muted-foreground">Real-money bundles use your selected country.</p></div><span className="text-xl">{country.flag}</span></div>
      <div className="grid grid-cols-2 gap-3">
        {realMoneyPacks.map((pack) => (
          <Card key={pack.id} className="p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">{pack.icon}</div>
            <p className="font-black">{pack.name}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{pack.description}</p>
            <p className="mt-3 font-display text-lg font-black">{formatRealMoney(pack.usd, profile?.countryCode)}</p>
            <Button size="sm" className="mt-2 w-full rounded-xl" onClick={() => setMessage("Payment will open when store billing is connected.")}>Purchase</Button>
          </Card>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card/50 p-3 text-[10px] text-muted-foreground"><Zap className="mr-1 inline h-3 w-3 text-primary" />Admin controls the shop inventory and base prices. Android/iOS store billing can apply the platform's final local checkout price.</div>
    </div>
  )
}
