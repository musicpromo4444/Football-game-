import { loadClubSquad, claimSpecialPlayer } from "@/lib/club-squad"
import { playerPool, squad, type Player } from "@/components/game/data"
import { readWallet, saveWallet } from "@/lib/economy"

export type PackageTier = "silver" | "gold" | "platinum"
export type PackageReward = { tier: PackageTier; players: string[]; bucks: number; gems: number; rareBonus?: "captain-boost" | "ghost-summon"; specialPlayer?: string }
export type StorePackageType = "starter-box" | "arena-special" | "mega-bundle"
export type StorePackageReward = {
  type: StorePackageType
  players: string[]
  count: number
  guaranteedRange: string
  remainingRange: string
  bucks: number
  gems: number
}

const STORE_PACKAGE_RULES: Record<StorePackageType, { count: number; guaranteed: [number, number]; remaining: [number, number]; bucks: number; gems: number }> = {
  "starter-box": { count: 5, guaranteed: [80, 84], remaining: [75, 79], bucks: 500, gems: 3 },
  "arena-special": { count: 9, guaranteed: [84, 88], remaining: [77, 82], bucks: 2000, gems: 0 },
  "mega-bundle": { count: 13, guaranteed: [88, 90], remaining: [77, 80], bucks: 60000, gems: 20 },
}

