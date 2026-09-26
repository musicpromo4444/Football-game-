"use client"

import { useState } from "react"
import { Coins, Gem, ShoppingBag, Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Pill, ScreenHeader } from "@/components/game/ui-bits"
import { readWallet, purchaseShopItem, SHOP_ITEMS, type Wallet } from "@/lib/economy"

export function Shop() {
  const [wallet, setWallet] = useState<Wallet>(() => readWallet())
  const [message, setMessage] = useState("")
  const buy = (id: string) => {
    const result = purchaseShopItem(id)
    setWallet(result.wallet)
    setMessage(result.message)
    window.setTimeout(() => setMessage(""), 1800)
  }
  return (
    <div className="px-4 pb-6 pt-4">
      <ScreenHeader title="Shop" subtitle="Build your club without breaking the economy." />
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Card className="p-3"><div className="flex items-center gap-2"><Coins className="h-4 w-4 text-amber-300" /><div><p className="text-[9px] text-muted-foreground">Coins</p><p className="font-black">{wallet.coins.toLocaleString()}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Gem className="h-4 w-4 text-primary" /><div><p className="text-[9px] text-muted-foreground">Gems</p><p className="font-black">{wallet.gems.toLocaleString()}</p></div></div></Card>
      </div>
      {message && <div className="mb-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-xs font-bold text-primary"><Check className="mr-1 inline h-3 w-3" />{message}</div>}
      <div className="mb-3 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" /><p className="font-black">Club Shop</p><Pill accent="cyan">Fair pricing</Pill></div>
      <div className="space-y-3">
        {SHOP_ITEMS.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-2xl">{item.icon}</div>
              <div className="min-w-0 flex-1"><p className="font-black">{item.name}</p><p className="text-[10px] text-muted-foreground">{item.description}</p></div>
              <Button size="sm" onClick={() => buy(item.id)} className="shrink-0 rounded-xl px-3">{item.price.toLocaleString()} {item.currency === "gems" ? "Gems" : "Coins"}</Button>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-card/50 p-3 text-[10px] text-muted-foreground"><Zap className="mr-1 inline h-3 w-3 text-primary" />Shop prices are currently balanced against the existing auction, training and squad-upgrade costs. Real-money gem packs can be added later.</div>
    </div>
  )
}
