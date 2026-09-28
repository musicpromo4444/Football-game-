"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Play, Pause, RotateCcw, Hand, Star } from "lucide-react"
import { squad, type PlayerRole } from "@/components/game/data"
import { loadClubSquad } from "@/lib/club-squad"
import { readPlayerTrainingBoost } from "@/lib/training-boosts"
import { consumeTeamBoostsAfterMatch, getTeamBoostModifiers } from "@/lib/team-boosts"
import { awardMatchWin, awardMatchDraw } from "@/lib/economy"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Point = { x: number; y: number }
type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "4-1-4-1"
type TeamInstruction = "Gegenpress" | "Possession" | "Counter Attack" | "Low Block" | "Direct Play"
type TacticalPresetId = "possession" | "tiki-taka" | "gegenpress" | "counter-attack" | "direct-play" | "wing-play" | "long-ball" | "high-press" | "low-block" | "balanced"
const tacticalPresets: Record<TacticalPresetId, { formation: Formation; instruction: TeamInstruction; width: number; tempo: number; line: number; direct: number }> = {
  possession: { formation: "4-3-3", instruction: "Possession", width: 0.9, tempo: 0.72, line: 2, direct: 0.2 },
  "tiki-taka": { formation: "4-3-3", instruction: "Possession", width: 0.82, tempo: 0.9, line: 1, direct: 0.1 },
  gegenpress: { formation: "4-3-3", instruction: "Gegenpress", width: 1.12, tempo: 1.35, line: -7, direct: 0.45 },
  "counter-attack": { formation: "4-2-3-1", instruction: "Counter Attack", width: 1.08, tempo: 1.2, line: -3, direct: 0.8 },
  "direct-play": { formation: "4-1-4-1", instruction: "Direct Play", width: 1.02, tempo: 1.08, line: -1, direct: 0.9 },
  "wing-play": { formation: "4-4-2", instruction: "Direct Play", width: 1.28, tempo: 1.0, line: -2, direct: 0.65 },
  "long-ball": { formation: "4-2-3-1", instruction: "Direct Play", width: 1.0, tempo: 1.18, line: -1, direct: 1.0 },
  "high-press": { formation: "4-3-3", instruction: "Gegenpress", width: 1.05, tempo: 1.3, line: -10, direct: 0.5 },
  "low-block": { formation: "3-5-2", instruction: "Low Block", width: 0.82, tempo: 0.62, line: 10, direct: 0.75 },
  balanced: { formation: "4-2-3-1", instruction: "Possession", width: 1.0, tempo: 0.95, line: 0, direct: 0.5 },
}

const formationSlots: Record<Formation, Point[]> = {
  "4-3-3": [{x:50,y:90},{x:15,y:72},{x:37,y:75},{x:63,y:75},{x:85,y:72},{x:28,y:54},{x:50,y:51},{x:72,y:54},{x:18,y:31},{x:50,y:25},{x:82,y:31}],
  "4-4-2": [{x:50,y:90},{x:15,y:72},{x:37,y:75},{x:63,y:75},{x:85,y:72},{x:15,y:51},{x:38,y:53},{x:62,y:53},{x:85,y:51},{x:36,y:29},{x:64,y:29}],
  "3-5-2": [{x:50,y:90},{x:25,y:74},{x:50,y:76},{x:75,y:74},{x:10,y:51},{x:30,y:54},{x:50,y:56},{x:70,y:54},{x:90,y:51},{x:38,y:29},{x:62,y:29}],
  "4-2-3-1": [{x:50,y:90},{x:15,y:72},{x:37,y:75},{x:63,y:75},{x:85,y:72},{x:37,y:56},{x:63,y:56},{x:20,y:39},{x:50,y:35},{x:80,y:39},{x:50,y:19}],
  "4-1-4-1": [{x:50,y:90},{x:15,y:72},{x:37,y:75},{x:63,y:75},{x:85,y:72},{x:50,y:59},{x:15,y:45},{x:38,y:48},{x:62,y:48},{x:85,y:45},{x:50,y:25}],
}

const instructionEffects: Record<TeamInstruction, { tempo: number; width: number; line: number }> = {
  Gegenpress: { tempo: 1.35, width: 1.12, line: -7 },
  Possession: { tempo: 0.72, width: 0.92, line: 2 },
  "Counter Attack": { tempo: 1.2, width: 1.08, line: -3 },
  "Low Block": { tempo: 0.62, width: 0.86, line: 10 },
  "Direct Play": { tempo: 1.08, width: 1.02, line: -1 },
}

function loadTactics(): { formation: Formation; instruction: TeamInstruction; preset: TacticalPresetId } {
  if (typeof window === "undefined") return { formation: "4-3-3", instruction: "Possession", preset: "possession" }
  const preset = (localStorage.getItem("pitchside-tactical-preset") as TacticalPresetId) || "possession"
  const config = tacticalPresets[preset] || tacticalPresets.possession
  const formation = (localStorage.getItem("pitchside-formation") as Formation) || config.formation
  const instruction = (localStorage.getItem("pitchside-instruction") as TeamInstruction) || config.instruction
  return { formation, instruction, preset }
}

const teammates: Point[] = [
  { x: 30, y: 30 },
  { x: 70, y: 28 },
  { x: 22, y: 62 },
  { x: 78, y: 64 },
  { x: 50, y: 80 },
]
const opponents: Point[] = [
  { x: 50, y: 8 }, { x: 15, y: 18 }, { x: 37, y: 20 }, { x: 63, y: 20 }, { x: 85, y: 18 },
  { x: 20, y: 36 }, { x: 43, y: 38 }, { x: 57, y: 38 }, { x: 80, y: 36 },
  { x: 32, y: 55 }, { x: 68, y: 55 },
]

const opponentStyles: { role: PlayerRole; skill: number; decision: "dribble" | "pass" | "run" | "shoot" }[] = [
  { role: "Sweeper Keeper", skill: 84, decision: "pass" },
  { role: "Inverted Fullback", skill: 78, decision: "pass" },
  { role: "Ball-Playing Defender", skill: 86, decision: "pass" },
  { role: "Stopper", skill: 82, decision: "run" },
  { role: "Wingback", skill: 80, decision: "run" },
  { role: "Ball Winner", skill: 84, decision: "dribble" },
  { role: "Mezzala", skill: 87, decision: "pass" },
  { role: "Playmaker", skill: 91, decision: "pass" },
  { role: "Winger", skill: 85, decision: "dribble" },
  { role: "Advanced Forward", skill: 88, decision: "run" },
  { role: "Poacher", skill: 86, decision: "shoot" },
]

function loadTrainingState(): Record<string, { completesAt: number; boost: number }> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem("pitchside-training") || "{}") || {} } catch { return {} }
}

function loadLineupIds() {
  const club = loadClubSquad(squad)
  if (typeof window === "undefined") return club.slice(0, 11).map((p) => p.id)
  try {
    const saved = JSON.parse(localStorage.getItem("pitchside-lineup") || "null")
    const valid = Array.isArray(saved) ? saved.filter((id: unknown) => club.some((p) => p.id === id)) : []
    const ordered = valid.map((id: string) => club.find((p) => p.id === id)).filter(Boolean) as typeof club
    const bench = club.filter((p) => !valid.includes(p.id))
    return [...ordered, ...bench].slice(0, Math.max(11, Math.min(club.length, 24))).map((p) => p.id)
  } catch { return club.slice(0, 11).map((p) => p.id) }
}