function shuffleStorePlayers(players: Player[]) {
  const result = [...players]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function pickStorePlayers(range: [number, number], count: number, excluded: Set<string>) {
  return shuffleStorePlayers([...squad, ...playerPool]).filter((player) =>
    player.rating >= range[0] && player.rating <= range[1] && !excluded.has(player.id)
  ).slice(0, count)
}

export function getStorePackageContents(type: StorePackageType): StorePackageReward {
  const rule = STORE_PACKAGE_RULES[type]
  const guaranteed = pickStorePlayers(rule.guaranteed, 1, new Set())
  const selected = [...guaranteed]
  const used = new Set(selected.map((player) => player.id))
  selected.push(...pickStorePlayers(rule.remaining, rule.count - selected.length, used))
  return {
    type,
    players: selected.map((player) => player.id),
    count: selected.length,
    guaranteedRange: rule.guaranteed[0] + "–" + rule.guaranteed[1],
    remainingRange: rule.remaining[0] + "–" + rule.remaining[1],
    bucks: rule.bucks,
    gems: rule.gems,
  }
}

export function getStorePlayer(id: string): Player | undefined {
  return [...squad, ...playerPool].find((player) => player.id === id)
}


export type PlayerCardAttribute = "SPE" | "ACC" | "STA" | "STR" | "CON" | "PAS" | "SHO" | "TAC"
export type PlayerCardReward = { id: string; attribute: PlayerCardAttribute; amount: 2; claimedAt: number }
export type PlayerCardBoosts = Partial<Record<PlayerCardAttribute, number>>

const XP_KEY = "pitchside-xp"
const PLAYER_CARDS_KEY = "pitchside-player-cards"
const PLAYER_CARD_BOOSTS_KEY = "pitchside-player-card-boosts"
const XP_PER_PLAYER_CARD = 400
const THRESHOLDS = { silver: 600, gold: 800, platinum: 1000 }

export function getPitchSideXp() {
  if (typeof window === "undefined") return 0
  const n = Number(localStorage.getItem(XP_KEY) || 0)
  return Number.isFinite(n) ? n : 0
}
function saveXp(xp: number) { if (typeof window !== "undefined") localStorage.setItem(XP_KEY, String(Math.max(0, Math.floor(xp)))) }

export function calculateMatchXp(result: "WIN" | "DRAW" | "LOSS", goals: number, cleanSheet: boolean) {
  return (result === "WIN" ? 100 : result === "DRAW" ? 50 : 0) + Math.max(0, goals) * 10 + (cleanSheet ? 25 : 0)
}

function readPlayerCards(): PlayerCardReward[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(PLAYER_CARDS_KEY) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function savePlayerCards(cards: PlayerCardReward[]) {
  if (typeof window !== "undefined") localStorage.setItem(PLAYER_CARDS_KEY, JSON.stringify(cards))
}

function randomAttribute(): PlayerCardAttribute {
  const stats: PlayerCardAttribute[] = ["SPE", "ACC", "STA", "STR", "CON", "PAS", "SHO", "TAC"]
  return stats[Math.floor(Math.random() * stats.length)]
}

export function getPlayerCards() {
  return readPlayerCards()
}

export function readPlayerCardBoosts(playerId: string): PlayerCardBoosts {
  if (typeof window === "undefined") return {}
  try {
    const all = JSON.parse(localStorage.getItem(PLAYER_CARD_BOOSTS_KEY) || "{}")
    return all && typeof all[playerId] === "object" ? all[playerId] : {}
  } catch { return {} }
}

export function applyPlayerCard(cardId: string, playerId: string) {
  const cards = readPlayerCards()
  const card = cards.find((item) => item.id === cardId)
  if (!card) return { ok: false as const, message: "Player Card not found." }
  if (!playerId) return { ok: false as const, message: "Choose a player." }
  const boosts = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(PLAYER_CARD_BOOSTS_KEY) || "{}") : {}
  const current = boosts[playerId] && typeof boosts[playerId] === "object" ? boosts[playerId] : {}
  boosts[playerId] = { ...current, [card.attribute]: Number(current[card.attribute] || 0) + card.amount }
  if (typeof window !== "undefined") localStorage.setItem(PLAYER_CARD_BOOSTS_KEY, JSON.stringify(boosts))
  savePlayerCards(cards.filter((item) => item.id !== cardId))
  return { ok: true as const, card }
}

export function claimPlayerCard() {
  const card: PlayerCardReward = { id: "pc-" + Date.now() + "-" + Math.floor(Math.random() * 10000), attribute: randomAttribute(), amount: 2, claimedAt: Date.now() }
  const cards = readPlayerCards()
  savePlayerCards([...cards, card])
  return card
}

export function addMatchXp(amount: number) {
  const safeAmount = Math.max(0, Math.floor(amount))
  let xp = getPitchSideXp() + safeAmount
  let playerCardsEarned = 0

  while (xp >= XP_PER_PLAYER_CARD) {
    xp -= XP_PER_PLAYER_CARD
    claimPlayerCard()
    playerCardsEarned += 1
  }

  saveXp(xp)
  return { xp, playerCardsEarned, packageTier: null as PackageTier | null }
}

export function getPackageContents(tier: PackageTier): PackageReward {
  const club = loadClubSquad()
  const count = tier === "silver" ? 3 : tier === "gold" ? 4 : 5
  const players = [...club].sort(() => Math.random() - 0.5).slice(0, count).map(p => p.id)
  const gems = tier === "silver" ? 2 : tier === "gold" ? 3 + Math.floor(Math.random() * 2) : 6
  const bucks = tier === "silver" ? 100 : tier === "gold" ? 200 : 300
  let specialPlayer: string | undefined
  if (tier === "platinum" && Math.random() < 0.15) specialPlayer = "sp" + (1 + Math.floor(Math.random() * 12))
  let rareBonus: PackageReward["rareBonus"]
  if (tier === "platinum" && Math.floor(Math.random() * 2000) === 0) rareBonus = Math.random() < 0.5 ? "captain-boost" : "ghost-summon"
  return { tier, players, bucks, gems, specialPlayer, rareBonus }
}

export function revealPackage(tier: PackageTier) {
  return getPackageContents(tier)
}

export function equipPackage(reward: PackageReward) {
  const wallet = readWallet()
  saveWallet({ bucks: wallet.bucks + reward.bucks, gems: wallet.gems + reward.gems })
  if (reward.specialPlayer) claimSpecialPlayer(reward.specialPlayer)
  return reward
}

export const XP_PACKAGE_THRESHOLDS = THRESHOLDS
export const PLAYER_CARD_XP = XP_PER_PLAYER_CARD
