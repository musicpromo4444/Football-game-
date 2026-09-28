export const IMPOSSIBLE_CHALLENGE_TEAMS = [
  { stage: 1, name: "Rookie Wolves", rating: 77 },
  { stage: 2, name: "Iron Lions", rating: 80 },
  { stage: 3, name: "Elite Titans", rating: 88 },
  { stage: 4, name: "World Giants", rating: 95 },
  { stage: 5, name: "THE FINAL BOSS", rating: 100 },
] as const

export type ImpossibleChallengeState = {
  stage: number
  retriesUsed: number
  completed: boolean
}

const KEY = "pitchside-impossible-challenge"

export function readImpossibleChallenge(): ImpossibleChallengeState {
  if (typeof window === "undefined") return { stage: 1, retriesUsed: 0, completed: false }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null")
    if (raw && typeof raw.stage === "number") return { stage: Math.min(5, Math.max(1, raw.stage)), retriesUsed: Math.max(0, Math.min(5, raw.retriesUsed || 0)), completed: !!raw.completed }
  } catch {}
  return { stage: 1, retriesUsed: 0, completed: false }
}

export function saveImpossibleChallenge(state: ImpossibleChallengeState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function startImpossibleChallenge() {
  const state = { stage: 1, retriesUsed: 0, completed: false }
  saveImpossibleChallenge(state)
  localStorage.setItem("pitchside-impossible-challenge-active", "1")
  return state
}

export function restartImpossibleChallenge() {
  return startImpossibleChallenge()
}

export function clearImpossibleChallenge() {
  localStorage.removeItem("pitchside-impossible-challenge-active")
  saveImpossibleChallenge({ stage: 1, retriesUsed: 0, completed: false })
}
