export type Wallet = { bucks: number; gems: number }

export const WALLET_KEY = "pitchside-wallet"
export const DEFAULT_WALLET: Wallet = { bucks: 5000, gems: 100 }

export type MatchWinLevel =
  | "academy" | "league-1" | "league-2" | "league-3" | "league-4" | "premier"
  | "champions" | "super" | "legendary" | "elite" | "hall-of-fame"

export type PromotionReward = { bux: number; gems: number }

export const PROMOTION_REWARDS: Record<MatchWinLevel, PromotionReward> = {
  academy: { bux: 500, gems: 10 }, "league-1": { bux: 600, gems: 15 }, "league-2": { bux: 800, gems: 20 },
  "league-3": { bux: 1000, gems: 20 }, "league-4": { bux: 1300, gems: 30 }, premier: { bux: 1500, gems: 30 },
  champions: { bux: 1800, gems: 50 }, super: { bux: 2000, gems: 60 }, legendary: { bux: 2500, gems: 80 },
  elite: { bux: 2500, gems: 80 }, "hall-of-fame": { bux: 2500, gems: 80 },
}
export function getPromotionReward(level: MatchWinLevel = "academy") { return PROMOTION_REWARDS[level] }

const MATCH_WIN_REWARDS: Record<MatchWinLevel, number> = {
  academy: 500, "league-1": 600, "league-2": 700, "league-3": 800, "league-4": 900, premier: 1000,
  champions: 1100, super: 1200, legendary: 1300, elite: 1400, "hall-of-fame": 1500,
}
export function getMatchWinReward(level: MatchWinLevel = "academy") { return MATCH_WIN_REWARDS[level] }

export function awardMatchWin(level: MatchWinLevel = "academy"): { reward: number; wallet: Wallet } {
  const reward = getMatchWinReward(level); const wallet = readWallet(); const next = { ...wallet, bucks: wallet.bucks + reward }; saveWallet(next); return { reward, wallet: next }
}
export function awardMatchDraw(): { reward: number; wallet: Wallet } {
  const reward = 150; const wallet = readWallet(); const next = { ...wallet, bucks: wallet.bucks + reward }; saveWallet(next); return { reward, wallet: next }
}
export function awardPromotion(level: MatchWinLevel): { reward: PromotionReward; wallet: Wallet } {
  const reward = getPromotionReward(level); const wallet = readWallet(); const next = { bucks: wallet.bucks + reward.bux, gems: wallet.gems + reward.gems }; saveWallet(next); return { reward, wallet: next }
}

export type ShopItem = {
  id: string; name: string; description: string; currency: "gems" | "bucks"; price: number; bucks: number; gems: number; icon: string; enabled: boolean
}
export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: "bucks-small", name: "Bucks Pack", description: "A small Bucks boost for upgrades and auctions.", currency: "gems", price: 25, bucks: 5000, gems: 0, icon: "💰", enabled: true },
  { id: "bucks-medium", name: "Bucks Vault", description: "A larger Bucks boost for your club.", currency: "gems", price: 100, bucks: 20000, gems: 0, icon: "💰", enabled: true },
  { id: "gem-small", name: "Gem Pack", description: "Premium currency for special purchases.", currency: "bucks", price: 6000, bucks: 0, gems: 25, icon: "💎", enabled: true },
  { id: "training-super", name: "Super Training", description: "Start one Super Training session instantly.", currency: "gems", price: 50, bucks: 0, gems: 0, icon: "⚡", enabled: true },
  { id: "stamina-boost", name: "Stamina Boost", description: "A temporary boost for training progression.", currency: "bucks", price: 3000, bucks: 0, gems: 0, icon: "🔥", enabled: true },
]
export const SHOP_KEY = "pitchside-shop"
export function readShopItems(): ShopItem[] {
  if (typeof window === "undefined") return DEFAULT_SHOP_ITEMS
  try { const parsed = JSON.parse(localStorage.getItem(SHOP_KEY) || ""); if (Array.isArray(parsed) && parsed.length) return parsed } catch {}
  return DEFAULT_SHOP_ITEMS
}
export function saveShopItems(items: ShopItem[]) { if (typeof window !== "undefined") localStorage.setItem(SHOP_KEY, JSON.stringify(items)) }
export function readWallet(): Wallet {
  if (typeof window === "undefined") return DEFAULT_WALLET
  try {
    const parsed = JSON.parse(localStorage.getItem(WALLET_KEY) || "")
    if (parsed && Number.isFinite(parsed.gems)) {
      const bucks = Number.isFinite(parsed.bucks) ? parsed.bucks : (Number.isFinite(parsed.coins) ? parsed.coins : DEFAULT_WALLET.bucks)
      return { bucks, gems: parsed.gems }
    }
  } catch {}
  return DEFAULT_WALLET
}
export function saveWallet(wallet: Wallet) { if (typeof window !== "undefined") localStorage.setItem(WALLET_KEY, JSON.stringify(wallet)) }
export function purchaseShopItem(id: string): { success: boolean; wallet: Wallet; message: string } {
  const item = readShopItems().find((entry) => entry.id === id && entry.enabled); const wallet = readWallet()
  if (!item) return { success: false, wallet, message: "Item unavailable." }
  const balance = wallet[item.currency]; if (balance < item.price) return { success: false, wallet, message: "Not enough currency." }
  const next = { ...wallet, [item.currency]: balance - item.price, bucks: wallet.bucks + item.bucks, gems: wallet.gems + item.gems }
  saveWallet(next); return { success: true, wallet: next, message: item.name + " purchased." }
}