function format(t: number) {
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export type MatchOutcome = { home: number; away: number }\n\nexport function MatchCanvas({ onMatchComplete }: { onMatchComplete?: (outcome: MatchOutcome) => void }) {
  const [time, setTime] = useState(120)
  const [running, setRunning] = useState(false)
  const [ball, setBall] = useState<Point>({ x: 50, y: 55 })
  const [drag, setDrag] = useState<{ start: Point; current: Point } | null>(null)
  const pointerModeRef = useRef<"ball" | "player">("ball")
  const [score, setScore] = useState({ home: 2, away: 1 })
  const [matchReward, setMatchReward] = useState<{ result: "WIN" | "DRAW" | "LOSS"; bucks: number } | null>(null)
  const [kit, setKit] = useState<{ design: string; colorA: string; colorB: string } | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pitchside-kit-collection") || "[]")
      const equipped = Array.isArray(saved) ? saved[0] : null
      if (equipped) setKit({ design: equipped.design || "Solid", colorA: equipped.colorA || "#10b981", colorB: equipped.colorB || "#08090a" })
    } catch {}
  }, [])

  const kitBackground = useMemo(() => {
    if (!kit) return "linear-gradient(145deg,#10b981,#08090a)"
    if (kit.design === "Solid") return kit.colorA
    return "linear-gradient(145deg," + kit.colorA + " 0 45%," + kit.colorB + " 45% 55%," + kit.colorA + " 55%)"
  }, [kit])
  const teamBoosts = useMemo(() => getTeamBoostModifiers(), [])
  const [passes, setPasses] = useState(0)
  const [actions, setActions] = useState(0)
  const [message, setMessage] = useState("Swipe from the ball to pass")
  const [tactics] = useState(loadTactics)
  const playerArchetypes = useMemo(() => {
    const training = loadTrainingState(); const now = Date.now()
    return loadLineupIds().map((id) => loadClubSquad(squad).find((p) => p.id === id)).filter(Boolean).slice(0, 11).map((p) => ({
      id: p!.id, name: p!.name, role: p!.style as PlayerRole, specialStyle: p!.specialStyle, specialName: p!.specialName, pos: p!.pos, stamina: p!.stamina, rating: p!.rating, attributes: p!.attributes,
      trainingBoost: training[p!.id] && now >= training[p!.id].completesAt ? training[p!.id].boost : 0,
      shopBoost: readPlayerTrainingBoost(p!.id),
      trainingActive: !!training[p!.id] && now < training[p!.id].completesAt,
    }))
  }, [])
  const trainingUnavailable = playerArchetypes.filter((p) => p.trainingActive)
  const trainingBlocked = trainingUnavailable.length > 0
  const [positions, setPositions] = useState(() => formationSlots[loadTactics().formation].map((p) => ({ ...p })))
  const [opponentPositions, setOpponentPositions] = useState(() => opponents.map((p) => ({ ...p })))
  const [ballOwner, setBallOwner] = useState<number | null>(null)
  const [opponentBallCarrier, setOpponentBallCarrier] = useState(0)
  const [ballFlight, setBallFlight] = useState<Point | null>(null)
  const [selectedDefender, setSelectedDefender] = useState<number | null>(2)
  const [injuredOpponent, setInjuredOpponent] = useState<number | null>(null)
  const [injuries, setInjuries] = useState<Record<number, "light" | "heavy">>({})
  const [opponentInjuries, setOpponentInjuries] = useState<Record<number, "light" | "heavy">>({})
  const [stamina, setStamina] = useState<Record<number, number>>(() => Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i, 100])))
  const [substituted, setSubstituted] = useState<Record<number, boolean>>({})
  const [substitutionUses, setSubstitutionUses] = useState(3)
  const [substitutionPending, setSubstitutionPending] = useState<number | null>(null)
  const [substitutionCountdown, setSubstitutionCountdown] = useState(0)
  const [turnover, setTurnover] = useState(false)
  const [passDecisionOpen, setPassDecisionOpen] = useState(false)
  const [passDecisionTargets, setPassDecisionTargets] = useState<number[]>([])
  const decisionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const decisionCooldownRef = useRef(0)
  const [shotResult, setShotResult] = useState<string | null>(null)
  const shotCooldownRef = useRef(false)
  const pitchRef = useRef<HTMLDivElement>(null)
  const lastBallRef = useRef(ball)
  const selectedDefenderRef = useRef<number | null>(2)
  const opponentCarrierRef = useRef(0)\n  const completionSentRef = useRef(false)

  useEffect(() => {
    if (trainingBlocked) { setRunning(false); return }
    if (!running || time <= 0) return
    const id = setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [running, time, trainingBlocked])

  useEffect(() => {
    if (time === 0) setRunning(false)
  }, [time])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setStamina((current) => {
        const next = { ...current }
        for (let i = 0; i < 11; i += 1) {
          if (substituted[i]) continue
          const player = playerArchetypes[i]
          const tacticalDrain = tactics.preset === "gegenpress" || tactics.preset === "high-press" ? 0.22 : 0
          const specialDrain = player?.specialStyle === "Speed Demon" ? 0.16 : player?.specialStyle === "Pressing Forward" ? 0.12 : 0
          next[i] = Math.max(0, (next[i] ?? 100) - 0.55 - tacticalDrain - specialDrain)
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, tactics.preset, substituted, playerArchetypes])

  useEffect(() => {
    if (!running || ballOwner === null || substitutionPending !== null) {
      setPassDecisionOpen(false)
      setPassDecisionTargets([])
      if (decisionTimerRef.current) {
        clearTimeout(decisionTimerRef.current)
        decisionTimerRef.current = null
      }
      return
    }

    // Every time a player receives the ball, give the user a short, explicit
    // decision moment. The match action holds while the player waits for the
    // user's swipe, so tactics shape the visible options rather than secretly
    // choosing the pass for them.
    if (decisionCooldownRef.current > Date.now()) return

    const owner = ballOwner
    const ownerPos = positions[owner]
    if (!ownerPos) return

    const scoreTarget = (p: Point, i: number) => {
      const player = playerArchetypes[i]
      if (!player || i === owner) return -Infinity
      const d = Math.hypot(ownerPos.x - p.x, ownerPos.y - p.y)
      if (d > 36) return -Infinity

      const forward = Math.max(0, ownerPos.y - p.y)
      const wide = Math.abs(p.x - 50)
      const closeBonus = Math.max(0, 24 - d) * 1.1

      if (tactics.preset === "wing-play") {
        const wideRole = player.role === "Winger" || player.role === "Wingback"
        return (wideRole ? 30 : 0) + wide * 0.35 + forward * 0.22 - d * 0.45
      }
      if (tactics.preset === "counter-attack") {
        const runner = ["Advanced Forward", "Complete Forward", "Poacher", "Target Forward", "Inside Forward"].includes(player.role)
        return (runner ? 28 : 0) + forward * 0.85 - d * 0.28
      }
      if (tactics.preset === "direct-play" || tactics.preset === "long-ball") {
        const runner = ["Advanced Forward", "Complete Forward", "Poacher", "Target Forward", "Inside Forward"].includes(player.role)
        return (runner ? 32 : 0) + forward * 0.95 - d * 0.18
      }
      if (tactics.preset === "possession" || tactics.preset === "tiki-taka") {
        const connector = ["Playmaker", "Deep-Lying Playmaker", "Mezzala", "Box-to-Box"].includes(player.role)
        return (connector ? 8 : 0) + closeBonus - d * 0.65 + forward * 0.08
      }
      return closeBonus + forward * 0.2 - d * 0.5
    }

    const targets = positions
      .map((p, i) => ({ i, score: scoreTarget(p, i) }))
      .filter(v => Number.isFinite(v.score))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(v => v.i)

    if (!targets.length) return

    setPassDecisionTargets(targets)
    setPassDecisionOpen(true)
    setMessage(
      tactics.preset === "wing-play" ? "WIDE OPTIONS — swipe to the winger or wingback" :
      tactics.preset === "counter-attack" ? "FORWARD RUNS — swipe to the runner" :
      tactics.preset === "direct-play" || tactics.preset === "long-ball" ? "FORWARD OPTIONS — choose the runner" :
      tactics.preset === "possession" || tactics.preset === "tiki-taka" ? "SHORT OPTIONS — choose a nearby support player" :
      "PASS OPTIONS — swipe to a teammate"
    )

    decisionTimerRef.current = setTimeout(() => {
      setPassDecisionOpen(false)
      setPassDecisionTargets([])
      decisionCooldownRef.current = Date.now() + 650
      setMessage("Play resumes — swipe from the ball to pass")
    }, 1800)

    return () => {
      if (decisionTimerRef.current) {
        clearTimeout(decisionTimerRef.current)
        decisionTimerRef.current = null
      }
    }
  }, [running, ballOwner, tactics.preset, substitutionPending])

  useEffect(() => {
    if (time === 0 && !completionSentRef.current) {
      completionSentRef.current = true
      consumeTeamBoostsAfterMatch()
      const outcome = score.home > score.away ? "WIN" : score.home === score.away ? "DRAW" : "LOSS"
      const reward = outcome === "WIN" ? awardMatchWin("academy") : outcome === "DRAW" ? awardMatchDraw() : null
      setMatchReward({ result: outcome, bucks: reward?.reward ?? 0 })
      onMatchComplete?.(score)
    }
  }, [time, score, onMatchComplete])

  useEffect(() => {
    if (substitutionPending === null) return
    if (substitutionCountdown <= 0) {
      setSubstitutionPending(null)
      setInjuredOpponent(null)
      setMessage("Substitution complete — play resumes")
      return
    }
    const id = setTimeout(() => setSubstitutionCountdown((n) => n - 1), 1000)
    return () => clearTimeout(id)
  }, [substitutionPending, substitutionCountdown])

  useEffect(() => {
    if (!running) return
    const base = formationSlots[tactics.formation]
    const preset = tacticalPresets[tactics.preset] || tacticalPresets.possession
    const id = setInterval(() => {
      if (passDecisionOpen) return
      const t = Date.now() / 1000
      const ballNow = lastBallRef.current
      setPositions((current) => current.map((p, i) => {
        const player = playerArchetypes[i]
        const injuryFactor = injuries[i] === "heavy" ? 0.4 : injuries[i] === "light" ? 0.7 : 1
        const fatigueFactor = Math.max(0.55, (stamina[i] ?? 100) / 100)
        const effectiveFactor = injuryFactor * fatigueFactor
        const trainingFactor = 1 + (player?.trainingBoost || 0) * 0.01
        const specialSpeed = player?.specialStyle === "Speed Demon" ? 0.16 : player?.specialStyle === "Wingback Master" ? 0.08 : player?.specialStyle === "Pressing Forward" ? 0.06 : 0
        const speedBoost = (1 + specialSpeed + ((player?.shopBoost?.stats.SPE || 0) + (player?.shopBoost?.stats.ACC || 0)) * 0.004) * (teamBoosts.team ? 1.05 : 1) * (teamBoosts.ghostFormation ? 1.08 : 1) * effectiveFactor
        const anchor = base[i] || p
        if (injuries[i] === "heavy" || substituted[i]) return { ...anchor }
        const dx = ballNow.x - p.x
        const dy = ballNow.y - p.y
        const distanceToBall = Math.hypot(dx, dy)
        const side = i % 2 === 0 ? -1 : 1
        let x = anchor.x
        let y = anchor.y

        // Start from the chosen formation, then add role-specific movement.
        if (tactics.preset === "possession" || tactics.preset === "tiki-taka") {
          x += Math.sin(t * (tactics.preset === "tiki-taka" ? 1.5 : 0.7) + i) * 2
          y += Math.cos(t * 0.7 + i) * 2
          if (distanceToBall < 32 && i !== ballOwner) {
            x += dx * 0.18
            y += dy * 0.12
          }
        }

        if (tactics.preset === "gegenpress" || tactics.preset === "high-press") {
          const chase = i < 3 ? 0.32 : 0.12
          x += dx * chase
          y += dy * chase
          y -= tactics.preset === "high-press" ? 7 : 4
        }

        if (tactics.preset === "counter-attack") {
          y -= (player.pos === "FWD" ? 15 : i === 1 ? 8 : 2) * trainingFactor * speedBoost
          if (i === 0 || i === 1) x += side * 3
        }

        if (tactics.preset === "wing-play") {
          if (player.role === "Winger" || player.role === "Wingback") {
            x = 50 + side * 34
            y -= 5
          } else {
            x = 50 + (x - 50) * 0.78
          }
        }

        if (tactics.preset === "low-block") {
          y += 11
          x = 50 + (x - 50) * 0.72
          if (distanceToBall < 35) {
            x += dx * 0.08
            y += dy * 0.06
          }
        }

        if (tactics.preset === "long-ball") {
          if (player.pos === "FWD") {
            y -= 18
            x += side * 4
          } else if (i === 1 || i === 4) {
            y -= 6
          }
        }

        if (tactics.preset === "direct-play") {
          y -= (player.pos === "FWD" ? 13 : 4) * trainingFactor * speedBoost
        }

        // Defensive AI: every unselected defender keeps working even while the user
        // controls one defender. The selected defender is the only one that aggressively
        // closes the opponent with the ball.
        const opponentCarrier = opponentPositions.reduce((best, op, oi) => {
          const d = Math.hypot(ballNow.x - op.x, ballNow.y - op.y)
          return d < best.distance ? { index: oi, distance: d } : best
        }, { index: 0, distance: Infinity })

        const isSelected = selectedDefenderRef.current === i
        const defensiveRole = ["Ball Winner", "Stopper", "Ball-Playing Defender", "Inverted Fullback", "Wingback"].includes(player.role)
        if (ballOwner === null) {
          if (player?.specialStyle === "Pressing Forward" && opponentCarrier.distance < 34) {
            x += (opponentPositions[opponentCarrier.index].x - p.x) * 0.22
            y += (opponentPositions[opponentCarrier.index].y - p.y) * 0.22
          }
          if (player?.specialStyle === "Wall" && opponentCarrier.distance < 30) {
            x += (50 - p.x) * 0.08
            y += (60 - p.y) * 0.08
          }
          if (isSelected) {
            // Instant user-controlled press: no loading/selection delay.
            x += (ballNow.x - p.x) * 0.58
            y += (ballNow.y - p.y) * 0.58
          } else {
            // Cover the lane between the opponent carrier and the goal, not the ball blindly.
            const carrier = opponentPositions[opponentCarrier.index]
            const coverX = 50 + (carrier.x - 50) * (defensiveRole ? 0.72 : 0.48)
            const coverY = carrier.y + (defensiveRole ? 10 : 16)
            x += (coverX - p.x) * 0.16
            y += (coverY - p.y) * 0.14
            if (defensiveRole && opponentCarrier.distance < 24) {
              x += (carrier.x - p.x) * 0.08
              y += (carrier.y - p.y) * 0.08
            }
          }
        }

        // Role behavior remains visible regardless of team preset.
        if (player.role === "Winger") x += side * 8
        if (player.role === "Inside Forward") x += side * -5
        if (player.role === "Mezzala") x += side * 5
        if (player.role === "Playmaker" || player.role === "Deep-Lying Playmaker") {
          y += 4
          if (distanceToBall < 30) x += dx * 0.1
        }
        if (player.role === "Ball Winner" || player.role === "Pressing Forward") {
          x += dx * 0.2
          y += dy * 0.2
        }
        if (player.role === "Wingback") x += side * 7
        if (player.role === "Holding Midfielder" || player.role === "Ball-Playing Defender" || player.role === "Stopper") {
          y += preset.line * 0.45
        }

        return {
          x: Math.max(7, Math.min(93, anchor.x + (x - anchor.x) * injuryFactor)),
          y: Math.max(7, Math.min(92, anchor.y + (y - anchor.y) * injuryFactor)),
        }
      }))

      // The opponent owns the visible ball during defense.
      if (ballOwner === null) {
        const carrier = opponentPositions[opponentCarrierRef.current]
        if (carrier) {
          lastBallRef.current = carrier
          setBall({ ...carrier })
        }
      }

      // Defensive action is automatic. The defender decides between a safe
      // standing challenge and a slide when he is outside the carrier's body line.
      // A hard slide is reserved for a closing angle and can cause contact/injury.
      if (ballOwner === null && selectedDefenderRef.current !== null) {
        setPositions((current) => {
          const defender = current[selectedDefenderRef.current!]
          const carrierIndex = opponentCarrierRef.current
          const carrier = opponentPositions[carrierIndex]
          if (!defender || !carrier) return current
          const dx = carrier.x - defender.x
          const dy = carrier.y - defender.y
          const distance = Math.hypot(dx, dy)
          const frontAngle = dy > -2
          const outsideBall = Math.abs(dx) > 2.2
          const slide = outsideBall && distance < 9.5
          const defenderPlayer = playerArchetypes[selectedDefenderRef.current!]
          const tackleSkill =
            (defenderPlayer?.specialStyle === "Wall" ? 0.96 : 0.76) +
            (defenderPlayer?.role === "Ball Winner" ? 0.08 : 0) +
            (defenderPlayer?.role === "Stopper" ? 0.06 : 0) + ((defenderPlayer?.shopBoost?.stats.TAC || 0) * 0.008) + ((defenderPlayer?.shopBoost?.stats.STR || 0) * 0.003) + (teamBoosts.defense ? 0.10 : 0) + (teamBoosts.team ? 0.04 : 0)
          if ((distance < 6.5 && frontAngle) || slide) {
            const hardContact = slide && tackleSkill < 0.9
            const clean = tackleSkill >= 0.86 || Math.random() > (hardContact ? 0.34 : 0.16)
            if (clean) {
              setBallOwner(selectedDefenderRef.current)
              setTurnover(true)
              setMessage(slide ? "SLIDE TACKLE WON — ball recovered cleanly" : "SAFE TACKLE WON — possession changes instantly")
              lastBallRef.current = defender
            } else {
              const injuryRoll = Math.random()
              const injury = hardContact && injuryRoll > 0.45
              const severity = injuryRoll > 0.78 ? "heavy" : "light"
              setMessage(injury ? `HARD TACKLE — ${severity} injury` : "Tackle missed — attacker keeps the ball")
              if (injury) {
                setInjuredOpponent(carrierIndex)
                setOpponentInjuries((current) => ({ ...current, [carrierIndex]: severity }))
                if (severity === "heavy") {
                  setRunning(false)
                  setSubstitutionPending(carrierIndex)
                  setSubstitutionCountdown(8)
                }
              }
            }
          }
          return current
        })
      }

      // Once a teammate receives the ball, keep it attached to that player.
      if (ballOwner !== null) {
        setPositions((current) => {
          const owner = current[ballOwner]
          if (!owner) return current
          lastBallRef.current = owner
          setBall({ x: owner.x, y: owner.y })
          return current
        })
      }

      // Opponent AI: the ball carrier makes a decision when the selected defender
      // closes in. The response depends on his player behaviour and skill.
      if (ballOwner === null) {
        setOpponentPositions((current) => current.map((p, i) => {
          const carrier = current[opponentCarrierRef.current] || p
          const dx = ballNow.x - p.x
          const dy = ballNow.y - p.y
          const d = Math.hypot(dx, dy)
          const toGoalX = 50 - p.x
          const toGoalY = 4 - p.y
          let x = p.x + dx * (d < 30 ? 0.05 : 0.025)
          let y = p.y + dy * (d < 30 ? 0.05 : 0.025)

          if (i === opponentCarrierRef.current) {
            const style = opponentStyles[i]
            const homeDefender = positions[selectedDefenderRef.current ?? 0]
            const pressureDistance = homeDefender ? Math.hypot(homeDefender.x - p.x, homeDefender.y - p.y) : 99
            const danger = Math.max(0, 1 - pressureDistance / 20)
            const skill = style.skill / 100

            if (pressureDistance < 18) {
              if (style.decision === "dribble") {
                // Dribbler takes the ball away from the defender, with better
                // escape movement at higher skill.
                const escapeX = p.x - (homeDefender?.x ?? p.x)
                const escapeY = p.y - (homeDefender?.y ?? p.y)
                x += escapeX * (0.18 + skill * 0.12)
                y += escapeY * (0.18 + skill * 0.12)
                x += Math.sin(t * 4 + i) * 1.5
                y += Math.cos(t * 4 + i) * 1.0
              } else if (style.decision === "pass") {
                // Playmakers release early toward the teammate with the clearest
                // forward/goal angle rather than waiting to be tackled.
                const target = current
                  .map((op, oi) => ({ op, oi, score: (4 - Math.abs(op.x - 50) / 18) + (op.y < p.y ? 2 : 0) }))
                  .filter(v => v.oi !== i)
                  .sort((a, b) => b.score - a.score)[0]
                if (target) {
                  setOpponentBallCarrier(target.oi)
                  opponentCarrierRef.current = target.oi
                  lastBallRef.current = target.op
                  setBall({ ...target.op })
                  setMessage(`${style.role} releases the ball before the tackle`)
                }
              } else if (style.decision === "run") {
                // Direct runners attack the defender and try to break through.
                x += toGoalX * (0.06 + skill * 0.04)
                y += toGoalY * (0.06 + skill * 0.04)
              } else {
                // Goal-focused players keep attacking the goal rather than
                // automatically avoiding the defender.
                x += toGoalX * 0.08
                y += toGoalY * 0.1
              }
            } else {
              x += toGoalX * 0.025
              y += toGoalY * 0.035
            }
          } else {
            // Off-ball opponents make supporting runs into useful passing areas.
            const support = (i - opponentCarrierRef.current) * 3
            x += (50 + support - p.x) * 0.025
            y += (ballNow.y - p.y) * 0.025
          }

          return { x: Math.max(8, Math.min(92, x)), y: Math.max(6, Math.min(88, y)) }
        }))
      }
    }, 180)
    return () => clearInterval(id)
  }, [running, tactics, ballOwner, passDecisionOpen])

  const toPct = useCallback((clientX: number, clientY: number): Point => {
    const rect = pitchRef.current?.getBoundingClientRect()
    if (!rect) return { x: 50, y: 50 }
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    }
  }, [])

  const classifySwipe = (start: Point, end: Point) => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const dist = Math.hypot(dx, dy)
    if (dist < 6) return "tap"
    if (dy < -14 && Math.abs(dx) < 30) return "shoot"
    if (dy < -7) return "through"
    return "pass"
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toPct(e.clientX, e.clientY)
    const tappedPlayer = positions.reduce<number | null>((best, player, i) => {
      const d = Math.hypot(p.x - player.x, p.y - player.y)
      if (d > 8) return best
      if (best === null) return i
      return d < Math.hypot(p.x - positions[best].x, p.y - positions[best].y) ? i : best
    }, null)
    if (tappedPlayer !== null) {
      pointerModeRef.current = "player"
      setDrag({ start: p, current: p })
    } else {
      pointerModeRef.current = "ball"
      setDrag({ start: ball, current: p })
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    setDrag({ ...drag, current: toPct(e.clientX, e.clientY) })
  }

  const onPointerUp = () => {
    if (trainingBlocked) return
    if (!drag) return
    const dist = Math.hypot(drag.current.x - drag.start.x, drag.current.y - drag.start.y)

    // A tap on one of our players instantly switches the controlled defender.
    // No animation or loading delay: the icon appears on the same interaction.
    if (dist <= 6) {
      const tapped = pointerModeRef.current === "player" ? positions.reduce<number | null>((best, p, i) => {
        const d = Math.hypot(drag.current.x - p.x, drag.current.y - p.y)
        if (d > 8) return best
        if (best === null) return i
        return d < Math.hypot(drag.current.x - positions[best].x, drag.current.y - positions[best].y) ? i : best
      }, null) : null
      if (tapped !== null) {
        selectedDefenderRef.current = tapped
        setSelectedDefender(tapped)
        setMessage(ballOwner === null
          ? `${playerArchetypes[tapped]?.name ?? "Defender"} selected — closing the ball carrier`
          : `${playerArchetypes[tapped]?.name ?? "Player"} selected`)
      }
      pointerModeRef.current = "ball"
      setDrag(null)
      return
    }

    if (dist > 6) {
      const nextBall = { ...drag.current }
      const action = classifySwipe(drag.start, nextBall)
      const swipeTargetIndex = passDecisionTargets
        .filter((i) => i !== ballOwner && positions[i])
        .map((i) => ({ i, d: Math.hypot(positions[i].x - nextBall.x, positions[i].y - nextBall.y) }))
        .sort((a, b) => a.d - b.d)[0]?.i ?? null

      // Shooting is role-based: the player decides how to finish based on his
      // role/special style, while the Guardian goalkeeper reacts to the shot.
      if (action === "shoot" && ballOwner !== null && !shotCooldownRef.current) {
        shotCooldownRef.current = true
        setTimeout(() => { shotCooldownRef.current = false }, 900)

        const shooter = playerArchetypes[ballOwner]
        const shooterRole = shooter?.role
        const special = shooter?.specialStyle
        const distance = Math.hypot(50 - (positions[ballOwner]?.x ?? 50), 4 - (positions[ballOwner]?.y ?? 50))
        let accuracy = 0.58
        let power = 0.65
        const shooterInjury = injuries[ballOwner]
        if (shooterInjury === "light") { accuracy *= 0.70; power *= 0.70 }
        if (shooterInjury === "heavy") { accuracy *= 0.40; power *= 0.40 }
        let finishText = "SHOT"

        if (special === "Long-Range Sniper") {
          accuracy = distance > 35 ? 0.91 : 0.82
          power = 0.96
          finishText = "LONG-RANGE SNIPER"
        } else if (special === "Hammer") {
          accuracy = 0.78
          power = 0.95
          finishText = "HAMMER HEADER"
        } else if (special === "Power Finisher") {
          accuracy = 0.86
          power = 0.99
          finishText = "POWER FINISHER"
        } else if (special === "Dribble King") {
          accuracy = 0.84
          power = 0.82
          finishText = "DRIBBLE KING FINISH"
        } else if (special === "Maestro") {
          accuracy = 0.76
          power = 0.70
          finishText = "MAESTRO PLACER"
        } else if (shooterRole === "Poacher") {
          accuracy = 0.9
          power = 0.7
          finishText = "POACHER FINISH"
        } else if (shooterRole === "Inside Forward") {
          accuracy = 0.82
          power = 0.78
          finishText = "INSIDE-FORWARD FINISH"
        } else if (shooterRole === "Advanced Forward" || shooterRole === "Complete Forward") {
          accuracy = 0.8
          power = 0.84
          finishText = "FORWARD FINISH"
        } else if (shooterRole === "Target Forward") {
          accuracy = 0.72
          power = 0.88
          finishText = "TARGET-MAN FINISH"
        } else if (shooterRole === "Playmaker" || shooterRole === "Deep-Lying Playmaker") {
          accuracy = 0.64
          power = 0.62
          finishText = "PLACED SHOT"
        }

        // Guardian reads the shot with elite positioning/reactions.
        const captainId = typeof window !== "undefined" ? localStorage.getItem("pitchside-captain-id") || playerArchetypes[0]?.id : playerArchetypes[0]?.id
        const shooterCaptainBoost = teamBoosts.captain && shooter?.id === captainId ? 0.10 : 0
        accuracy = Math.min(0.99, accuracy + (shooter?.trainingBoost || 0) * 0.015 + (shooter?.shopBoost?.stats.SHO || 0) * 0.008 + (shooter?.shopBoost?.stats.CON || 0) * 0.003 + shooterCaptainBoost + (teamBoosts.team ? 0.05 : 0))
        power = Math.min(0.99, power + (shooter?.trainingBoost || 0) * 0.015 + (shooter?.shopBoost?.stats.SHO || 0) * 0.006 + (shooter?.shopBoost?.stats.STR || 0) * 0.003 + shooterCaptainBoost + (teamBoosts.team ? 0.05 : 0))
        const guardianOnPitch = playerArchetypes.some((p) => p?.specialStyle === "Guardian")
        const guardianSave = 0.22 + (guardianOnPitch ? 0.08 : 0) + (special === "Long-Range Sniper" ? 0.03 : 0) + (teamBoosts.goalkeeper ? 0.10 : 0) + (teamBoosts.team ? 0.03 : 0)
        const saved = Math.random() > accuracy || Math.random() < guardianSave
        const rebound = saved && Math.random() < (power > 0.88 ? 0.46 : 0.28)

        if (!saved) {
          setScore((s) => ({ ...s, home: s.home + 1 }))
          setShotResult("GOAL")
          setMessage(`${finishText} — GOAL!`)
          setTurnover(false)
        } else if (rebound) {
          setShotResult("REBOUND")
          setMessage(`GUARDIAN SAVE — rebound spills loose!`)
          setBallOwner(null)
          opponentCarrierRef.current = 0
          setOpponentBallCarrier(0)
          setTurnover(true)
          lastBallRef.current = { x: 50, y: 14 }
          setBall({ x: 50, y: 14 })
          setBallFlight({ x: 50, y: 14 })
        } else {
          setShotResult("SAVED")
          setMessage(`GUARDIAN SAVE — ${finishText.toLowerCase()} denied`)
          setBallOwner(null)
          opponentCarrierRef.current = 0
          setOpponentBallCarrier(0)
          setTurnover(true)
          lastBallRef.current = { x: 50, y: 9 }
          setBall({ x: 50, y: 9 })
          setBallFlight({ x: 50, y: 9 })
        }
        setActions((n) => n + 1)
        setDrag(null)
        return
      }

      lastBallRef.current = nextBall
      setBallFlight(nextBall)
      setBall(nextBall)
      setPasses((n) => n + 1)
      setActions((n) => n + 1)
      // Find the teammate the swipe is trying to reach. The selected tactic
      // now changes the preferred passing lane, so the same gesture produces
      // different football: possession favors close support, counters/direct play
      // favor forward runners, wing play favors wide players, and long ball favors
      // the highest forward option.
      const passerIndex = ballOwner
      const tacticalTargetScore = (p: Point, i: number) => {
        const d = Math.hypot(nextBall.x - p.x, nextBall.y - p.y)
        if (d > 36) return -Infinity
        const player = playerArchetypes[i]
        if (!player || i === passerIndex) return -Infinity
        const forward = Math.max(0, 55 - p.y)
        const wide = Math.abs(p.x - 50)
        const roleBonus =
          tactics.preset === "wing-play" && (player.role === "Winger" || player.role === "Wingback") ? 30 :
          (tactics.preset === "long-ball" || tactics.preset === "direct-play" || tactics.preset === "counter-attack") &&
            ["Advanced Forward", "Complete Forward", "Poacher", "Target Forward", "Inside Forward"].includes(player.role) ? 26 :
          (tactics.preset === "possession" || tactics.preset === "tiki-taka") &&
            ["Playmaker", "Deep-Lying Playmaker", "Mezzala", "Box-to-Box"].includes(player.role) ? 10 : 0
        const widthBonus = tactics.preset === "wing-play" ? wide * 0.28 : 0
        const specialPassBonus = player?.specialStyle === "Maestro" ? 16 : player?.specialStyle === "Mezzala" ? 10 : player?.specialStyle === "Dribble King" ? 7 : 0
        const distanceWeight =
          tactics.preset === "possession" || tactics.preset === "tiki-taka" ? -d * 1.05 :
          tactics.preset === "long-ball" ? -d * 0.12 : -d * 0.4
        const forwardWeight =
          tactics.preset === "possession" || tactics.preset === "tiki-taka" ? forward * 0.08 :
          tactics.preset === "counter-attack" || tactics.preset === "direct-play" || tactics.preset === "long-ball" ? forward * 0.65 :
          forward * 0.2
        return roleBonus + specialPassBonus + widthBonus + distanceWeight + forwardWeight
      }

      let targetIndex: number | null = null
      let bestTargetScore = -Infinity
      const allowedTargets = passDecisionTargets.length ? passDecisionTargets : positions.map((_, i) => i)
      allowedTargets.forEach((i) => {
        const p = positions[i]
        if (!p) return
        const score = tacticalTargetScore(p, i)
        if (score > bestTargetScore) {
          bestTargetScore = score
          targetIndex = i
        }
      })
      if (swipeTargetIndex !== null && allowedTargets.includes(swipeTargetIndex)) {
        targetIndex = swipeTargetIndex
      }

      // Passing quality: ordinary passes can be intercepted; elite special passers
      // make the ball much harder to read, with only rare subtle errors.
      const passer = ballOwner !== null ? playerArchetypes[ballOwner] : null
      const passerPos = ballOwner !== null ? positions[ballOwner] : null
      const targetPos = targetIndex !== null ? positions[targetIndex] : null
      let passQuality = 0.58 + ((passer?.attributes?.passing || passer?.rating || 70) / 100) * 0.28
      // Tactical identity affects execution as well as movement.
      if (tactics.preset === "possession" || tactics.preset === "tiki-taka") passQuality += 0.06
      if (tactics.preset === "counter-attack") passQuality += 0.02
      if (tactics.preset === "long-ball") passQuality -= 0.05
      if (tactics.preset === "wing-play" && targetIndex !== null) {
        const target = playerArchetypes[targetIndex]
        if (target?.role === "Winger" || target?.role === "Wingback") passQuality += 0.10
      }
      const passerInjury = ballOwner !== null ? injuries[ballOwner] : undefined
      if (passerInjury === "light") passQuality *= 0.70
      if (passerInjury === "heavy") passQuality *= 0.40
      if (passer?.specialStyle === "Maestro") passQuality = 0.98
      else if (passer?.specialStyle === "Mezzala") passQuality = 0.90
      else if (passer?.role === "Playmaker" || passer?.role === "Deep-Lying Playmaker") passQuality = 0.84
      else if (passer?.role === "Ball-Playing Defender") passQuality = 0.80
      const captainId = typeof window !== "undefined" ? localStorage.getItem("pitchside-captain-id") || playerArchetypes[0]?.id : playerArchetypes[0]?.id
      const passerCaptainBoost = teamBoosts.captain && passer?.id === captainId ? 0.10 : 0
      passQuality = Math.max(0.25, Math.min(0.99, passQuality + (passer?.trainingBoost || 0) * 0.015 + (passer?.shopBoost?.stats.PAS || 0) * 0.009 + (passer?.shopBoost?.stats.CON || 0) * 0.002 + passerCaptainBoost + (teamBoosts.team ? 0.05 : 0)))

      let intercepted = false
      if (passerPos && targetPos && targetIndex !== null) {
        const vx = targetPos.x - passerPos.x
        const vy = targetPos.y - passerPos.y
        const len = Math.hypot(vx, vy)
        const defenderOnLine = len > 1 && opponentPositions.some((op) => {
          const wx = op.x - passerPos.x
          const wy = op.y - passerPos.y
          const projection = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (len * len)))
          const cx = passerPos.x + vx * projection
          const cy = passerPos.y + vy * projection
          return Math.hypot(op.x - cx, op.y - cy) < 5.5
        })
        if (defenderOnLine) {
          const errorChance = 0.03 + (1 - passQuality) * 0.38
          const dribbleProtection = passer?.specialStyle === "Dribble King" ? 0.45 : 1
          intercepted = Math.random() < errorChance * dribbleProtection
        }
      }

      if (intercepted) {
        const interceptor = opponentPositions
          .map((op, oi) => ({ op, oi, d: targetPos ? Math.hypot(op.x - targetPos.x, op.y - targetPos.y) : 99 }))
          .sort((a, b) => a.d - b.d)[0]
        setBallOwner(null)
        setBallFlight(interceptor.op)
        opponentCarrierRef.current = interceptor.oi
        setOpponentBallCarrier(interceptor.oi)
        lastBallRef.current = interceptor.op
        setBall({ ...interceptor.op })
        setTurnover(true)
        setMessage(passer?.specialStyle
          ? `${passer.specialStyle} pass has a slight execution error — defender gets a touch`
          : "PASS INTERCEPTED — defender wins possession")
      } else {
        setBallOwner(targetIndex)
        setBallFlight(nextBall)
        setTurnover(false)
        if (passer?.specialStyle === "Maestro") {
          setMessage("MAESTRO PASS — weighted around the defender")
        } else if (passer?.specialStyle === "Mezzala") {
          setMessage("MEZZALA PASS — half-space delivery beats the interception")
        }
      }

      // The selected tactic changes what happens after the gesture.
      // Keep interception feedback visible instead of overwriting it.
      if (intercepted) {
        setMessage(passer?.specialStyle ? `${passer.specialStyle} pass has a slight execution error — defender gets a touch` : "PASS INTERCEPTED — defender wins possession")
      } else if (tactics.preset === "possession" || tactics.preset === "tiki-taka") {
        setMessage(action === "through" ? "Threaded pass — teammates rotate into support" : "Short pass — teammates move into passing lanes")
      } else if (tactics.preset === "gegenpress" || tactics.preset === "high-press") {
        setMessage("Turnover pressure — nearest players hunt the ball")
        setTurnover(true)
      } else if (tactics.preset === "counter-attack") {
        setMessage("Counter launched — forwards sprint beyond the line")
      } else if (tactics.preset === "wing-play") {
        setMessage("Wide overload — winger and wingback attack the flank")
      } else if (tactics.preset === "low-block") {
        setMessage("Low block — team stays compact behind the ball")
      } else if (tactics.preset === "long-ball") {
        setMessage("Long ball — target forward attacks the space")
      } else {
        setMessage("Direct play — runners push forward")
      }

      if (action === "through" && nextBall.y < 22 && Math.abs(nextBall.x - 50) < 22 && ballOwner !== null) {
        setScore((s) => ({ ...s, home: s.home + 1 }))
        setShotResult("GOAL")
        setMessage("GOAL! Tactical move finished.")
        setBallOwner(null)
      }
    }
    setDrag(null)
  }

  const substitutePlayer = (index: number) => {
    if (substitutionUses <= 0 || substituted[index]) return
    setSubstituted((current) => ({ ...current, [index]: true }))
    setStamina((current) => ({ ...current, [index]: 0 }))
    setInjuries((current) => {
      const next = { ...current }
      delete next[index]
      return next
    })
    setSubstitutionUses((uses) => Math.max(0, uses - 1))
    if (ballOwner === index) {
      setBallOwner(null)
      setMessage("Player substituted — possession resets")
    } else {
      setMessage((playerArchetypes[index]?.name || "Player") + " substituted")
    }
    if (selectedDefenderRef.current === index) {
      selectedDefenderRef.current = null
      setSelectedDefender(null)
    }
  }

  const reset = () => {
    completionSentRef.current = false
    setTime(120)
    setRunning(false)
    setMatchReward(null)
    const center = { x: 50, y: 55 }
    lastBallRef.current = center
    setBall(center)
    setBallFlight(null)
    setOpponentPositions(opponents.map((p) => ({ ...p })))
    setBallOwner(null)
    setOpponentBallCarrier(0)
    opponentCarrierRef.current = 0
    setInjuredOpponent(null)
    selectedDefenderRef.current = 2
    setSelectedDefender(2)
    setInjuries({})
    setOpponentInjuries({})
    setStamina(Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i, 100])))
    setSubstituted({})
    setSubstitutionUses(3)
    setSubstitutionPending(null)
    setSubstitutionCountdown(0)
    setTurnover(false)
    setPassDecisionOpen(false)
    setPassDecisionTargets([])
    decisionCooldownRef.current = 0
    if (decisionTimerRef.current) {
      clearTimeout(decisionTimerRef.current)
      decisionTimerRef.current = null
    }
    setShotResult(null)
    shotCooldownRef.current = false
    setPasses(0)
    setActions(0)
    setMessage("Swipe from the ball to pass")
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-4">
      {matchReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-primary/30 bg-card p-6 text-center shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">MATCH COMPLETE</div>
            <div className="mt-2 text-4xl font-black">{matchReward.result}</div>
            <div className="mt-2 text-sm text-muted-foreground">Final score {score.home} — {score.away}</div>
            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">MATCH REWARD</div>
              <div className="mt-1 text-3xl font-black text-primary">+{matchReward.bucks.toLocaleString()} BUX</div>
              {matchReward.result === "LOSS" && <div className="mt-1 text-[10px] text-muted-foreground">No Bux reward for a loss.</div>}
            </div>
            <Button onClick={() => setMatchReward(null)} className="mt-5 h-11 w-full rounded-xl font-black">CONTINUE</Button>
          </div>
        </div>
      )}

      {trainingBlocked ? <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-center"><p className="text-xs font-black text-amber-300">PLAYER IN TRAINING</p><p className="mt-1 text-[10px] text-muted-foreground">{trainingUnavailable.map((p) => p.name).join(", ")} cannot play until training completes. Return to Tactics and choose an available player.</p></div> : null}
      <div className="mt-4 rounded-xl border border-primary/20 bg-card/70 px-3 py-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Formation</span><span className="font-bold text-primary">{tactics.formation}</span>
          <span>Preset</span><span className="font-bold text-accent">{tactics.preset.replace("-", " ")}</span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Shape controls positioning · instruction controls team behaviour</p>
      </div>

      {/* Scoreboard */}
      <div className="flex items-center justify-between pt-6">
        <div className="text-center">
          <p className="font-display text-sm font-bold">AUR</p>
          <p className="font-display text-3xl font-black tabular-nums text-glow-cyan">{score.home}</p>
        </div>

        <div className="flex flex-col items-center">
          <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest", shotResult === "GOAL" ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive")}>
            {shotResult ? shotResult : "Sudden Death"}
          </span>
          <p
            className={cn(
              "mt-1 font-mono text-2xl font-bold tabular-nums",
              time <= 15 ? "text-destructive" : time <= 45 ? "text-chart-4" : "text-foreground",
            )}
          >
            {format(time)}
          </p>
        </div>

        <div className="text-center">
          <p className="font-display text-sm font-bold">PLS</p>
          <p className="font-display text-3xl font-black tabular-nums">{score.away}</p>
        </div>
      </div>

      {/* Pitch viewport */}
      <div
        ref={pitchRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="pitch-bg relative mt-4 aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-3xl border border-accent/20"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* pitch markings */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-white/15" />
        <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/15" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
        <div className="pointer-events-none absolute left-1/2 top-3 h-14 w-28 -translate-x-1/2 rounded-b-lg border border-t-0 border-white/15" />
        <div className="pointer-events-none absolute bottom-3 left-1/2 h-14 w-28 -translate-x-1/2 rounded-t-lg border border-b-0 border-white/15" />

        {passDecisionOpen && ballOwner !== null && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {passDecisionTargets.map((i) => {
              const target = positions[i]
              if (!target) return null
              const player = playerArchetypes[i]
              return (
                <g key={i}>
                  <line
                    x1={positions[ballOwner]?.x ?? ball.x}
                    y1={positions[ballOwner]?.y ?? ball.y}
                    x2={target.x}
                    y2={target.y}
                    className={cn(
                      "stroke-primary",
                      tactics.preset === "wing-play" && (player?.role === "Winger" || player?.role === "Wingback") ? "opacity-100" : "opacity-60"
                    )}
                    strokeWidth="1.1"
                    strokeDasharray="2 1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={target.x} cy={target.y} r="2.5" className="fill-primary/20 stroke-primary" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
                </g>
              )
            })}
          </svg>
        )}

        {/* gesture arrow */}
        {drag && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4 Z" className="fill-primary" />
              </marker>
            </defs>
            <line
              x1={drag.start.x}
              y1={drag.start.y}
              x2={drag.current.x}
              y2={drag.current.y}
              className="stroke-primary"
              strokeWidth="1"
              strokeDasharray="2 2"
              markerEnd="url(#arrow)"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {substitutionPending !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm">
            <div className="w-full rounded-2xl border border-primary/30 bg-card p-5 text-center shadow-2xl">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-destructive">Heavy Injury</div>
              <div className="mt-2 text-lg font-black">Substitution</div>
              <p className="mt-1 text-[11px] text-muted-foreground">The opponent can see the substitution before play resumes.</p>
              <div className="mx-auto my-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary text-2xl font-black">{substitutionCountdown}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Preparing replacement</div>
            </div>
          </div>
        )}

        {/* opponents — the ball carrier reacts to pressure instead of waiting for a tap */}
        {opponentPositions.map((p, i) => (
          <div
            key={`o${i}`}
            className={cn("absolute -translate-x-1/2 -translate-y-1/2 text-center", injuredOpponent === i && "opacity-50")}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {opponentInjuries[i] ? <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] font-black text-destructive">{opponentInjuries[i] === "heavy" ? "⚠ HEAVY" : "⚠ LIGHT"}</span> : null}
            <div className={cn("relative mx-auto h-7 w-5", running && "animate-[bounce_0.55s_ease-in-out_infinite]", opponentCarrierRef.current === i && "scale-110")}>
              <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white/60 bg-amber-200" />
              <span className="absolute left-1/2 top-2 h-3.5 w-4 -translate-x-1/2 rounded-t-md bg-destructive border border-white/30" />
              <span className="absolute left-1/2 top-5 h-2.5 w-1 -translate-x-1.5 -rotate-6 bg-slate-900" />
              <span className="absolute left-1/2 top-5 h-2.5 w-1 translate-x-0.5 rotate-6 bg-slate-900" />
            </div>
            <span className="block whitespace-nowrap rounded bg-background/70 px-1 text-[6px] font-bold text-foreground">{opponentStyles[i].role}</span>
          </div>
        ))}

        {/* player archetypes — the selected defender gets an instant control ring */}
        {playerArchetypes.map((p, i) => (
          <div
            key={`a${p.name}`}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${positions[i]?.x ?? p.x}%`, top: `${positions[i]?.y ?? p.y}%` }}
          >
            {injuries[i] ? <div className="mb-0.5 text-[7px] font-black text-destructive">{injuries[i] === "heavy" ? "⚠ HEAVY INJURY" : "⚠ LIGHT INJURY"}</div> : null}
            {p.specialStyle ? <div className="mb-0.5 text-[7px] font-black uppercase text-chart-4"><Star className="mr-0.5 inline h-2.5 w-2.5 fill-current" />{p.specialName}</div> : null}<div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/40 bg-primary text-[9px] font-bold text-primary-foreground">
              {i + 1}
            </div>
            <span className="mt-0.5 block whitespace-nowrap rounded bg-background/65 px-1 text-[7px] font-semibold text-foreground">
              {p.role}
            </span>
          </div>
        ))}

        {/* tactical status */}
        {running && (
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-background/70 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-primary backdrop-blur-sm">
            {turnover ? "TURNOVER — COUNTER" : ballOwner === null ? "DEFEND — AUTO TACKLE" : passDecisionOpen ? (
              tactics.preset === "wing-play" ? "WIDE OPTIONS" :
              tactics.preset === "counter-attack" ? "FORWARD RUNS" :
              tactics.preset === "direct-play" || tactics.preset === "long-ball" ? "FORWARD OPTIONS" :
              tactics.preset === "possession" || tactics.preset === "tiki-taka" ? "SHORT OPTIONS" : "PASS OPTIONS"
            ) : tactics.preset.replace("-", " ")}
          </div>
        )}

        {/* equipped home kit */}
        {kit && positions.slice(0, 11).map((p, i) => (
          <div key={"kit-" + i} className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 shadow-lg" style={{ left: p.x + "%", top: p.y + "%", width: i === 0 ? 24 : 20, height: i === 0 ? 24 : 20, background: kitBackground }}>
            <span className="text-[6px] font-black text-white drop-shadow">{i + 1}</span>
          </div>
        ))}

        {/* ball */}
        <span
          className={cn("absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300", ballFlight && "animate-pulse")}
          style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
        />

        {/* hint */}
        {!drag && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
            <Hand className="h-3.5 w-3.5" />
            {ballOwner === null ? "Defenders tackle automatically when positioned correctly" : passDecisionOpen ? "Swipe from the ball to choose a highlighted option" : "Swipe from the ball to pass"}
          </div>
        )}
      </div>

      <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground">
        {message}<span className="mt-1 block text-[9px] opacity-70">{ballOwner === null ? "Dribblers evade, playmakers release passes, runners attack the defender." : "Tap a teammate to switch control instantly."}</span>
      </div>

      {/* passes counter */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {playerArchetypes.slice(0, 6).map((p) => (
          <div key={p.name} className="rounded-xl border border-border bg-card/70 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold">{p.name}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-primary">{p.role}</span>
            </div>
            <div className="mt-1 text-[9px] text-muted-foreground">
              {p.role === "Winger" ? "Stays wide and looks for crosses" : p.role === "Inside Forward" ? "Cuts inside to attack goal" : p.role === "Playmaker" ? "Finds passing lanes" : p.role === "Ball Winner" ? "Presses and wins possession" : p.role === "Mezzala" ? "Attacks the half-space" : p.role === "Wingback" ? "Overlaps and recovers" : "Follows role instructions"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card/70 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Gesture passes
        </span>
        <span className="font-display text-sm font-bold tabular-nums text-primary">{passes} / {actions}</span>
      </div>

      {/* squad fitness */}
      <div className="mt-3 rounded-xl border border-border bg-card/70 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider">Squad Fitness</span>
          <span className="text-[10px] font-bold text-primary">{substitutionUses} substitutions left</span>
        </div>
        <div className="space-y-2">
          {playerArchetypes.slice(0, 11).map((player, i) => {
            const fit = Math.round(stamina[i] ?? 100)
            const injured = injuries[i]
            const isOut = substituted[i]
            return (
              <div key={player.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="truncate">{player.name}</span>
                    <span className={fit < 30 ? "text-destructive" : "text-muted-foreground"}>{isOut ? "OUT" : injured === "heavy" ? "INJURED" : String(fit) + "%"}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: String(fit) + "%" }} />
                  </div>
                </div>
                <Button type="button" size="sm" variant="outline" disabled={substitutionUses <= 0 || isOut} onClick={() => substitutePlayer(i)} className="h-7 rounded-lg px-2 text-[8px] font-black uppercase">
                  {isOut ? "Subbed" : injured === "heavy" ? "Replace" : "Substitute"}
                </Button>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[9px] text-muted-foreground">Fatigue reduces movement. Light injuries reduce attributes by 30%; heavy injuries reduce them by 60% and can be replaced.</p>
      </div>

      {/* controls */}
      <div className="mt-4 flex gap-2">
        <Button
          onClick={() => setRunning((r) => !r)}
          disabled={time === 0}
          className="h-12 flex-1 gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {running ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          {running ? "Pause" : time === 0 ? "Full time" : "Kick off"}
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          className="h-12 w-12 rounded-xl border-border bg-card/70 p-0"
          aria-label="Reset match"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
