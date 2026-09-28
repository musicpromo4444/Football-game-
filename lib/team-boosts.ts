export type TeamBoostType = "ghost-formation" | "team-boost" | "captain-boost" | "defense-shield" | "goalkeeper-boost"

export type TeamBoostDuration = "1-match" | "2-matches" | "10-matches" | "20-matches"

export type ActiveTeamBoost = {
  type: TeamBoostType
  duration: TeamBoostDuration
  activatedAt: number
  expiresAt: number | null
  matchesRemaining: number | null
  leagueIndex?: number | null
}

export const TEAM_BOOSTS: Record<TeamBoostType, {
  name: string
  icon: string
  description: string
  effect: string
  prices: Record<TeamBoostDuration, { gems?: number; usd?: number }>
}> = {
  "ghost-formation": {
    name: "Ghost Formation",
    icon: "👻",
    description: "A hidden attacking formation. The shape is never revealed before kickoff.",
    effect: "Elite attacking positioning · very high scoring pressure",
    prices: { "1-match": { gems: 50 }, "2-matches": { gems: 75 }, "10-matches": { usd: 1.00 }, "20-matches": { usd: 1.80 } },
  },
  "team-boost": {
    name: "Team Boost",
    icon: "⚡",
    description: "Temporarily raises the performance of your whole starting team.",
    effect: "All starting players +5% performance",
    prices: { "1-match": { gems: 40 }, "2-matches": { gems: 65 }, "10-matches": { usd: 1.20 }, "20-matches": { usd: 2.00 } },
  },
  "captain-boost": {
    name: "Captain Boost",
    icon: "👑",
    description: "Gives your selected captain a temporary leadership boost.",
    effect: "Captain +10% performance · team morale +2%",
    prices: { "1-match": { gems: 30 }, "2-matches": { gems: 50 }, "10-matches": { usd: 1.25 }, "20-matches": { usd: 2.00 } },
  },
  "defense-shield": {
    name: "Defense Shield",
    icon: "🛡️",
    description: "Strengthens your defensive line for a limited time.",
    effect: "Defensive duels +10% · interception +8%",
    prices: { "1-match": { gems: 35 }, "2-matches": { gems: 60 }, "10-matches": { usd: 1.00 }, "20-matches": { usd: 1.75 } },
  },
  "goalkeeper-boost": {
    name: "Goalkeeper Boost",
    icon: "🧤",
    description: "Temporarily improves your goalkeeper's reactions and saves.",
    effect: "GK saves +10% · reactions +8%",
    prices: { "1-match": { gems: 30 }, "2-matches": { gems: 55 }, "10-matches": { usd: 1.00 }, "20-matches": { usd: 1.75 } },
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
  const saved = readAll()
  let currentLeagueIndex: number | null = null
  if (typeof window !== "undefined") {
    try {
      const progress = JSON.parse(localStorage.getItem("pitchside-league-progress") || "null")
      if (progress && Number.isInteger(progress.leagueIndex)) currentLeagueIndex = progress.leagueIndex
    } catch {}
  }
  const active = saved.filter((boost) => {
    if (boost.expiresAt !== null && boost.expiresAt <= now) return false
    if (boost.type === "ghost-formation" && boost.leagueIndex != null && currentLeagueIndex != null && boost.leagueIndex !== currentLeagueIndex) return false
    return true
  })
  if (active.length !== readAll().length) writeAll(active)
  return active
}

export function hasTeamBoost(type: TeamBoostType): boolean {
  return readActiveTeamBoosts().some((boost) => boost.type === type)
}

export function activateTeamBoost(type: TeamBoostType, duration: TeamBoostDuration): ActiveTeamBoost {
  const now = Date.now()
  const matches = duration === "1-match" ? 1 : duration === "2-matches" ? 2 : duration === "10-matches" ? 10 : 20
  let leagueIndex: number | null = null
  if (type === "ghost-formation" && typeof window !== "undefined") {
    try {
      const progress = JSON.parse(localStorage.getItem("pitchside-league-progress") || "null")
      if (progress && Number.isInteger(progress.leagueIndex)) leagueIndex = progress.leagueIndex
    } catch {}
  }
  const boost: ActiveTeamBoost = {
    type,
    duration,
    activatedAt: now,
    expiresAt: null,
    matchesRemaining: matches,
    leagueIndex,
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

export function activateGhostFormationForLeague(): ActiveTeamBoost {
  const now = Date.now()
  let leagueIndex: number | null = null
  if (typeof window !== "undefined") {
    try {
      const progress = JSON.parse(localStorage.getItem("pitchside-league-progress") || "null")
      if (progress && Number.isInteger(progress.leagueIndex)) leagueIndex = progress.leagueIndex
    } catch {}
  }
  const boost: ActiveTeamBoost = { type: "ghost-formation", duration: "20-matches", activatedAt: now, expiresAt: null, matchesRemaining: null, leagueIndex }
  const current = readActiveTeamBoosts().filter((entry) => entry.type !== "ghost-formation")
  current.push(boost)
  writeAll(current)
  return boost
}
