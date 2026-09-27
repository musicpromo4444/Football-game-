export type TeamBoostType = "ghost-formation" | "team-boost" | "captain-boost" | "defense-shield" | "goalkeeper-boost"

export type TeamBoostDuration = "1-match" | "3-matches" | "24-hours"

export type ActiveTeamBoost = {
  type: TeamBoostType
  duration: TeamBoostDuration
  activatedAt: number
  expiresAt: number | null
  matchesRemaining: number | null
}

export const TEAM_BOOSTS: Record<TeamBoostType, {
  name: string
  icon: string
  description: string
  effect: string
  prices: Record<TeamBoostDuration, number>
}> = {
  "ghost-formation": {
    name: "Ghost Formation",
    icon: "👻",
    description: "Hides your tactical shape and makes your formation harder to read.",
    effect: "Formation movement +8% · tactical unpredictability",
    prices: { "1-match": 40, "3-matches": 100, "24-hours": 180 },
  },
  "team-boost": {
    name: "Team Boost",
    icon: "⚡",
    description: "Temporarily raises the performance of your whole starting team.",
    effect: "All starting players +5% performance",
    prices: { "1-match": 30, "3-matches": 75, "24-hours": 140 },
  },
  "captain-boost": {
    name: "Captain Boost",
    icon: "👑",
    description: "Gives your selected captain a temporary leadership boost.",
    effect: "Captain +10% performance · team morale +2%",
    prices: { "1-match": 25, "3-matches": 65, "24-hours": 120 },
  },
  "defense-shield": {
    name: "Defense Shield",
    icon: "🛡️",
    description: "Strengthens your defensive line for a limited time.",
    effect: "Defensive duels +10% · interception +8%",
    prices: { "1-match": 35, "3-matches": 90, "24-hours": 160 },
  },
  "goalkeeper-boost": {
    name: "Goalkeeper Boost",
    icon: "🧤",
    description: "Temporarily improves your goalkeeper's reactions and saves.",
    effect: "GK saves +10% · reactions +8%",
    prices: { "1-match": 30, "3-matches": 80, "24-hours": 150 },
  },
}

const KEY = "pitchside-active-team-boosts"

function readAll(): ActiveTeamBoost[] {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]")
    return Array.isArray(value) ? value : []
  } catch { return [] }
}

function writeAll(value: ActiveTeamBoost[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(value))
}

export function readActiveTeamBoosts(): ActiveTeamBoost[] {
  const now = Date.now()
  const active = readAll().filter((boost) => boost.expiresAt === null || boost.expiresAt > now)
  if (active.length !== readAll().length) writeAll(active)
  return active
}

export function hasTeamBoost(type: TeamBoostType): boolean {
  return readActiveTeamBoosts().some((boost) => boost.type === type)
}

export function activateTeamBoost(type: TeamBoostType, duration: TeamBoostDuration): ActiveTeamBoost {
  const now = Date.now()
  const matches = duration === "1-match" ? 1 : duration === "3-matches" ? 3 : null
  const boost: ActiveTeamBoost = {
    type,
    duration,
    activatedAt: now,
    expiresAt: duration === "24-hours" ? now + 24 * 60 * 60 * 1000 : null,
    matchesRemaining: matches,
  }
  const current = readActiveTeamBoosts().filter((entry) => entry.type !== type)
  current.push(boost)
  writeAll(current)
  return boost
}

export function consumeTeamBoostsAfterMatch() {
  const next: ActiveTeamBoost[] = []
  for (const boost of readActiveTeamBoosts()) {
    if (boost.matchesRemaining === null) {
      next.push(boost)
    } else if (boost.matchesRemaining > 1) {
      next.push({ ...boost, matchesRemaining: boost.matchesRemaining - 1 })
    }
  }
  writeAll(next)
}

export function getTeamBoostModifiers() {
  const active = readActiveTeamBoosts()
  return {
    ghostFormation: active.some((b) => b.type === "ghost-formation"),
    team: active.some((b) => b.type === "team-boost"),
    captain: active.some((b) => b.type === "captain-boost"),
    defense: active.some((b) => b.type === "defense-shield"),
    goalkeeper: active.some((b) => b.type === "goalkeeper-boost"),
  }
}
