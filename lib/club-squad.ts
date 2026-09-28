"use client"

import type { Player } from "@/components/game/data"
import { playerPool } from "@/components/game/data"
import type { AuctionPlayer } from "@/lib/auction"
import { readWallet, saveWallet } from "@/lib/economy"

export const SQUAD_CAPACITIES = [24, 32, 50] as const
export const SQUAD_UPGRADE_GEMS = [0, 250, 600] as const
export const MAX_SQUAD_SIZE = 50
export const CLUB_SQUAD_KEY = "pitchside-club-squad"
export const SQUAD_CAPACITY_KEY = "pitchside-squad-capacity"

function allStarterPlayers(base: Player[]): Player[] {
  const combined = [...base, ...playerPool]
  return Array.from(new Map(combined.map((player) => [player.id, player])).values())
}

function shufflePlayers(players: Player[]): Player[] {
  const result = [...players]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

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

  const starterPool = allStarterPlayers(base)

  try {
    const saved = JSON.parse(localStorage.getItem(CLUB_SQUAD_KEY) || "null")

    // First launch: give this user their own random 24-player collection
    // from the 48-player master pool, then persist that exact collection.
    if (!saved || !Array.isArray(saved) && !Array.isArray(saved.baseIds)) {
      const starting = shufflePlayers(starterPool).slice(0, Math.min(24, getSquadCapacity()))
      localStorage.setItem(
        CLUB_SQUAD_KEY,
        JSON.stringify({ baseIds: starting.map((player) => player.id), auctionPlayers: [] }),
      )
      return starting
    }

    // New collection format: base player IDs belong to this user; auction
    // players are persisted separately because they are generated dynamically.
    if (!Array.isArray(saved) && Array.isArray(saved.baseIds)) {
      const ownedBase = saved.baseIds
        .map((id: unknown) => starterPool.find((player) => player.id === id))
        .filter((player): player is Player => Boolean(player))

      const auctionPlayers = Array.isArray(saved.auctionPlayers)
        ? saved.auctionPlayers.filter((player: Player) => player && typeof player.id === "string")
        : []

      return [...ownedBase, ...auctionPlayers].slice(0, getSquadCapacity())
    }

    // Migrate the previous auction-only storage format without giving every
    // user the same 24 base players.
    if (Array.isArray(saved)) {
      const starting = shufflePlayers(starterPool).slice(0, Math.min(24, getSquadCapacity()))
      const auctionPlayers = saved.filter((p) => p && typeof p.id === "string" && p.id.startsWith("auction-"))
      localStorage.setItem(
        CLUB_SQUAD_KEY,
        JSON.stringify({ baseIds: starting.map((player) => player.id), auctionPlayers }),
      )
      return [...starting, ...auctionPlayers].slice(0, getSquadCapacity())
    }

    return []
  } catch {
    const starting = shufflePlayers(starterPool).slice(0, Math.min(24, getSquadCapacity()))
    try {
      localStorage.setItem(
        CLUB_SQUAD_KEY,
        JSON.stringify({ baseIds: starting.map((player) => player.id), auctionPlayers: [] }),
      )
    } catch {}
    return starting
  }
}

export function saveClubSquad(players: Player[]) {
  if (typeof window !== "undefined") {
    const baseIds = players
      .filter((p) => !p.id.startsWith("auction-"))
      .map((p) => p.id)
    const auctionPlayers = players.filter((p) => p.id.startsWith("auction-"))
    localStorage.setItem(CLUB_SQUAD_KEY, JSON.stringify({ baseIds, auctionPlayers }))
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
