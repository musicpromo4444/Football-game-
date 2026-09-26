export type Wallet = { coins: number; gems: number }

export const WALLET_KEY = "pitchside-wallet"
export const DEFAULT_WALLET: Wallet = { coins: 18420, gems: 340 }

export const SHOP_ITEMS = [
  { id: "coin-small", name: "Coin Pack", description: "A small coin boost for upgrades and auctions.", currency: "gems" as const, price: 25, coins: 2500, gems: 0, icon: "🪙" },
  { id: "coin-medium", name: "Coin Vault", description: "More coins for building your squad.", currency: "gems" as const, price: 80, coins: 10000, gems: 0, icon: "💰" },
  { id: "gem-small", name: "Gem Pack", description: "Premium currency for special purchases.", currency: "coins" as const, price: 5000, coins: 0, gems: 25, icon: "💎" },
  { id: "training-super", name: "Super Training", description: "Start one Super Training session instantly.", currency: "gems" as const, price: 50, coins: 0, gems: 0, icon: "⚡" },
  { id: "stamina-boost", name: "Stamina Boost", description: "A temporary boost for training progression.", currency: "coins" as const, price: 3000, coins: 0, gems: 0, icon: "🔥" },
] as const

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
  const item = SHOP_ITEMS.find((entry) => entry.id === id)
  const wallet = readWallet()
  if (!item) return { success: false, wallet, message: "Item unavailable." }
  const balance = wallet[item.currency]
  if (balance < item.price) return { success: false, wallet, message: "Not enough currency." }
  const next = { ...wallet, [item.currency]: balance - item.price, coins: wallet.coins + item.coins, gems: wallet.gems + item.gems }
  saveWallet(next)
  return { success: true, wallet: next, message: item.name + " purchased." }
}
