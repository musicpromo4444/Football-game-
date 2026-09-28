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

/** Cumulative points required to enter each division. */
export const LEAGUE_QUALIFICATION_POINTS = [
  60, 114, 165, 240, 450, 867, 1380, 2700, 3900, 6000, null,
] as const

/** Straight-win equivalents requested for each promotion step. */
export const LEAGUE_QUALIFICATION_WINS = [
  20, 38, 55, 80, 150, 289, 460, 900, 1300, 2000, null,
] as const

const KEY = "pitchside-league-progress"
const DEFAULT_PROGRESS: LeagueProgress = {
  leagueIndex: 0,
  played: 0,
  points: 0,
  wins: 0,
  draws: 0,
  losses: 0,
}

export function readLeagueProgress(): LeagueProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null")
    if (saved && Number.isInteger(saved.leagueIndex) && Number.isInteger(saved.played)) {
      return { ...DEFAULT_PROGRESS, ...saved }
    }
  } catch {}
  return DEFAULT_PROGRESS
}

export function saveLeagueProgress(progress: LeagueProgress) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(progress))
}

export function getLeagueQualification(index: number) {
  return {
    points: LEAGUE_QUALIFICATION_POINTS[index],
    wins: LEAGUE_QUALIFICATION_WINS[index],
  }
}

export function recordLeagueResult(home: number, away: number) {
  const current = readLeagueProgress()
  const win = home > away
  const draw = home === away

  const next: LeagueProgress = {
    ...current,
    played: current.played + 1,
    points: current.points + (win ? 3 : draw ? 1 : 0),
    wins: current.wins + (win ? 1 : 0),
    draws: current.draws + (draw ? 1 : 0),
    losses: current.losses + (!win && !draw ? 1 : 0),
  }

  const oldIndex = current.leagueIndex
  const requiredPoints = LEAGUE_QUALIFICATION_POINTS[oldIndex]
  const requiredWins = LEAGUE_QUALIFICATION_WINS[oldIndex]
  const canPromote =
    oldIndex < LEAGUE_LEVELS.length - 1 &&
    requiredPoints !== null &&
    next.points >= requiredPoints

  if (canPromote) {
    const leagueIndex = oldIndex + 1
    const reward = awardPromotion(LEAGUE_LEVELS[leagueIndex]).reward.bux
    const promoted: LeagueProgress = { ...next, leagueIndex }
    saveLeagueProgress(promoted)
    return { progress: promoted, seasonResult: "promoted" as const, reward, requiredPoints, requiredWins }
  }

  saveLeagueProgress(next)
  return {
    progress: next,
    seasonResult: "ongoing" as const,
    reward: 0,
    requiredPoints,
    requiredWins,
  }
}

export const LEAGUE_PROMOTION_POINTS = LEAGUE_QUALIFICATION_POINTS
export const LEAGUE_PROMOTION_WINS = LEAGUE_QUALIFICATION_WINS
