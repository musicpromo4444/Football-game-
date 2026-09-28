export type TrainingMode = "regular" | "super" | "regular-team" | "super-team"
export type TrainingStatKey = "SPE" | "ACC" | "STA" | "STR" | "CON" | "PAS" | "SHO" | "TAC"

export type PlayerTrainingBoost = {
  stats: Partial<Record<TrainingStatKey, number>>
  purchases: number
}

export type TrainingSession = {
  playerIds: string[]
  mode: TrainingMode
  boosts: Record<string, Partial<Record<TrainingStatKey, number>>>
  startedAt: number
  completesAt: number
  lockUntil: number
  applied?: boolean
}

export type TrainingState = { regularSlots: number; superSlots: number; active: TrainingSession[] }

export const TRAINING_CONFIG = {
  regular: { slots: 3, slotUpgrade: 3, adSeconds: 30, statCount: 1, amount: 3, priceUsd: 0 },
  super: { slots: 1, slotUpgrade: 4, adSeconds: 60, statCount: 2, amount: 3, priceUsd: 0 },
  "regular-team": { slots: 11, slotUpgrade: 0, adSeconds: 30, statCount: 1, amount: 3, priceUsd: 4.10 },
  "super-team": { slots: 11, slotUpgrade: 0, adSeconds: 60, statCount: 2, amount: 3, priceUsd: 9.99 },
} as const

export const TRAINING_SLOT_PRICES = { regular: 1.20, super: 2.99 } as const
export const TRAINING_SLOT_CAPACITY = { regular: 6, super: 5 } as const
export const TRAINING_TEAM_PRICES = { regular: 4.10, super: 9.99 } as const

const KEY = "pitchside-player-training-v2"
const BOOST_KEY = "pitchside-player-training-boosts-v2"
const DAY = 24 * 60 * 60 * 1000
const LOCK = 14 * DAY
const STATS: TrainingStatKey[] = ["SPE", "ACC", "STA", "STR", "CON", "PAS", "SHO", "TAC"]

function readState(): TrainingState {
  if (typeof window === "undefined") return { regularSlots: 3, superSlots: 1, active: [] }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "")
    return raw && typeof raw === "object"
      ? { regularSlots: Math.max(3, Number(raw.regularSlots) || 3), superSlots: Math.max(1, Number(raw.superSlots) || 1), active: Array.isArray(raw.active) ? raw.active : [] }
      : { regularSlots: 3, superSlots: 1, active: [] }
  } catch { return { regularSlots: 3, superSlots: 1, active: [] } }
}
function writeState(state: TrainingState) { if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state)) }
function readAllBoosts(): Record<string, PlayerTrainingBoost> {
  if (typeof window === "undefined") return {}
  try { const raw = JSON.parse(localStorage.getItem(BOOST_KEY) || "{}"); return raw && typeof raw === "object" ? raw : {} } catch { return {} }
}
function writeAllBoosts(value: Record<string, PlayerTrainingBoost>) { if (typeof window !== "undefined") localStorage.setItem(BOOST_KEY, JSON.stringify(value)) }
function randomBoost(count: number, amount: number) {
  const shuffled = [...STATS]
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] }
  return Object.fromEntries(shuffled.slice(0, count).map((stat) => [stat, amount])) as Partial<Record<TrainingStatKey, number>>
}
function applyCompleted(state: TrainingState, now: number) {
  const boosts = readAllBoosts()
  let changed = false
  for (const session of state.active) {
    if (session.applied || session.completesAt > now) continue
    for (const [playerId, playerBoost] of Object.entries(session.boosts)) {
      const current = boosts[playerId] || { stats: {}, purchases: 0 }
      const stats = { ...current.stats }
      for (const [key, value] of Object.entries(playerBoost)) stats[key as TrainingStatKey] = Number(stats[key as TrainingStatKey] || 0) + Number(value || 0)
      boosts[playerId] = { stats, purchases: current.purchases + 1 }
    }
    session.applied = true
    changed = true
  }
  state.active = state.active.filter((session) => !session.applied || session.lockUntil > now)
  if (changed) writeAllBoosts(boosts)
  writeState(state)
  return state
}
export function getTrainingState(now = Date.now()) { return applyCompleted(readState(), now) }
export function readPlayerTrainingBoost(playerId: string): PlayerTrainingBoost { return readAllBoosts()[playerId] || { stats: {}, purchases: 0 } }
export function startTraining(playerIds: string[], mode: TrainingMode, now = Date.now()) {
  const state = getTrainingState(now), config = TRAINING_CONFIG[mode], unique = [...new Set(playerIds)]
  if (!unique.length) return { ok: false as const, error: "Select at least one player." }
  if ((mode === "regular-team" || mode === "super-team") && unique.length !== 11) return { ok: false as const, error: "Full-team training requires all 11 players." }
  if (mode === "regular" && unique.length > state.regularSlots) return { ok: false as const, error: "Regular training slots are full." }
  if (mode === "super" && unique.length > state.superSlots) return { ok: false as const, error: "Super training slots are full." }
  if (mode === "regular-team" || mode === "super-team") {
    if (state.active.some((s) => s.mode === mode && s.completesAt > now)) return { ok: false as const, error: "This full-team training is already active." }
  } else if (state.active.some((s) => s.completesAt > now && s.playerIds.some((id) => unique.includes(id)))) return { ok: false as const, error: "One or more selected players are already training." }
  if (unique.some((id) => state.active.some((s) => s.playerIds.includes(id) && s.lockUntil > now))) return { ok: false as const, error: "One or more selected players are locked for 14 days." }
  const boosts = Object.fromEntries(unique.map((id) => [id, randomBoost(config.statCount, config.amount)]))
  const session: TrainingSession = { playerIds: unique, mode, boosts, startedAt: now, completesAt: now + DAY, lockUntil: now + LOCK }
  state.active.push(session); writeState(state)
  return { ok: true as const, session }
}
export function purchaseTrainingSlots(kind: "regular" | "super") {
  const state = getTrainingState()
  const current = kind === "regular" ? state.regularSlots : state.superSlots
  const cap = TRAINING_SLOT_CAPACITY[kind]
  if (current >= cap) return { ok: false as const, message: kind === "regular" ? "Regular training is already at its 6-player maximum." : "Super training is already at its 5-player maximum.", slots: current }
  const next = Math.min(cap, current + TRAINING_CONFIG[kind].slotUpgrade)
  if (kind === "regular") state.regularSlots = next
  else state.superSlots = next
  writeState(state)
  return { ok: true as const, slots: next }
}
