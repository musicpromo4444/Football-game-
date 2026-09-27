import { awardPromotion, type MatchWinLevel } from "@/lib/economy"

export type LeagueProgress = {
  leagueIndex: number
  played: number
  points: number
  wins: number
  draws: number
  losses: number
}

export const LEAGUE_LEVELS: MatchWinLevel[] = [
  "academy", "league-1", "league-2", "league-3", "league-4", "premier",
  "champions", "super", "legendary", "elite", "hall-of-fame",
]

const KEY = "pitchside-league-progress"
const SEASON_MATCHES = 10
const PROMOTION_POINTS = 18
const RELEGATION_POINTS = 6
const DEFAULT_PROGRESS: LeagueProgress = { leagueIndex: 5, played: 0, points: 0, wins: 0, draws: 0, losses: 0 }

export function readLeagueProgress(): LeagueProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null")
    if (saved && Number.isInteger(saved.leagueIndex) && Number.isInteger(saved.played)) return { ...DEFAULT_PROGRESS, ...saved }
  } catch {}
  return DEFAULT_PROGRESS
}

export function saveLeagueProgress(progress: LeagueProgress) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(progress))
}

export function recordLeagueResult(home: number, away: number) {
  const current = readLeagueProgress()
  if (current.played >= SEASON_MATCHES) return { progress: current, seasonResult: "season-complete" as const, reward: 0 }

  const win = home > away
  const draw = home === away
  const next: LeagueProgress = {
    ...current,
    played: current.played + 1,
    points: current.points + (win ? 3 : draw ? 1 : -3),
    wins: current.wins + (win ? 1 : 0),
    draws: current.draws + (draw ? 1 : 0),
    losses: current.losses + (!win && !draw ? 1 : 0),
  }

  if (next.played < SEASON_MATCHES) {
    saveLeagueProgress(next)
    return { progress: next, seasonResult: "ongoing" as const, reward: 0 }
  }

  const oldIndex = current.leagueIndex
  let leagueIndex = oldIndex
  let seasonResult: "promoted" | "relegated" | "held" = "held"
  let reward = 0

  if (next.points >= PROMOTION_POINTS && oldIndex < LEAGUE_LEVELS.length - 1) {
    leagueIndex = oldIndex + 1
    seasonResult = "promoted"
    reward = awardPromotion(LEAGUE_LEVELS[leagueIndex]).reward.bux
  } else if (next.points <= RELEGATION_POINTS && oldIndex > 0) {
    leagueIndex = oldIndex - 1
    seasonResult = "relegated"
  }

  const reset: LeagueProgress = { leagueIndex, played: 0, points: 0, wins: 0, draws: 0, losses: 0 }
  saveLeagueProgress(reset)
  return { progress: reset, seasonResult, reward }
}

export const LEAGUE_SEASON_MATCHES = SEASON_MATCHES
export const LEAGUE_PROMOTION_POINTS = PROMOTION_POINTS
export const LEAGUE_RELEGATION_POINTS = RELEGATION_POINTS
