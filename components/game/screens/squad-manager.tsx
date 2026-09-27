"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, Layers, Dumbbell, Timer, Shield, Swords, SlidersHorizontal, Banknote, Gem, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScreenHeader, Card, Pill, StatBar } from "@/components/game/ui-bits"
import { squad, wallet, type Player } from "@/components/game/data"
import { formatAuctionTime, readAuctionPlayers, saveAuctionPlayers, renameAuctionPlayer, type AuctionPlayer } from "@/lib/auction"
import { cn } from "@/lib/utils"
import { readWallet, saveWallet } from "@/lib/economy"
import { MAX_SQUAD_SIZE, SQUAD_CAPACITIES, SQUAD_UPGRADE_GEMS, addAuctionPlayer, getSquadCapacity, loadClubSquad, saveClubSquad, upgradeSquadCapacity } from "@/lib/club-squad"
import { readPlayerTrainingBoost, type TrainingStatKey } from "@/lib/training-boosts"

type View = "squad" | "styles" | "training" | "market"
type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "4-1-4-1"
type TacticalPresetId = "possession" | "tiki-taka" | "gegenpress" | "counter-attack" | "direct-play" | "wing-play" | "long-ball" | "high-press" | "low-block" | "balanced"
type TacticalPreset = { id: TacticalPresetId; name: string; formation: Formation; instruction: "Possession" | "Gegenpress" | "Counter Attack" | "Low Block" | "Direct Play"; description: string; motion: string }
type TrainingTier = "light" | "heavy" | "super"
type TrainingRecord = { playerId: string; tier: TrainingTier; boost: number; startedAt: number; completesAt: number; weeklyUnlockAt: number }
type TrainingLedger = { completedKeys: string[]; lockedUntil: number }

const tacticalPresets: TacticalPreset[] = [
  { id: "possession", name: "Possession", formation: "4-3-3", instruction: "Possession", description: "Short passes, close support and patient buildup.", motion: "pass" },
  { id: "tiki-taka", name: "Tiki-Taka", formation: "4-3-3", instruction: "Possession", description: "Quick one-touch passing and constant rotations.", motion: "tiki" },
  { id: "gegenpress", name: "Gegenpress", formation: "4-3-3", instruction: "Gegenpress", description: "Lose it, hunt it. The team swarms the ball immediately.", motion: "press" },
  { id: "counter-attack", name: "Counter Attack", formation: "4-2-3-1", instruction: "Counter Attack", description: "Absorb pressure, then explode forward into space.", motion: "counter" },
  { id: "direct-play", name: "Direct Play", formation: "4-1-4-1" as Formation, instruction: "Direct Play", description: "Move the ball forward early and attack space quickly.", motion: "direct" },
  { id: "wing-play", name: "Wing Play", formation: "4-4-2", instruction: "Direct Play", description: "Stretch the pitch and attack through wide players.", motion: "wing" },
  { id: "long-ball", name: "Long Ball", formation: "4-2-3-1", instruction: "Direct Play", description: "Find the forward early and attack second balls.", motion: "long" },
  { id: "high-press", name: "High Press", formation: "4-3-3", instruction: "Gegenpress", description: "Push high and force mistakes near the opponent's goal.", motion: "high" },
  { id: "low-block", name: "Low Block", formation: "3-5-2", instruction: "Low Block", description: "Stay compact, protect the box and break quickly.", motion: "low" },
  { id: "balanced", name: "Balanced", formation: "4-2-3-1", instruction: "Possession", description: "A measured mix of buildup, pressing and defensive shape.", motion: "balanced" },
]

const formations: Formation[] = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "4-1-4-1"]
const TRAINING_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const SUPER_GEMS = 50
const SUPER_BUCKS = 10000
const MAX_CONCURRENT_TRAINING = 3
const TRAINING_CYCLE_LIMIT = 10
function loadTrainingState(): Record<string, TrainingRecord> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem("pitchside-training") || "{}") || {} } catch { return {} }
}
function loadTrainingLedger(): TrainingLedger {
  if (typeof window === "undefined") return { completedKeys: [], lockedUntil: 0 }
  try { return JSON.parse(localStorage.getItem("pitchside-training-ledger") || "") || { completedKeys: [], lockedUntil: 0 } } catch { return { completedKeys: [], lockedUntil: 0 } }
}
function formatRemaining(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000)); const d = Math.floor(total / 86400); const h = Math.floor((total % 86400) / 3600); const m = Math.floor((total % 3600) / 60); const s = total % 60
  if (d > 0) return d + "d " + h + "h " + m + "m"
  return h + "h " + m.toString().padStart(2, "0") + "m " + s.toString().padStart(2, "0") + "s"
}

const tabs: { id: View; label: string; icon: typeof Users }[] = [
  { id: "training", label: "Training", icon: Dumbbell },
  { id: "styles", label: "Formation", icon: Layers },
  { id: "squad", label: "Tactics", icon: SlidersHorizontal },
]

const posColor: Record<string, string> = {
  GK: "bg-chart-4/20 text-chart-4",
  DEF: "bg-primary/15 text-primary",
  MID: "bg-accent/15 text-accent",
  FWD: "bg-destructive/20 text-destructive",
}

function staminaAccent(v: number): "cyan" | "emerald" | "amber" | "red" {
  if (v < 40) return "red"
  if (v < 70) return "amber"
  return "emerald"
}

const playerFaceImages: Record<string, string> = {
  p1: "https://i.pravatar.cc/240?img=12", p2: "https://i.pravatar.cc/240?img=11", p3: "https://i.pravatar.cc/240?img=13",
  p4: "https://i.pravatar.cc/240?img=14", p5: "https://i.pravatar.cc/240?img=15", p6: "https://i.pravatar.cc/240?img=16",
  p7: "https://i.pravatar.cc/240?img=17", p8: "https://i.pravatar.cc/240?img=18", p9: "https://i.pravatar.cc/240?img=19",
  p10: "https://i.pravatar.cc/240?img=20", p11: "https://i.pravatar.cc/240?img=21", p12: "https://i.pravatar.cc/240?img=22",
  p13: "https://i.pravatar.cc/240?img=23", p14: "https://i.pravatar.cc/240?img=24", p15: "https://i.pravatar.cc/240?img=25",
  p16: "https://i.pravatar.cc/240?img=26", p17: "https://i.pravatar.cc/240?img=27", p18: "https://i.pravatar.cc/240?img=28",
  p19: "https://i.pravatar.cc/240?img=29", p20: "https://i.pravatar.cc/240?img=30", p21: "https://i.pravatar.cc/240?img=31",
  p22: "https://i.pravatar.cc/240?img=32", p23: "https://i.pravatar.cc/240?img=33", p24: "https://i.pravatar.cc/240?img=34",
}

