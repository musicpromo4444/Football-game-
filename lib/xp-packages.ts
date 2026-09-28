import { loadClubSquad } from "@/lib/club-squad"
import { grantTrainingBoost } from "@/lib/training-boosts"
import { readWallet, saveWallet } from "@/lib/economy"

export type PackageTier = "silver" | "gold" | "platinum"
export type PackageReward = { tier: PackageTier; players: string[]; playerBoost: 1; bucks: number; gems: number; rareBonus?: "captain-boost" | "ghost-summon"; specialPlayer?: string }

const XP_KEY = "pitchside-xp"
const THRESHOLDS = { silver: 600, gold: 800, platinum: 1000 }

export function getPitchSideXp() {
  if (typeof window === "undefined") return 0
  const n = Number(localStorage.getItem(XP_KEY) || 0)
  return Number.isFinite(n) ? n : 0
}
function saveXp(xp: number) { if (typeof window !== "undefined") localStorage.setItem(XP_KEY, String(Math.max(0, Math.floor(xp)))) }

export function calculateMatchXp(result: "WIN" | "DRAW" | "LOSS", goals: number, cleanSheet: boolean, beatHigherSide = false) {
  return (result === "WIN" ? 200 : result === "DRAW" ? 150 : 50) + Math.max(0, goals) * 50 + (cleanSheet ? 25 : 0) + (beatHigherSide ? 50 : 0)
}

export function addMatchXp(amount: number) {
  const next = getPitchSideXp() + Math.max(0, Math.floor(amount))
  if (next >= THRESHOLDS.platinum) { saveXp(next - 1000); return { xp: next - 1000, packageTier: "platinum" as PackageTier } }
  if (next >= THRESHOLDS.gold) { saveXp(next - 800); return { xp: next - 800, packageTier: "gold" as PackageTier } }
  if (next >= THRESHOLDS.silver) { saveXp(next - 600); return { xp: next - 600, packageTier: "silver" as PackageTier } }
  saveXp(next); return { xp: next, packageTier: null }
}

export function getPackageContents(tier: PackageTier): PackageReward {
  const club = loadClubSquad()
  const count = tier === "silver" ? 3 : tier === "gold" ? 4 : 5
  const players = [...club].sort(() => Math.random() - 0.5).slice(0, count).map(p => p.id)
  const gems = tier === "silver" ? 2 : tier === "gold" ? 3 + Math.floor(Math.random() * 2) : 6
  const bucks = tier === "silver" ? 100 : tier === "gold" ? 200 : 300
  let specialPlayer: string | undefined
  if (tier === "platinum" && Math.random() < 0.15) specialPlayer = "special"
  let rareBonus: PackageReward["rareBonus"]
  if (tier === "platinum" && Math.floor(Math.random() * 2000) === 0) rareBonus = Math.random() < 0.5 ? "captain-boost" : "ghost-summon"
  return { tier, players, playerBoost: 1, bucks, gems, specialPlayer, rareBonus }
}

export function revealPackage(tier: PackageTier) {
  return getPackageContents(tier)
}

export function equipPackage(reward: PackageReward) {
  const wallet = readWallet()
  saveWallet({ bucks: wallet.bucks + reward.bucks, gems: wallet.gems + reward.gems })
  for (const playerId of reward.players) grantTrainingBoost(playerId, "starter")
  return reward
}

export const XP_PACKAGE_THRESHOLDS = THRESHOLDS
