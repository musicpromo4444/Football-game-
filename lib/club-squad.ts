"use client"

import type { Player } from "@/components/game/data"
import type { AuctionPlayer } from "@/lib/auction"
import { readWallet, saveWallet } from "@/lib/economy"

export const SQUAD_CAPACITIES = [24, 32, 50] as const
export const SQUAD_UPGRADE_GEMS = [0, 250, 600] as const
export const MAX_SQUAD_SIZE = 50
export const CLUB_SQUAD_KEY = "pitchside-club-squad"
export const SQUAD_CAPACITY_KEY = "pitchside-squad-capacity"

export function getSquadCapacity(): number {
  if (typeof window === "undefined") return 24
  const saved = Number(localStorage.getItem(SQUAD_CAPACITY_KEY) || 24)
  return SQUAD_CAPACITIES.includes(saved as 24 | 32 | 50) ? saved : 24
}

export function upgradeSquadCapacity(): { success: boolean; capacity: number; cost: number } {
  if (typeof window === "undefined") return { success: false, capacity: 24, cost: 0 }
  const current = getSquadCapacity()
  const index = SQUAD_CAPACITIES.indexOf(current as 24 | 32 | 50)
  if (index < 0 || index >= SQUAD_CAPACITIES.length - 1) return { success: false, capacity: current, cost: 0 }
  const next = SQUAD_CAPACITIES[index + 1]
  const cost = SQUAD_UPGRADE_GEMS[index + 1]
  const wallet = readWallet()
  if (wallet.gems < cost) return { success: false, capacity: current, cost }
  saveWallet({ ...wallet, gems: wallet.gems - cost })
  localStorage.setItem(SQUAD_CAPACITY_KEY, String(next))
  return { success: true, capacity: next, cost }
}

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
    number: player.number,
    face: player.face,
    look: player.look,
    height: player.height,
    attributes: { ...player.attributes },
  }
}

export function loadClubSquad(base: Player[]): Player[] {
  if (typeof window === "undefined") return base
  try {
    const saved = JSON.parse(localStorage.getItem(CLUB_SQUAD_KEY) || "null")
    if (!Array.isArray(saved)) return base
    const extras = saved.filter((p) => p && typeof p.id === "string" && p.id.startsWith("auction-"))
    return [...base, ...extras].slice(0, getSquadCapacity())
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
  const current = base.length ? base : loadClubSquad(base)
  if (current.some((p) => p.id === "auction-" + player.id)) return { squad: current, added: false }
  if (current.length >= getSquadCapacity()) return { squad: current, added: false }
  const next = [...current, auctionToPlayer(player)]
  saveClubSquad(next)
  return { squad: next, added: true }
}
