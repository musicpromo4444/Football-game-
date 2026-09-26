export type LeagueId =
  | "academy"
  | "league-1"
  | "league-2"
  | "league-3"
  | "league-4"
  | "premier"
  | "champions"
  | "super"
  | "legendary"
  | "elite"
  | "hall-of-fame"

export type MatchResult = "win" | "draw" | "loss"

export type RematchState = {
  playerId: string
  opponentId: string
  leagueId: LeagueId
  streakGames: number
  rematchRequestedBy?: string
  rematchRequestedAt?: number
}

const STORAGE_KEY = "pitchside-rematch-state"

function pairKey(playerId: string, opponentId: string) {
  return [playerId, opponentId].sort().join("::")
}

function read(): Record<string, RematchState> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}
  } catch {
    return {}
  }
}

function write(value: Record<string, RematchState>) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

/**
 * A rematch streak is ONLY for consecutive games in the same immediate rematch chain.
 * It is not a lifetime head-to-head limit.
 *
 * 1st game -> rematch may be offered
 * 2nd game -> rematch may be offered
 * 3rd game -> no rematch; both return to normal matchmaking
 *
 * If the same players meet later through normal matchmaking, a fresh streak starts.
 */
export function getRematchState(playerId: string, opponentId: string): RematchState | null {
  return read()[pairKey(playerId, opponentId)] || null
}

export function recordCompletedGame(
  playerId: string,
  opponentId: string,
  leagueId: LeagueId,
): RematchState {
  const all = read()
  const key = pairKey(playerId, opponentId)
  const previous = all[key]
  const next: RematchState = {
    playerId,
    opponentId,
    leagueId,
    streakGames: Math.min(3, (previous?.streakGames || 0) + 1),
  }
  all[key] = next
  write(all)
  return next
}

export function canOfferRematch(state: RematchState | null): boolean {
  return !!state && state.streakGames < 3
}

/**
 * Declining/cancelling an immediate rematch ends the current chain.
 * The pair is deliberately removed from the streak record, so a later random
 * matchmaking encounter starts a completely new rematch chain.
 */
export function endRematchChain(playerId: string, opponentId: string) {
  const all = read()
  delete all[pairKey(playerId, opponentId)]
  write(all)
}

export function acceptRematch(
  playerId: string,
  opponentId: string,
  leagueId: LeagueId,
): RematchState | null {
  const state = getRematchState(playerId, opponentId)
  if (!state || state.streakGames >= 3 || state.leagueId !== leagueId) return null
  return state
}

/**
 * Normal matchmaking is allowed to pair these players again later.
 * Starting that normal match resets only the immediate rematch chain.
 */
export function startNormalMatch(playerId: string, opponentId: string) {
  endRematchChain(playerId, opponentId)
}