function PlayerFace({ player }: { player: Player }) {
  const initials = player.name.replace(/[^A-Za-z ]/g, "").split(" ").map((n) => n[0]).join("").slice(0, 2)
  const face = playerFaceImages[player.id]
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/30 bg-slate-800 shadow-inner">
      {face ? (
        <img
          src={face}
          alt={player.name}
          className="h-full w-full object-cover object-top"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-700 text-sm font-black">{initials}</div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
    </div>
  )
}

function getPlayerCardStats(player: Player, trainingBoost = 0, shopStats: Partial<Record<TrainingStatKey, number>> = {}) {
  const r = player.rating
  const role = player.style
  const base = {
    SPE: r,
    ACC: r,
    STA: player.stamina,
    STR: r,
    CON: r,
    PAS: r,
    SHO: r,
    TAC: r,
  }
  const bonus: Record<string, Partial<typeof base>> = {
    "Sweeper Keeper": { SPE: r - 4, ACC: r - 5, STR: r - 1, CON: r + 1, PAS: r + 2, SHO: r - 28, TAC: r - 4 },
    "Inverted Fullback": { SPE: r + 2, ACC: r + 2, STR: r - 2, CON: r, PAS: r + 3, SHO: r - 10, TAC: r + 2 },
    "Ball-Playing Defender": { SPE: r - 2, ACC: r - 2, STR: r + 3, CON: r + 1, PAS: r + 4, SHO: r - 25, TAC: r + 4 },
    "Mezzala": { SPE: r + 2, ACC: r + 2, STR: r - 8, CON: r + 4, PAS: r + 5, SHO: r + 2, TAC: r - 7 },
    "Playmaker": { SPE: r - 2, ACC: r - 1, STR: r - 6, CON: r + 5, PAS: r + 7, SHO: r + 1, TAC: r - 8 },
    "False Nine": { SPE: r + 1, ACC: r + 2, STR: r - 4, CON: r + 5, PAS: r + 5, SHO: r + 4, TAC: r - 15 },
    "Inside Forward": { SPE: r + 4, ACC: r + 5, STR: r - 3, CON: r + 6, PAS: r + 1, SHO: r + 5, TAC: r - 15 },
    "Stopper": { SPE: r - 2, ACC: r - 2, STR: r + 4, CON: r - 1, PAS: r - 4, SHO: r - 30, TAC: r + 6 },
    "Wingback": { SPE: r + 3, ACC: r + 3, STR: r - 2, CON: r + 1, PAS: r + 1, SHO: r - 8, TAC: r + 2 },
    "Box-to-Box": { SPE: r + 2, ACC: r + 1, STR: r, CON: r + 1, PAS: r + 2, SHO: r - 2, TAC: r + 2 },
    "Winger": { SPE: r + 5, ACC: r + 5, STR: r - 6, CON: r + 6, PAS: r + 2, SHO: r + 3, TAC: r - 15 },
    "Holding Midfielder": { SPE: r - 3, ACC: r - 3, STR: r + 3, CON: r, PAS: r + 3, SHO: r - 15, TAC: r + 6 },
    "Deep-Lying Playmaker": { SPE: r - 2, ACC: r - 2, STR: r - 5, CON: r + 4, PAS: r + 7, SHO: r - 3, TAC: r + 1 },
    "Ball Winner": { SPE: r + 1, ACC: r, STR: r + 3, CON: r - 1, PAS: r - 4, SHO: r - 12, TAC: r + 7 },
    "Pressing Forward": { SPE: r + 3, ACC: r + 3, STR: r - 1, CON: r + 2, PAS: r - 2, SHO: r + 3, TAC: r - 1 },
    "Advanced Forward": { SPE: r + 5, ACC: r + 5, STR: r - 1, CON: r + 3, PAS: r - 1, SHO: r + 6, TAC: r - 25 },
    "Poacher": { SPE: r + 1, ACC: r + 2, STR: r, CON: r + 3, PAS: r - 6, SHO: r + 8, TAC: r - 30 },
    "Complete Forward": { SPE: r + 2, ACC: r + 2, STR: r + 1, CON: r + 3, PAS: r + 3, SHO: r + 5, TAC: r - 12 },
  }
  const values = { ...base, ...(bonus[role] || {}) }
  const boosted = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value) + trainingBoost + Number(shopStats[key as TrainingStatKey] || 0)])) as typeof values
  return Object.fromEntries(Object.entries(boosted).map(([key, value]) => [key, Math.max(1, Math.min(99, Math.round(value)))])) as Record<keyof typeof base, number>
}

