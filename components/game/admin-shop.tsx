"use client"

import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Pill } from "@/components/game/ui-bits"
import { DEFAULT_SHOP_ITEMS, readShopItems, saveShopItems, type ShopItem } from "@/lib/economy"
import { DEFAULT_REAL_MONEY_PACKS, readRealMoneyPacks, saveRealMoneyPacks, type RealMoneyPack } from "@/lib/shop-pricing"

export function AdminShop() {
  const [items, setItems] = useState<ShopItem[]>(DEFAULT_SHOP_ITEMS)
  const [packs, setPacks] = useState<RealMoneyPack[]>(DEFAULT_REAL_MONEY_PACKS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setItems(readShopItems())
    setPacks(readRealMoneyPacks())
  }, [])

  const save = () => {
    saveShopItems(items)
    saveRealMoneyPacks(packs)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <>
      <Card glow="emerald" className="p-4">
        <div className="flex items-center justify-between">
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Club Shop</p><p className="font-bold">In-game items & prices</p></div>
          <Pill accent="emerald">Admin</Pill>
        </div>
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={item.enabled} onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, enabled: e.target.checked } : x))} />
                <span className="text-lg">{item.icon}</span>
                <input value={item.name} onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, name: e.target.value } : x))} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold" />
                <input type="number" min={1} value={item.price} onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, price: Math.max(1, Number(e.target.value)) } : x))} className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-right text-xs font-bold" />
                <span className="text-[9px] uppercase text-muted-foreground">{item.currency}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input value={item.description} onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, description: e.target.value } : x))} className="rounded-lg border border-border bg-background px-2 py-1.5 text-[10px]" />
                <select value={item.currency} onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, currency: e.target.value as ShopItem["currency"] } : x))} className="rounded-lg border border-border bg-background px-2 py-1.5 text-[10px]"><option value="gems">Gems</option><option value="coins">Coins</option></select>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Premium Shop</p><p className="font-bold">Base USD prices</p></div><Pill accent="cyan">Localized at checkout</Pill></div>
        <div className="mt-3 space-y-3">
          {packs.map((pack) => (
            <div key={pack.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={pack.enabled} onChange={(e) => setPacks(packs.map((x) => x.id === pack.id ? { ...x, enabled: e.target.checked } : x))} />
                <span className="text-lg">{pack.icon}</span>
                <input value={pack.name} onChange={(e) => setPacks(packs.map((x) => x.id === pack.id ? { ...x, name: e.target.value } : x))} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold" />
                <input type="number" min={0.01} step={0.01} value={pack.usd} onChange={(e) => setPacks(packs.map((x) => x.id === pack.id ? { ...x, usd: Math.max(0.01, Number(e.target.value)) } : x))} className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-right text-xs font-bold" />
                <span className="text-xs">$</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{pack.gems ? pack.gems.toLocaleString() + " Gems" : pack.coins.toLocaleString() + " Coins"}</p>
            </div>
          ))}
        </div>
        <Button onClick={save} className="mt-4 w-full rounded-xl"><Save className="mr-1 h-4 w-4" />{saved ? "Saved" : "Save shop settings"}</Button>
      </Card>
    </>
  )
}
