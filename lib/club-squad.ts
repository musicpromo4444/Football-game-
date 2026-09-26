"use client"

import type { Player } from "@/components/game/data"
import type { AuctionPlayer } from "@/lib/auction"

export const MAX_SQUAD_SIZE = 24
export const CLUB_SQUAD_KEY = "pitchside-club-squad"

export function auctionToPlayer(player: AuctionPlayer): Player {
  const role: Player["style"] =
    player.position === "GK" ? "Sweeper Keeper" :
    player.position === "DEF" ? "Ball-Playing Defender" :
    player.position === "MID" ? "Mezzala" : "Advanced Forward"

  return {
    id: "auction-" + player.id,
    name: player.name,
    pos: player.position,
    rating: player.rating,
    stamina: player.attributes.stamina,
    style: role,
  }
}

export function loadClubSquad(base: Player[]): Player[] {
  if (typeof window === "undefined") return base
  try {
    const saved = JSON.parse(localStorage.getItem(CLUB_SQUAD_KEY) || "null")
    if (!Array.isArray(saved)) return base
    const extras = saved.filter((p) => p && typeof p.id === "string" && p.id.startsWith("auction-"))
    return [...base, ...extras].slice(0, MAX_SQUAD_SIZE)
  } catch {
    return base
  }
}

export function saveClubSquad(players: Player[]) {
  if (typeof window !== "undefined") {
    const extras = players.filter((p) => p.id.startsWith("auction-"))
    localStorage.setItem(CLUB_SQUAD_KEY, JSON.stringify(extras))
  }
}

export function addAuctionPlayer(base: Player[], player: AuctionPlayer): { squad: Player[]; added: boolean } {
  const current = loadClubSquad(base)
  if (current.some((p) => p.id === "auction-" + player.id)) return { squad: current, added: false }
  if (current.length >= MAX_SQUAD_SIZE) return { squad: current, added: false }
  const next = [...current, auctionToPlayer(player)]
  saveClubSquad(next)
  return { squad: next, added: true }
}
