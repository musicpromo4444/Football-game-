export type RealMoneyPack = { id: string; name: string; description: string; icon: string; gems: number; bucks: number; usd: number; enabled: boolean }

export const REAL_MONEY_KEY = "pitchside-real-money-shop"

export const DEFAULT_REAL_MONEY_PACKS: RealMoneyPack[] = [
  { id: "gems-100", name: "100 Gems", description: "Premium currency for your club.", icon: "💎", gems: 100, bucks: 0, usd: 0.99, enabled: true },
  { id: "gems-550", name: "550 Gems", description: "A bigger gem bundle.", icon: "💎", gems: 550, bucks: 0, usd: 4.99, enabled: true },
  { id: "coins-25k", name: "25,000 Bucks", description: "Build your club faster.", icon: "💰", gems: 0, bucks: 25000, usd: 2.99, enabled: true },
  { id: "coins-120k", name: "120,000 Bucks", description: "A major club fund.", icon: "💰", gems: 0, bucks: 120000, usd: 9.99, enabled: true },
]

export function readRealMoneyPacks(): RealMoneyPack[] {
  if (typeof window === "undefined") return DEFAULT_REAL_MONEY_PACKS
  try {
    const parsed = JSON.parse(localStorage.getItem(REAL_MONEY_KEY) || "")
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {}
  return DEFAULT_REAL_MONEY_PACKS
}

export function saveRealMoneyPacks(packs: RealMoneyPack[]) {
  if (typeof window !== "undefined") localStorage.setItem(REAL_MONEY_KEY, JSON.stringify(packs))
}
