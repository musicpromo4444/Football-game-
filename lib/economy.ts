export type Wallet = { coins: number; gems: number }

export const WALLET_KEY = "pitchside-wallet"
export const DEFAULT_WALLET: Wallet = { coins: 18420, gems: 340 }

export type ShopItem = {
  id: string
  name: string
  description: string
  currency: "gems" | "coins"
  price: number
  coins: number
  gems: number
  icon: string
  enabled: boolean
}

export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: "coin-small", name: "Coin Pack", description: "A small coin boost for upgrades and auctions.", currency: "gems", price: 25, coins: 5000, gems: 0, icon: "🪙", enabled: true },
  { id: "coin-medium", name: "Coin Vault", description: "A larger coin boost for your club.", currency: "gems", price: 100, coins: 20000, gems: 0, icon: "💰", enabled: true },
  { id: "gem-small", name: "Gem Pack", description: "Premium currency for special purchases.", currency: "coins", price: 6000, coins: 0, gems: 25, icon: "💎", enabled: true },
  { id: "training-super", name: "Super Training", description: "Start one Super Training session instantly.", currency: "gems", price: 50, coins: 0, gems: 0, icon: "⚡", enabled: true },
  { id: "stamina-boost", name: "Stamina Boost", description: "A temporary boost for training progression.", currency: "coins", price: 3000, coins: 0, gems: 0, icon: "🔥", enabled: true },
]

export const SHOP_KEY = "pitchside-shop"

export function readShopItems(): ShopItem[] {
  if (typeof window === "undefined") return DEFAULT_SHOP_ITEMS
  try {
    const parsed = JSON.parse(localStorage.getItem(SHOP_KEY) || "")
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {}
  return DEFAULT_SHOP_ITEMS
}

export function saveShopItems(items: ShopItem[]) {
  if (typeof window !== "undefined") localStorage.setItem(SHOP_KEY, JSON.stringify(items))
}

export function readWallet(): Wallet {
  if (typeof window === "undefined") return DEFAULT_WALLET
  try {
    const parsed = JSON.parse(localStorage.getItem(WALLET_KEY) || "")
    if (parsed && Number.isFinite(parsed.coins) && Number.isFinite(parsed.gems)) return parsed
  } catch {}
  return DEFAULT_WALLET
}

export function saveWallet(wallet: Wallet) {
  if (typeof window !== "undefined") localStorage.setItem(WALLET_KEY, JSON.stringify(wallet))
}

export function purchaseShopItem(id: string): { success: boolean; wallet: Wallet; message: string } {
  const item = readShopItems().find((entry) => entry.id === id && entry.enabled)
  const wallet = readWallet()
  if (!item) return { success: false, wallet, message: "Item unavailable." }
  const balance = wallet[item.currency]
  if (balance < item.price) return { success: false, wallet, message: "Not enough currency." }
  const next = { ...wallet, [item.currency]: balance - item.price, coins: wallet.coins + item.coins, gems: wallet.gems + item.gems }
  saveWallet(next)
  return { success: true, wallet: next, message: item.name + " purchased." }
}
