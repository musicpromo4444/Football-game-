"use client"

export type AuctionPosition = "GK" | "DEF" | "MID" | "FWD"

export type AuctionAttributes = {
  pace: number
  passing: number
  shooting: number
  defending: number
  stamina: number
}

export type AuctionPlayer = {
  id: string
  name: string
  position: AuctionPosition
  rating: number
  style: string
  face: string
  attributes: AuctionAttributes
  startingBid: number
  currentBid: number
  buyNow: number
  endsAt: number
  enabled: boolean
}

export const DEFAULT_AUCTION_PLAYERS: AuctionPlayer[] = [
  { id: "a1", name: "T. Bergström", position: "FWD", rating: 89, style: "Fluid Front Three", face: "TB", attributes: { pace: 91, passing: 82, shooting: 94, defending: 42, stamina: 86 }, startingBid: 4.2, currentBid: 4.2, buyNow: 7.5, endsAt: Date.now() + 2 * 60 * 1000, enabled: true },
  { id: "a2", name: "O. Diallo", position: "MID", rating: 87, style: "Gegenpress", face: "OD", attributes: { pace: 84, passing: 92, shooting: 78, defending: 76, stamina: 91 }, startingBid: 3.1, currentBid: 3.1, buyNow: 5.8, endsAt: Date.now() + 9 * 60 * 1000, enabled: true },
  { id: "a3", name: "V. Rossi", position: "DEF", rating: 84, style: "Catenaccio", face: "VR", attributes: { pace: 72, passing: 79, shooting: 48, defending: 94, stamina: 82 }, startingBid: 1.9, currentBid: 1.9, buyNow: 3.4, endsAt: Date.now() + 14 * 60 * 1000, enabled: true },
  { id: "a4", name: "S. Haruki", position: "GK", rating: 82, style: "Sweeper Keeper", face: "SH", attributes: { pace: 61, passing: 83, shooting: 25, defending: 91, stamina: 78 }, startingBid: 1.2, currentBid: 1.2, buyNow: 2.6, endsAt: Date.now() + 21 * 60 * 1000, enabled: true },
]

export const AUCTION_KEY = "pitchside-auction-players"
export const AUCTION_WALLET_KEY = "pitchside-wallet"

export function readAuctionPlayers(): AuctionPlayer[] {
  if (typeof window === "undefined") return DEFAULT_AUCTION_PLAYERS
  try {
    const saved = JSON.parse(localStorage.getItem(AUCTION_KEY) || "null")
    return Array.isArray(saved) ? saved : DEFAULT_AUCTION_PLAYERS
  } catch {
    return DEFAULT_AUCTION_PLAYERS
  }
}

export function saveAuctionPlayers(players: AuctionPlayer[]) {
  if (typeof window !== "undefined") localStorage.setItem(AUCTION_KEY, JSON.stringify(players))
}

export function formatAuctionTime(endsAt: number, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const m = Math.floor(seconds / 60).toString().padStart(2, "0")
  const s = (seconds % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}
