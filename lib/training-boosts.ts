export type TrainingBoostTier = "starter" | "power" | "elite"
export type TrainingStatKey = "SPE" | "ACC" | "STA" | "STR" | "CON" | "PAS" | "SHO" | "TAC"
export type PlayerTrainingBoost = {
  ovr: number
  stats: Partial<Record<TrainingStatKey, number>>
  purchases: number
}

const KEY = "pitchside-shop-training-boosts"
const STATS: TrainingStatKey[] = ["SPE", "ACC", "STA", "STR", "CON", "PAS", "SHO", "TAC"]

export const TRAINING_BOOST_PACKAGES = {
  starter: { ovr: 1, amount: 1, statCount: 3, payment: "ad" as const, label: "+1 OVR", detail: "+1 to 3 random stats" },
  power: { ovr: 2, amount: 3, statCount: 3, payment: "gems" as const, price: 30, label: "+2 OVR", detail: "+3 to 3 random stats" },
  elite: { ovr: 4, amount: 5, statCount: 4, payment: "usd" as const, price: 1.25, label: "+4 OVR", detail: "+5 to 4 random stats" },
} as const

function readAll(): Record<string, PlayerTrainingBoost> {
  if (typeof window === "undefined") return {}
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "{}")
    return value && typeof value === "object" ? value : {}
  } catch { return {} }
}

function writeAll(value: Record<string, PlayerTrainingBoost>) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(value))
}

function pickRandomStats(count: number): TrainingStatKey[] {
  const shuffled = [...STATS]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

export function readPlayerTrainingBoost(playerId: string): PlayerTrainingBoost {
  return readAll()[playerId] || { ovr: 0, stats: {}, purchases: 0 }
}

export function grantTrainingBoost(playerId: string, tier: TrainingBoostTier): PlayerTrainingBoost {
  const pack = TRAINING_BOOST_PACKAGES[tier]
  const all = readAll()
  const current = all[playerId] || { ovr: 0, stats: {}, purchases: 0 }
  const stats = { ...current.stats }
  for (const key of pickRandomStats(pack.statCount)) stats[key] = Number(stats[key] || 0) + pack.amount
  const next = { ovr: current.ovr + pack.ovr, stats, purchases: current.purchases + 1 }
  all[playerId] = next
  writeAll(all)
  return next
}
