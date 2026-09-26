"use client"

export type AuctionDisplaySettings = {
  enabled: boolean
  icon: string
  title: string
  writeUp: string
}

export const AUCTION_DISPLAY_KEY = "pitchside-auction-display"

export const DEFAULT_AUCTION_DISPLAY: AuctionDisplaySettings = {
  enabled: true,
  icon: "⚽",
  title: "Transfer Auction",
  writeUp: "Bid for special players before the auction closes.",
}

export function readAuctionDisplay(): AuctionDisplaySettings {
  if (typeof window === "undefined") return DEFAULT_AUCTION_DISPLAY
  try {
    return { ...DEFAULT_AUCTION_DISPLAY, ...(JSON.parse(localStorage.getItem(AUCTION_DISPLAY_KEY) || "null") || {}) }
  } catch {
    return DEFAULT_AUCTION_DISPLAY
  }
}

export function saveAuctionDisplay(settings: AuctionDisplaySettings) {
  if (typeof window !== "undefined") localStorage.setItem(AUCTION_DISPLAY_KEY, JSON.stringify(settings))
}