function PlayerCard({ player, compact = false, trainingBoost = 0, shopStats = {}, shopOvr = 0 }: { player: Player; compact?: boolean; trainingBoost?: number; shopStats?: Partial<Record<TrainingStatKey, number>>; shopOvr?: number }) {
  const stats = getPlayerCardStats(player, trainingBoost, shopStats)
  const statItems: [keyof typeof stats, string][] = [
    ["SPE", "SPE"], ["ACC", "ACC"], ["STA", "STA"], ["STR", "STR"],
    ["CON", "CON"], ["PAS", "PAS"], ["SHO", "SHO"], ["TAC", "TAC"],
  ]
  const face = playerFaceImages[player.id]
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-slate-950 via-card to-primary/5 shadow-xl",
      compact ? "p-2" : "p-3",
    )}>
      <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />
      <div className="absolute right-2 top-3 z-10 flex flex-col items-center rounded-xl border border-primary/30 bg-background/85 px-2 py-1.5 backdrop-blur">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">OVR</span>
        <span className="font-display text-xl font-black leading-none text-primary">{player.rating + shopOvr}</span>
      </div>

      <div className="relative mt-1 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-primary/10 to-background">
        <div className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent", compact ? "h-16" : "h-24")} />
        {face ? (
          <img
            src={face}
            alt={player.name}
            className={cn("mx-auto block w-full object-cover object-top", compact ? "h-28" : "h-40")}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={cn("flex w-full items-center justify-center bg-slate-800 text-3xl font-black", compact ? "h-28" : "h-40")}>
            {player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
        )}
        <div className="absolute bottom-2 left-3 right-14">
          <p className="truncate font-display text-base font-black text-white drop-shadow">{player.name}</p>
          <p className="truncate text-[9px] font-bold uppercase tracking-wide text-primary-foreground/80">{player.pos} · {player.specialName || player.style}</p>
        </div>
      </div>

      {!compact && (
        <>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {statItems.map(([key, label]) => (
              <div key={key} className="rounded-lg border border-white/10 bg-background/60 px-1 py-1.5 text-center">
                <p className="text-[7px] font-black tracking-wide text-muted-foreground">{label}</p>
                <p className="font-display text-sm font-black leading-tight">{stats[key]}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-400/5 px-2 py-1.5">
            <span className="text-[8px] font-black uppercase tracking-wide text-amber-300">Special Ability</span>
            <span className="truncate pl-2 text-[8px] font-black text-amber-200">{player.specialStyle || "Standard"}</span>
          </div>
        </>
      )}
    </div>
  )
}

export function SquadManager() {
  const [view, setView] = useState<View>("squad")
  const [previewTick, setPreviewTick] = useState(0)
  useEffect(() => { const id = window.setInterval(() => setPreviewTick((v) => v + 1), 500); return () => window.clearInterval(id) }, [])
  useEffect(() => { if (typeof window === "undefined") return; if (localStorage.getItem("pitchside-open-market") === "1") { setView("market"); localStorage.removeItem("pitchside-open-market") } }, [])
  const [formation, setFormation] = useState<Formation>(() => typeof window === "undefined" ? "4-3-3" : (localStorage.getItem("pitchside-formation") as Formation) || "4-3-3")
  const [presetId, setPresetId] = useState<TacticalPresetId>(() => typeof window === "undefined" ? "possession" : (localStorage.getItem("pitchside-tactical-preset") as TacticalPresetId) || "possession")
  const activePreset = tacticalPresets.find((p) => p.id === presetId) || tacticalPresets[0]
  const [instruction, setInstruction] = useState(activePreset.instruction)
  const [teamPlayers, setTeamPlayers] = useState<Player[]>(() => loadClubSquad(squad))
  const [squadCapacity, setSquadCapacity] = useState(24)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [lineup, setLineup] = useState<string[]>(() => {
    const defaults = loadClubSquad(squad).map((p) => p.id)
    if (typeof window === "undefined") return defaults
    try {
      const saved = JSON.parse(localStorage.getItem("pitchside-lineup") || "null")
      return Array.isArray(saved) && saved.every((id) => defaults.includes(id)) ? saved : defaults
    } catch { return defaults }
  })
  const [trainingNow, setTrainingNow] = useState(() => Date.now())
  const [trainingState, setTrainingState] = useState<Record<string, TrainingRecord>>(loadTrainingState)
  const [trainingLedger, setTrainingLedger] = useState<TrainingLedger>(loadTrainingLedger)
  const [adTraining, setAdTraining] = useState<{ playerId: string; tier: TrainingTier; seconds: number } | null>(null)
  const [superPlayerId, setSuperPlayerId] = useState<string | null>(null)
  const [auctionNow, setAuctionNow] = useState(() => Date.now())
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionPlayer[]>(() => readAuctionPlayers())
  const [currency, setCurrency] = useState<{ bucks: number; gems: number }>(() => {
    if (typeof window === "undefined") return wallet
    try { return JSON.parse(localStorage.getItem("pitchside-wallet") || "") || wallet } catch { return wallet }
  })
  const activeTrainingCount = useMemo(() => Object.values(trainingState).filter((record) => trainingNow < record.completesAt).length, [trainingState, trainingNow])
  const trainingCycleLocked = trainingNow < trainingLedger.lockedUntil
  const trainingLockRemaining = Math.max(0, trainingLedger.lockedUntil - trainingNow)

  useEffect(() => {
    const id = window.setInterval(() => { setTrainingNow(Date.now()); setAuctionNow(Date.now()) }, 1000)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => { localStorage.setItem("pitchside-training", JSON.stringify(trainingState)) }, [trainingState])
  useEffect(() => { localStorage.setItem("pitchside-training-ledger", JSON.stringify(trainingLedger)) }, [trainingLedger])
  useEffect(() => { saveWallet(currency) }, [currency])
  useEffect(() => {
    const expired = auctionPlayers.filter((lot) => lot.enabled && lot.endsAt <= auctionNow)
    if (!expired.length) return
    let nextPlayers = [...auctionPlayers]
    let nextSquad = teamPlayers
    let nextBucks = currency.bucks
    let nextGems = currency.gems
    for (const lot of expired) {
      if (lot.highestBidder === "you" && nextSquad.length < squadCapacity) {
        const added = addAuctionPlayer(nextSquad, lot)
        if (added.added) {
          nextSquad = added.squad
          // Held Bucks/Gems become the final spent price.
          nextPlayers = nextPlayers.map((p) => p.id === lot.id ? { ...p, enabled: false, status: "sold" as const, heldBucks: 0, heldGems: 0 } : p)
        } else {
          nextBucks += lot.heldBucks || 0
          nextGems += lot.heldGems || 0
          nextPlayers = nextPlayers.map((p) => p.id === lot.id ? { ...p, enabled: false, status: "unsold" as const, highestBidder: null, heldBucks: 0, heldGems: 0 } : p)
        }
      } else {
        nextBucks += lot.heldBucks || 0
        nextGems += lot.heldGems || 0
        nextPlayers = nextPlayers.map((p) => p.id === lot.id ? { ...p, enabled: false, status: "unsold" as const, highestBidder: null, heldBucks: 0, heldGems: 0 } : p)
      }
    }
    setTeamPlayers(nextSquad)
    setAuctionPlayers(nextPlayers)
    setCurrency((current) => ({ ...current, bucks: nextBucks, gems: nextGems }))
    saveAuctionPlayers(nextPlayers)
  }, [auctionNow, auctionPlayers, currency.bucks, currency.gems, squadCapacity, teamPlayers])


  useEffect(() => {
    const completedNow = Object.values(trainingState).filter((record) => trainingNow >= record.completesAt)
    const unseen = completedNow.filter((record) => !trainingLedger.completedKeys.includes(record.playerId + ":" + record.startedAt))
    if (!unseen.length) return
    setTrainingLedger((current) => {
      const completedKeys = [...current.completedKeys, ...unseen.map((record) => record.playerId + ":" + record.startedAt)]
      const latest = unseen.reduce((max, record) => Math.max(max, record.weeklyUnlockAt), current.lockedUntil)
      return completedKeys.length >= TRAINING_CYCLE_LIMIT ? { completedKeys, lockedUntil: latest } : { ...current, completedKeys }
    })
  }, [trainingNow, trainingState, trainingLedger.completedKeys])

  useEffect(() => {
    if (trainingLedger.lockedUntil > 0 && trainingNow >= trainingLedger.lockedUntil) {
      setTrainingLedger({ completedKeys: [], lockedUntil: 0 })
    }
  }, [trainingNow, trainingLedger.lockedUntil])

  useEffect(() => { setSquadCapacity(getSquadCapacity()); saveClubSquad(teamPlayers) }, [teamPlayers])

  useEffect(() => {
    const ended = auctionPlayers.filter((lot) => lot.enabled && lot.endsAt <= auctionNow)
    if (!ended.length) return
    let nextAuction = [...auctionPlayers]
    let nextSquad = teamPlayers
    let changed = false
    for (const lot of ended) {
      const result = addAuctionPlayer(nextSquad, lot)
      if (result.added) {
        nextSquad = result.squad
        nextAuction = nextAuction.map((p) => p.id === lot.id ? { ...p, enabled: false } : p)
        changed = true
      }
    }
    if (changed) {
      setTeamPlayers(nextSquad)
      setAuctionPlayers(nextAuction)
      saveAuctionPlayers(nextAuction)
    }
  }, [auctionNow, auctionPlayers, teamPlayers])

  const selectedPlayer = useMemo(() => teamPlayers.find((p) => p.id === selectedPlayerId) || null, [teamPlayers, selectedPlayerId])
  const beginTraining = (playerId: string, tier: TrainingTier) => {
    const existing = trainingState[playerId]
    if (trainingCycleLocked || activeTrainingCount >= MAX_CONCURRENT_TRAINING) return
    if (existing && trainingNow < existing.completesAt) return
    if (existing && trainingNow < existing.weeklyUnlockAt) return
    if (tier === "super") { setSuperPlayerId(playerId); return }
    setAdTraining({ playerId, tier, seconds: 5 })
  }
  useEffect(() => {
    if (!adTraining) return
    if (adTraining.seconds <= 0) {
      const now = Date.now(); const boost = adTraining.tier === "heavy" ? 3 : 1
      setTrainingState((current) => ({ ...current, [adTraining.playerId]: { playerId: adTraining.playerId, tier: adTraining.tier, boost, startedAt: now, completesAt: now + TRAINING_MS, weeklyUnlockAt: now + WEEK_MS } }))
      setAdTraining(null); return
    }
    const id = window.setTimeout(() => setAdTraining((current) => current ? { ...current, seconds: current.seconds - 1 } : null), 1000); return () => window.clearTimeout(id)
  }, [adTraining])
  const confirmSuperTraining = (useGems: boolean) => {
    if (!superPlayerId) return
    if (trainingCycleLocked || activeTrainingCount >= MAX_CONCURRENT_TRAINING) return
    const existing = trainingState[superPlayerId]; if (existing && trainingNow < existing.completesAt) return
    if (existing && trainingNow < existing.weeklyUnlockAt) return
    const cost = useGems ? SUPER_GEMS : SUPER_BUCKS; if ((useGems ? currency.gems : currency.bucks) < cost) return
    const now = Date.now()
    setTrainingState((current) => ({ ...current, [superPlayerId]: { playerId: superPlayerId, tier: "super", boost: 5, startedAt: now, completesAt: now + TRAINING_MS, weeklyUnlockAt: now + WEEK_MS } }))
    setCurrency((current: { bucks: number; gems: number }) => ({ ...current, [useGems ? "gems" : "bucks"]: current[useGems ? "gems" : "bucks"] - cost }))
    setSuperPlayerId(null)
  }
  const swapPlayer = (targetId: string) => {
    if (!selectedPlayerId || selectedPlayerId === targetId) return
    setLineup((current) => {
      const a = current.indexOf(selectedPlayerId), b = current.indexOf(targetId)
      if (a < 0 && b < 0) return current
      const next = [...current]
      if (a >= 0 && b >= 0) {
        ;[next[a], next[b]] = [next[b], next[a]]
      } else if (a >= 0) {
        next[a] = targetId
      } else if (b >= 0) {
        next[b] = selectedPlayerId
      } else {
        return current
      }
      localStorage.setItem("pitchside-lineup", JSON.stringify(next))
      return next
    })
    setSelectedPlayerId(null)
  }

  const chooseFormation = (value: Formation) => {
    setFormation(value)
    setSelectedPlayerId(null)
    localStorage.setItem("pitchside-formation", value)
  }
  const choosePreset = (preset: TacticalPreset) => {
    setPresetId(preset.id)
    setFormation(preset.formation)
    setInstruction(preset.instruction)
    localStorage.setItem("pitchside-tactical-preset", preset.id)
    localStorage.setItem("pitchside-formation", preset.formation)
    localStorage.setItem("pitchside-instruction", preset.instruction)
  }

  return (
    <div className="pb-5">
      <ScreenHeader title="Tactics" subtitle="Set your formation, starting XI and substitutions" />

      <div className="px-5">
        <div className="flex rounded-xl border border-border bg-card/70 p-1">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = view === t.id
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[11px] font-black transition",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 space-y-3 px-5">
        {view === "squad" && (
          <div className="space-y-3">
            <Card className="overflow-hidden p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Starting XI</p>
                  <p className="mt-1 font-display text-xl font-black text-primary">{formation}</p>
                </div>
                <Pill accent="cyan">{activePreset.name}</Pill>
              </div>

              <div className="relative mx-auto aspect-[3/4] w-full max-w-[360px] overflow-hidden rounded-2xl border border-primary/25 bg-emerald-950/80 shadow-xl">
                <div className="absolute inset-2 rounded-xl border border-white/20" />
                <div className="absolute left-1/2 top-1/2 h-px w-[calc(100%-16px)] -translate-x-1/2 bg-white/20" />
                <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
                <div className="absolute left-1/2 top-0 h-16 w-32 -translate-x-1/2 rounded-b-full border-b border-x border-white/20" />
                <div className="absolute bottom-0 left-1/2 h-16 w-32 -translate-x-1/2 rounded-t-full border-t border-x border-white/20" />

                {(() => {
                  const shapes: Record<Formation, { x: number; y: number }[]> = {
                    "4-3-3": [{x:50,y:91},{x:14,y:72},{x:37,y:75},{x:63,y:75},{x:86,y:72},{x:28,y:55},{x:50,y:51},{x:72,y:55},{x:18,y:31},{x:50,y:25},{x:82,y:31}],
                    "4-4-2": [{x:50,y:91},{x:14,y:72},{x:37,y:75},{x:63,y:75},{x:86,y:72},{x:15,y:54},{x:38,y:56},{x:62,y:56},{x:85,y:54},{x:35,y:29},{x:65,y:29}],
                    "3-5-2": [{x:50,y:91},{x:25,y:74},{x:50,y:77},{x:75,y:74},{x:10,y:52},{x:30,y:55},{x:50,y:57},{x:70,y:55},{x:90,y:52},{x:38,y:29},{x:62,y:29}],
                    "4-2-3-1": [{x:50,y:91},{x:14,y:72},{x:37,y:75},{x:63,y:75},{x:86,y:72},{x:37,y:58},{x:63,y:58},{x:20,y:40},{x:50,y:36},{x:80,y:40},{x:50,y:21}],
                    "4-1-4-1": [{x:50,y:91},{x:14,y:72},{x:37,y:75},{x:63,y:75},{x:86,y:72},{x:50,y:61},{x:15,y:46},{x:38,y:49},{x:62,y:49},{x:85,y:46},{x:50,y:25}],
                  }
                  const slots = shapes[formation]
                  const phase = previewTick * 0.22
                  const cycle = Math.floor(previewTick / (activePreset.motion === "tiki" ? 2 : 4)) % 8
                  const carrier = [6, 5, 6, 7, 10, 8, 6, 4][cycle]
                  const phaseProgress = (previewTick % (activePreset.motion === "tiki" ? 2 : 4)) / (activePreset.motion === "tiki" ? 2 : 4)
                  const nextCarrier = [6, 5, 6, 7, 10, 8, 6, 4][(cycle + 1) % 8]
                  const carrierSlot = slots[carrier] || slots[6]
                  const nextSlot = slots[nextCarrier] || slots[6]
                  const ballX = carrierSlot.x + (nextSlot.x - carrierSlot.x) * phaseProgress * 0.55
                  const ballY = carrierSlot.y + (nextSlot.y - carrierSlot.y) * phaseProgress * 0.55

                  const previewPosition = (slot: {x:number;y:number}, i: number) => {
                    const p = teamPlayers.find((player) => player.id === lineup[i])
                    const role = p?.style || ""
                    let x = slot.x
                    let y = slot.y

                    if (activePreset.motion === "pass" || activePreset.motion === "tiki") {
                      const support = i === carrier ? 1 : 0
                      const towardBall = Math.max(0, 1 - Math.hypot(ballX - x, ballY - y) / 55)
                      x += (ballX - x) * (0.07 + towardBall * 0.10)
                      y += (ballY - y) * (0.05 + towardBall * 0.08)
                      x += Math.sin(phase + i * 1.7) * (activePreset.motion === "tiki" ? 2.8 : 1.6)
                      y += Math.cos(phase * 0.8 + i) * 1.4
                      if (role === "Winger" || role === "Wingback") x += (x < 50 ? -1 : 1) * 4
                      if (role === "Inside Forward" || role === "Mezzala") x += (50 - x) * 0.10
                      if (support) { x += (50 - x) * 0.03; y += 2 }
                    } else if (activePreset.motion === "press" || activePreset.motion === "high") {
                      const press = i < 5 ? 0.22 : 0.10
                      x += (ballX - x) * press
                      y += (ballY - y) * press - (activePreset.motion === "high" ? 6 : 3)
                    } else if (activePreset.motion === "counter") {
                      y -= i >= 8 ? 11 : i >= 5 ? 5 : 1
                      if (i === 8 || i === 10) x += (i === 8 ? -1 : 1) * 5
                    } else if (activePreset.motion === "wing") {
                      if (i === 1 || i === 4 || i === 8 || i === 10) x = x < 50 ? 9 : 91
                      if (i >= 5 && i <= 7) x += (50 - x) * 0.12
                    } else if (activePreset.motion === "long") {
                      if (i >= 9) y -= 16
                      if (i === 1 || i === 4) x += (x < 50 ? -1 : 1) * 4
                    } else if (activePreset.motion === "direct") {
                      y -= i >= 8 ? 10 : 3
                    } else if (activePreset.motion === "low") {
                      y += i < 5 ? 7 : 3
                      x = 50 + (x - 50) * 0.78
                    }

                    return {
                      x: Math.max(7, Math.min(93, x)),
                      y: Math.max(8, Math.min(92, y)),
                    }
                  }

                  const positions = lineup.slice(0, 11).map((_, i) => previewPosition(slots[i], i))
                  const opponentBase = [
                    {x:50,y:9},{x:14,y:27},{x:35,y:24},{x:65,y:24},{x:86,y:27},
                    {x:22,y:42},{x:43,y:40},{x:57,y:40},{x:78,y:42},{x:36,y:58},{x:64,y:58}
                  ]
                  const opponents = opponentBase.map((op, i) => {
                    let x = op.x
                    let y = op.y
                    const target = positions[(i + cycle + 3) % positions.length] || {x:50,y:45}
                    const markStrength = activePreset.motion === "low" ? 0.08 : activePreset.motion === "press" || activePreset.motion === "high" ? 0.22 : 0.14
                    x += (target.x - x) * markStrength + Math.sin(phase + i) * 0.8
                    y += (target.y - y) * markStrength
                    if (activePreset.motion === "low") y += 4
                    return {x: Math.max(6, Math.min(94, x)), y: Math.max(7, Math.min(90, y))}
                  })

                  return (
                    <>
                      <div className="pointer-events-none absolute inset-0">
                        <svg viewBox="0 0 100 100" className="h-full w-full">
                          {positions.map((p, i) => {
                            if (i === carrier) return null
                            const distance = Math.hypot(p.x - ballX, p.y - ballY)
                            if (distance > 34) return null
                            return <line key={`lane-${i}`} x1={ballX} y1={ballY} x2={p.x} y2={p.y} stroke="currentColor" className="text-white/20" strokeDasharray="1.5 2" strokeWidth="0.7" />
                          })}
                          <line x1={ballX} y1={ballY} x2={nextSlot.x} y2={nextSlot.y} stroke="currentColor" className="text-primary/70" strokeWidth="1" strokeDasharray="2 2" />
                        </svg>
                      </div>

                      {opponents.map((p, i) => (
                        <div key={`op-${i}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{left:`${p.x}%`,top:`${p.y}%`}}>
                          <div className="h-4 w-4 rounded-full border border-red-200/70 bg-red-500/75 shadow-[0_0_8px_rgba(239,68,68,.35)]" />
                          <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[5px] font-black text-red-200/80">MARK</span>
                        </div>
                      ))}

                      {lineup.slice(0, 11).map((playerId, i) => {
                        const p = teamPlayers.find((player) => player.id === playerId)
                        const pos = positions[i]
                        if (!p || !pos) return null
                        const isCarrier = i === carrier
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => selectedPlayerId ? swapPlayer(p.id) : setSelectedPlayerId(p.id)}
                            className={cn(
                              "absolute -translate-x-1/2 -translate-y-1/2 rounded-xl p-1 text-center transition-transform duration-500",
                              selectedPlayerId === p.id ? "scale-110 bg-primary/30 ring-2 ring-primary" : "hover:bg-white/10",
                              isCarrier && "scale-110",
                            )}
                            style={{left:`${pos.x}%`,top:`${pos.y}%`}}
                            aria-label={selectedPlayerId ? `Swap with ${p.name}` : `Select ${p.name}`}
                          >
                            <div className={cn("relative", isCarrier && "drop-shadow-[0_0_8px_rgba(34,211,238,.9)]")}>
                              <PlayerFace player={p} />
                              {isCarrier && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,.95)]" />}
                            </div>
                            <span className="mt-0.5 block max-w-[76px] truncate rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-black text-white">{p.name}</span>
                            <span className="mx-auto mt-0.5 block w-fit rounded bg-primary px-1.5 py-0.5 text-[7px] font-black text-primary-foreground">{p.rating}</span>
                          </button>
                        )
                      })}

                      <span className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,.95)] transition-all duration-500" style={{left:`${ballX}%`,top:`${ballY}%`}} />
                      <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-1 text-[6px] font-black uppercase tracking-widest text-white/80">
                        {activePreset.name} · WITH BALL
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[9px] text-muted-foreground">
                  {selectedPlayer ? `${selectedPlayer.name} selected — tap another player or a substitute to switch.` : "Tap a player to select them for a substitution."}
                </p>
                {selectedPlayer ? (
                  <button type="button" onClick={() => setSelectedPlayerId(null)} className="shrink-0 rounded-lg border border-border px-2 py-1 text-[9px] font-black">
                    Cancel
                  </button>
                ) : null}
              </div>
            </Card>

            <Card className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Substitutes</p>
                  <p className="text-[9px] text-muted-foreground">Tap a player to select or switch</p>
                </div>
                <Pill accent="emerald">{Math.max(0, lineup.length - 11)} Bench</Pill>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
                {lineup.slice(11).map((id) => {
                  const p = teamPlayers.find((player) => player.id === id)
                  if (!p) return null
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => selectedPlayerId ? swapPlayer(p.id) : setSelectedPlayerId(p.id)}
                      className={cn(
                        "w-[92px] shrink-0 rounded-xl border p-2 text-center transition",
                        selectedPlayerId === p.id ? "border-primary bg-primary/15 ring-1 ring-primary" : "border-border bg-card/70",
                      )}
                    >
                      <PlayerFace player={p} />
                      <p className="mt-1 truncate text-[9px] font-black">{p.name}</p>
                      <p className="text-[8px] text-muted-foreground">{p.pos} · {p.rating}</p>
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match setup</p>
                  <p className="mt-1 text-xs text-muted-foreground">{activePreset.instruction} · {activePreset.description}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-black text-primary">{teamPlayers.length}/{squadCapacity}</span>
              </div>
            </Card>
          </div>
        )}

        {view === "styles" && (
          <div className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Formation</p>
                  <p className="mt-1 font-display text-2xl font-black text-primary">{formation}</p>
                </div>
                <Pill accent="cyan">{activePreset.name}</Pill>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {formations.map((f) => (
                  <button
                    key={f}
                    onClick={() => chooseFormation(f)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-black transition",
                      formation === f ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/70",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tactical focus</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "defending", label: "Defending", icon: Shield },
                  { id: "balanced", label: "Balanced", icon: SlidersHorizontal },
                  { id: "attacking", label: "Attacking", icon: Swords },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      localStorage.setItem("pitchside-tactical-focus", id)
                      choosePreset(tacticalPresets.find((p) => p.id === (id === "defending" ? "low-block" : id === "attacking" ? "high-press" : "balanced")) || tacticalPresets[0])
                    }}
                    className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card/70 px-2 py-3 text-[10px] font-black"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tactical styles</p>
              <div className="grid grid-cols-2 gap-2">
                {tacticalPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => choosePreset(preset)}
                    className={cn(
                      "rounded-xl border p-3 text-left",
                      preset.id === presetId ? "border-primary bg-primary/15" : "border-border bg-card/70",
                    )}
                  >
                    <p className="text-xs font-black">{preset.name}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">{preset.formation} · {preset.instruction}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {view === "training" && (
          <div className="space-y-3">
            <Card glow="cyan" className="p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Player Training</p>
              <p className="mt-1 font-display text-xl font-black text-glow-cyan">3 players at a time</p>
              <p className="mt-2 text-xs text-muted-foreground">Training takes 24 hours. A player cannot train again for 7 days. After 10 completed trainings, the training room locks until the cycle resets.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10px]">
                <div className="rounded-xl border border-border p-2"><b>{activeTrainingCount}/3</b><span className="mt-1 block text-muted-foreground">Active sessions</span></div>
                <div className={cn("rounded-xl border p-2", trainingCycleLocked ? "border-amber-400/40 bg-amber-400/5" : "border-border")}><b>{trainingCycleLocked ? "LOCKED" : `${Math.min(trainingLedger.completedKeys.length, TRAINING_CYCLE_LIMIT)}/10`}</b><span className="mt-1 block text-muted-foreground">{trainingCycleLocked ? `Unlocks in ${formatRemaining(trainingLockRemaining)}` : "Completed this cycle"}</span></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded-xl border border-border p-2"><b>Light</b><span className="mt-1 block text-muted-foreground">Ad · +1 all</span></div><div className="rounded-xl border border-border p-2"><b>Heavy</b><span className="mt-1 block text-muted-foreground">Ad · +3 all</span></div><div className="rounded-xl border border-primary/30 bg-primary/10 p-2"><b>Super</b><span className="mt-1 block text-muted-foreground">Paid · +5 all</span></div></div>
            </Card>
            {teamPlayers.map((p) => {
              const record = trainingState[p.id]; const active = !!record && trainingNow < record.completesAt; const locked = !!record && trainingNow < record.weeklyUnlockAt; const complete = !!record && trainingNow >= record.completesAt
              return (
                <Card key={p.id} className={cn("p-3", active && "border-amber-400/40 bg-amber-400/5")}>
                  <div className="flex items-center gap-3"><PlayerFace player={p}/><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-black">{p.name}</p>{complete ? <span className="text-[10px] font-black text-primary">+{record!.boost}</span> : null}</div><p className="truncate text-[10px] text-muted-foreground">{p.style} · {p.specialName || "Standard"}</p>{active ? <p className="mt-1 text-[10px] font-bold text-amber-300">Training {record!.tier} · available in {formatRemaining(record!.completesAt-trainingNow)}</p> : locked ? <p className="mt-1 text-[10px] font-bold text-muted-foreground">Next training in {formatRemaining(record!.weeklyUnlockAt-trainingNow)}</p> : complete ? <p className="mt-1 text-[10px] font-bold text-emerald-400">+{record!.boost} all attributes · weekly training locked</p> : <p className="mt-1 text-[10px] text-emerald-400">Ready for this week's training</p>}</div></div>
                  {!locked && !trainingCycleLocked && activeTrainingCount < MAX_CONCURRENT_TRAINING ? <div className="mt-3 grid grid-cols-3 gap-2"><Button size="sm" onClick={() => beginTraining(p.id,"light")} className="h-9 rounded-lg text-[10px] font-bold">Light · Ad</Button><Button size="sm" onClick={() => beginTraining(p.id,"heavy")} className="h-9 rounded-lg bg-accent text-accent-foreground text-[10px] font-bold">Heavy · Ad</Button><Button size="sm" onClick={() => beginTraining(p.id,"super")} className="h-9 rounded-lg border border-primary/40 bg-primary/10 text-primary text-[10px] font-bold">Super · +5</Button></div> : <p className="mt-3 rounded-lg border border-border bg-secondary/40 px-2 py-2 text-center text-[9px] font-bold text-muted-foreground">{trainingCycleLocked ? `Training room locked · ${formatRemaining(trainingLockRemaining)} remaining` : active ? "Training in progress" : activeTrainingCount >= MAX_CONCURRENT_TRAINING ? "3 training slots are full" : "Weekly cooldown active"}</p>}
                </Card>
              )
            })}
            {adTraining ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"><Card glow="cyan" className="relative w-full max-w-sm p-5 text-center"><button onClick={() => setAdTraining(null)} className="absolute right-4 top-4"><X className="h-4 w-4"/></button><p className="text-xs uppercase tracking-widest text-muted-foreground">Sponsored Training</p><p className="mt-2 font-display text-xl font-black">Watch ad to start {adTraining.tier} training</p><p className="mt-2 text-sm text-muted-foreground">Ad finishes in {adTraining.seconds}s. Training then runs for 24 hours.</p></Card></div> : null}
            {superPlayerId ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"><Card glow="cyan" className="w-full max-w-sm p-5"><div className="flex items-center justify-between"><p className="font-display text-lg font-black">Super Training</p><button onClick={() => setSuperPlayerId(null)}><X className="h-4 w-4"/></button></div><p className="mt-2 text-xs text-muted-foreground">Train {teamPlayers.find((p) => p.id === superPlayerId)?.name} for 24 hours and add +5 to every attribute.</p><div className="mt-4 grid grid-cols-2 gap-2"><Button onClick={() => confirmSuperTraining(true)} disabled={currency.gems < SUPER_GEMS} className="h-12 rounded-xl"><Gem className="mr-1 h-4 w-4"/>{SUPER_GEMS} Gems</Button><Button onClick={() => confirmSuperTraining(false)} disabled={currency.bucks < SUPER_BUCKS} variant="outline" className="h-12 rounded-xl"><Banknote className="mr-1 h-4 w-4"/>{SUPER_BUCKS.toLocaleString()} Bucks</Button></div></Card></div> : null}
          </div>
        )}

        {view === "market" && (
          <div className="space-y-3">
            <Card className="flex items-center justify-between p-4">
              <div><p className="font-display text-sm font-bold">Transfer Auction</p><p className="text-xs text-muted-foreground">Fictional players · Bucks + Gems are held immediately when you bid.</p></div>
              <Pill accent="emerald">{auctionPlayers.filter((p) => p.enabled && p.endsAt > auctionNow).length} Live</Pill>
            </Card>
            {auctionPlayers.filter((p) => p.enabled && p.endsAt > auctionNow).map((lot) => {
              const highest = lot.highestBidder === "you"
              const bidBucks = lot.currentBucks
              const bidGems = lot.currentGems
              const alreadyHeld = lot.heldBucks || 0
              const alreadyHeldGems = lot.heldGems || 0
              const extraBucks = Math.max(0, bidBucks - alreadyHeld)
              const extraGems = Math.max(0, bidGems - alreadyHeldGems)
              return (
                <Card key={lot.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 font-black text-primary"><span>{lot.face}</span><span className="text-[8px]">{lot.number}</span></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><p className="truncate font-semibold">{lot.name}</p><span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-black">{lot.position}</span><span className="font-display text-sm font-black text-primary">{lot.rating}</span></div>
                      <p className="truncate text-xs text-muted-foreground">{lot.style} · {lot.height} cm · {lot.look}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">PAC {lot.attributes.pace} · PAS {lot.attributes.passing} · SHO {lot.attributes.shooting} · HDG {lot.attributes.heading} · STR {lot.attributes.strength}</p>
                    </div>
                    <div className="text-right"><div className="flex items-center gap-1 text-xs font-semibold text-chart-4"><Timer className="h-3.5 w-3.5" /><span className="font-mono tabular-nums">{formatAuctionTime(lot.endsAt, auctionNow)}</span></div><p className={cn("mt-1 text-[9px] font-black", highest ? "text-primary" : "text-muted-foreground")}>{highest ? "YOUR FUNDS HELD" : "OPEN BIDDING"}</p></div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-secondary/60 px-3 py-2"><p className="text-[10px] uppercase text-muted-foreground">Auction price</p><p className="font-display text-sm font-bold tabular-nums">{bidBucks.toLocaleString()} Bucks</p><p className="text-[10px] font-bold text-primary">{bidGems} Gems</p></div>
                    <div className="rounded-lg bg-secondary/60 px-3 py-2 text-right"><p className="text-[10px] uppercase text-muted-foreground">Your balance</p><p className="font-display text-sm font-bold tabular-nums">{currency.bucks.toLocaleString()} Bucks</p><p className="text-[10px] font-bold text-primary">{currency.gems} Gems</p></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button disabled={teamPlayers.length >= squadCapacity || currency.bucks < Math.max(0, (highest ? bidBucks + 100 : bidBucks) - alreadyHeld) || currency.gems < extraGems} onClick={() => {
                      const nextBucks = highest ? bidBucks + 100 : bidBucks
                      const needBucks = Math.max(0, nextBucks - alreadyHeld)
                      const needGems = Math.max(0, bidGems - alreadyHeldGems)
                      if (currency.bucks < needBucks || currency.gems < needGems) return
                      const next = auctionPlayers.map((p) => p.id === lot.id ? { ...p, currentBucks: nextBucks, currentGems: bidGems, highestBidder: "you" as const, status: "live" as const, heldBucks: nextBucks, heldGems: bidGems } : p)
                      setAuctionPlayers(next); saveAuctionPlayers(next)
                      setCurrency((current) => ({ ...current, bucks: current.coins - needBucks, gems: current.gems - needGems }))
                    }} className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">{highest ? "Increase Bid" : "Bid"} · {(highest ? bidBucks + 100 : bidBucks).toLocaleString()} Bucks{bidGems ? " + " + bidGems + " Gems" : ""}</Button>
                    <Button disabled={teamPlayers.length >= squadCapacity || currency.bucks < Math.max(0, lot.buyNowBucks - alreadyHeld) || currency.gems < Math.max(0, lot.buyNowGems - alreadyHeldGems)} onClick={() => {
                      const needBucks = Math.max(0, lot.buyNowBucks - alreadyHeld)
                      const needGems = Math.max(0, lot.buyNowGems - alreadyHeldGems)
                      if (currency.bucks < needBucks || currency.gems < needGems) return
                      const result = addAuctionPlayer(teamPlayers, lot)
                      if (!result.added) return
                      const next = auctionPlayers.map((p) => p.id === lot.id ? { ...p, enabled: false, endsAt: auctionNow, status: "sold" as const, highestBidder: "you" as const, currentBucks: lot.buyNowBucks, currentGems: lot.buyNowGems, heldBucks: 0, heldGems: 0 } : p)
                      setTeamPlayers(result.squad); setAuctionPlayers(next); saveAuctionPlayers(next); setCurrency((current) => ({ ...current, bucks: current.coins - needBucks, gems: current.gems - needGems }))
                    }} variant="outline" className="h-11 flex-1 rounded-xl border-accent/40 bg-accent/10 text-sm font-semibold text-accent">Buy Now</Button>
                  </div>
                  <p className="mt-2 text-center text-[9px] text-muted-foreground">{highest ? "Your committed Bucks and Gems are already removed from available balance." : "Bidding immediately holds the required Bucks and Gems. If you lose, they are automatically refunded."}</p>
                </Card>
              )
            })}
            {auctionPlayers.some((p) => p.status === "sold") ? (
              <Card className="p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your Players</p>
                <div className="mt-2 space-y-2">{auctionPlayers.filter((p) => p.status === "sold").slice(-5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2">
                    <span className="text-xs font-bold">{p.name}</span>
                    <Button size="sm" variant="outline" disabled={currency.gems < 1} onClick={() => {
                      const entered = window.prompt("Rename player — 1 Gem", p.name)
                      if (entered === null || !entered.trim()) return
                      const nextName = renameAuctionPlayer(entered)
                      setCurrency((current) => ({ ...current, gems: current.gems - 1 }))
                      const nextPlayers = auctionPlayers.map((x) => x.id === p.id ? { ...x, name: nextName } : x)
                      const nextSquad = teamPlayers.map((x) => x.id === "auction-" + p.id ? { ...x, name: nextName } : x)
                      setAuctionPlayers(nextPlayers); setTeamPlayers(nextSquad); saveAuctionPlayers(nextPlayers); saveClubSquad(nextSquad)
                    }}>Rename · 1 Gem</Button>
                  </div>
                ))}</div>
              </Card>
            ) : null}
            {!auctionPlayers.some((p) => p.enabled && p.endsAt > auctionNow) ? <Card className="p-5 text-center"><p className="font-bold">No active auction players</p><p className="mt-1 text-xs text-muted-foreground">The admin controls the next auction.</p></Card> : null}
          </div>
        )}
      </div>
    </div>
  )
}
