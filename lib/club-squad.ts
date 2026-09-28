"use client"

import type { Player } from "@/components/game/data"
import { playerPool, specialPlayers } from "@/components/game/data"
import type { AuctionPlayer } from "@/lib/auction"
import { readWallet, saveWallet } from "@/lib/economy"

export const SQUAD_CAPACITIES = [24, 32, 50] as const
export const SQUAD_UPGRADE_GEMS = [0, 250, 600] as const
export const MAX_SQUAD_SIZE = 50
export const CLUB_SQUAD_KEY = "pitchside-club-squad"
export const SQUAD_CAPACITY_KEY = "pitchside-squad-capacity"
export const PLAYER_PROFILE_KEY = "pitchside-anonymous-profile"

// Login is intentionally disabled during testing. This creates a stable local
// profile ID now, so the collection is already isolated per player. When the
// real Google/Apple account system is added, this ID can be replaced by the
// authenticated account ID without changing the squad format.
export function getPlayerProfileId(): string {
  if (typeof window === "undefined") return "anonymous"
  const existing = localStorage.getItem(PLAYER_PROFILE_KEY)
  if (existing) return existing
  const generated = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(PLAYER_PROFILE_KEY, generated)
  return generated
}

function profileStorageKey(key: string): string {
  return `${key}:${getPlayerProfileId()}`
}

const SPECIAL_CLAIMS_KEY = "pitchside-special-player-claims"

const SPECIAL_NAMES = [
  "Bruno", "Bellingham", "Kairo", "Milan", "Dario", "Malik", "Thiago", "Rafael",
  "Jonas", "Amari", "Nico", "Soren", "Mateo", "Luka", "Andre", "Isaac",
  "Tariq", "Elian", "Marco", "Leon", "Kenji", "Adrian", "Noah", "Samir",
]

const SPECIAL_COLOURS = [
  "Crimson", "Royal Blue", "Emerald", "Gold", "Violet", "Ice", "Orange", "Obsidian",
  "Silver", "Neon Green", "Sky Blue", "Magenta",
]

const SPECIAL_FACE_IDS = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64]

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomHeight(role: Player["pos"]): number {
  if (role === "GK") return 186 + Math.floor(Math.random() * 13)
  if (role === "DEF") return 180 + Math.floor(Math.random() * 15)
  if (role === "MID") return 172 + Math.floor(Math.random() * 14)
  return 175 + Math.floor(Math.random() * 18)
}

function readSpecialClaims(): Record<string, Player> {
  if (typeof window === "undefined") return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(profileStorageKey(SPECIAL_CLAIMS_KEY)) || "{}")
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function saveSpecialClaims(claims: Record<string, Player>) {
  localStorage.setItem(profileStorageKey(SPECIAL_CLAIMS_KEY), JSON.stringify(claims))
}

/** Claims one fixed special template and gives this profile a unique identity for it. */
export function claimSpecialPlayer(templateId: string): { player: Player | null; alreadyClaimed: boolean; message: string } {
  if (typeof window === "undefined") return { player: null, alreadyClaimed: false, message: "Open the game first." }

  const template = specialPlayers.find((item) => item.id === templateId)
  if (!template) return { player: null, alreadyClaimed: false, message: "Special player not found." }

  const claims = readSpecialClaims()
  if (claims[templateId]) return { player: claims[templateId], alreadyClaimed: true, message: "Already claimed." }

  const usedNames = new Set(Object.values(claims).map((player) => player.name))
  const availableNames = SPECIAL_NAMES.filter((name) => !usedNames.has(name))
  const name = randomFrom(availableNames.length ? availableNames : SPECIAL_NAMES)
  const colour = randomFrom(SPECIAL_COLOURS)
  const faceId = randomFrom(SPECIAL_FACE_IDS)
  const pos = template.role === "Sweeper Keeper" ? "GK" : template.role === "Wingback" || template.role === "Ball-Playing Defender" ? "DEF" : template.role === "Mezzala" || template.role === "Playmaker" || template.role === "Pressing Forward" ? "MID" : "FWD"

  const player: Player = {
    id: `special-${template.id}-${getPlayerProfileId()}`,
    name,
    pos,
    rating: template.rating,
    stamina: template.attributes.stamina,
    style: template.role,
    number: 7 + Math.floor(Math.random() * 89),
    face: `https://i.pravatar.cc/240?img=${faceId}`,
    look: `${colour} Edition`,
    height: randomHeight(pos),
    attributes: { ...template.attributes },
    specialStyle: template.style,
    specialName: name,
    specialAbility: template.specialAbility,
    specialColor: colour,
    specialTemplateId: template.id,
  }

  claims[templateId] = player
  saveSpecialClaims(claims)
  return { player, alreadyClaimed: false, message: `${name} claimed — ${template.specialAbility}.` }
}

