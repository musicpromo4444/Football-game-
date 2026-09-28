export type InjuryShieldState = { remaining: number; total: 2 | 5 | 10; activatedAt: number }

export const INJURY_SHIELD_KEY = "pitchside-injury-shield"

export function readInjuryShield(): InjuryShieldState | null {
  if (typeof window === "undefined") return null
  try {
    const parsed = JSON.parse(localStorage.getItem(INJURY_SHIELD_KEY) || "null")
    if (!parsed || ![2, 5, 10].includes(parsed.total) || !Number.isFinite(parsed.remaining)) return null
    const remaining = Math.max(0, Math.min(parsed.total, Math.floor(parsed.remaining)))
    return remaining > 0 ? { remaining, total: parsed.total, activatedAt: Number(parsed.activatedAt) || Date.now() } : null
  } catch {
    return null
  }
}

export function activateInjuryShield(total: 2 | 5 | 10) {
  if (typeof window === "undefined") return
  localStorage.setItem(INJURY_SHIELD_KEY, JSON.stringify({ remaining: total, total, activatedAt: Date.now() }))
}

export function consumeInjuryShield(): InjuryShieldState | null {
  const current = readInjuryShield()
  if (!current) return null
  const next = current.remaining - 1
  if (next <= 0) {
    localStorage.removeItem(INJURY_SHIELD_KEY)
    return { ...current, remaining: 0 }
  }
  const updated = { ...current, remaining: next }
  localStorage.setItem(INJURY_SHIELD_KEY, JSON.stringify(updated))
  return updated
}