export function getSpecialPlayerClaims(): Player[] {
  return Object.values(readSpecialClaims())
}

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
  const saved = Number(localStorage.getItem(profileStorageKey(SQUAD_CAPACITY_KEY)) || 24)
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
  localStorage.setItem(profileStorageKey(SQUAD_CAPACITY_KEY), String(next))
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
    const saved = JSON.parse(localStorage.getItem(profileStorageKey(CLUB_SQUAD_KEY)) || "null")

    // First launch: give this user their own random 24-player collection
    // from the 48-player master pool, then persist that exact collection.
    if (!saved || !Array.isArray(saved) && !Array.isArray(saved.baseIds)) {
      const starting = shufflePlayers(starterPool).slice(0, Math.min(24, getSquadCapacity()))
      localStorage.setItem(
        profileStorageKey(CLUB_SQUAD_KEY),
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

      return [...ownedBase, ...auctionPlayers].slice(0, getSquadCapacity()).concat(getSpecialPlayerClaims())
    }

    // Migrate the previous auction-only storage format without giving every
    // user the same 24 base players.
    if (Array.isArray(saved)) {
      const starting = shufflePlayers(starterPool).slice(0, Math.min(24, getSquadCapacity()))
      const auctionPlayers = saved.filter((p) => p && typeof p.id === "string" && p.id.startsWith("auction-"))
      localStorage.setItem(
        profileStorageKey(CLUB_SQUAD_KEY),
        JSON.stringify({ baseIds: starting.map((player) => player.id), auctionPlayers }),
      )
      return [...starting, ...auctionPlayers].slice(0, getSquadCapacity()).concat(getSpecialPlayerClaims())
    }

    return getSpecialPlayerClaims().slice(0, getSquadCapacity())
  } catch {
    const starting = shufflePlayers(starterPool).slice(0, Math.min(24, getSquadCapacity()))
    try {
      localStorage.setItem(
        profileStorageKey(CLUB_SQUAD_KEY),
        JSON.stringify({ baseIds: starting.map((player) => player.id), auctionPlayers: [] }),
      )
    } catch {}
    return starting
  }
}

export function saveClubSquad(players: Player[]) {
  if (typeof window !== "undefined") {
    const baseIds = players
      .filter((p) => !p.id.startsWith("auction-") && !p.id.startsWith("special-"))
      .map((p) => p.id)
    const auctionPlayers = players.filter((p) => p.id.startsWith("auction-"))
    localStorage.setItem(profileStorageKey(CLUB_SQUAD_KEY), JSON.stringify({ baseIds, auctionPlayers }))
  }
}

export function addAuctionPlayer(base: Player[], player: AuctionPlayer): { squad: Player[]; added: boolean } {
  const current = base.length ? base : loadClubSquad(base)
  if (current.some((p) => p.id === "auction-" + player.id)) return { squad: current, added: false }
  const normalCount = current.filter((p) => !p.id.startsWith("special-")).length
  if (normalCount >= getSquadCapacity()) return { squad: current, added: false }
  const next = [...current, auctionToPlayer(player)]
  saveClubSquad(next)
  return { squad: next, added: true }
}
