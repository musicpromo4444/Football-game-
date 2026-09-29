"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  Banknote, Gem, ShoppingBag, Lock, Play, Sparkles, Crown, Zap, Shield,
  Timer, Package, Trophy, Shirt, Footprints, HeartPulse, Crosshair,
  Gift, Star, Swords, CircleDollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Pill, ScreenHeader } from "@/components/game/ui-bits"
import { readWallet, saveWallet, type Wallet } from "@/lib/economy"
import { formatRealMoney, getCountry, readProfile } from "@/lib/locale"
import { readRealMoneyPacks } from "@/lib/shop-pricing"
import { claimSpecialPlayer, getSpecialPlayerClaims, addPackagePlayers, loadClubSquad } from "@/lib/club-squad"
import { activateTeamBoost, activateGhostFormationForLeague, TEAM_BOOSTS, type TeamBoostDuration, type TeamBoostType } from "@/lib/team-boosts"
import { specialPlayers, squad } from "@/components/game/data"
import { KitEditor } from "@/components/game/screens/kit-editor"
import { cn } from "@/lib/utils"
import { readLeagueProgress, LEAGUE_LEVELS } from "@/lib/league-progression"
import { getStorePackageContents, getStorePlayer, type StorePackageReward } from "@/lib/xp-packages"
import { activateInjuryShield as saveInjuryShield } from "@/lib/injury-shield"

const FREE_CLAIMS_KEY = "pitchside-free-store-claims"
const FREE_COOLDOWN = 30 * 60 * 1000

const FREE_REWARDS = [
  { id: "coin-small", name: "Bucks Boost", icon: "💰", bucks: 2500, gems: 0, text: "2,500 Bucks" },
  { id: "coin-medium", name: "Gem Boost", icon: "💎", bucks: 0, gems: 10, text: "10 Gems" },

]

const BOOST_TYPES: TeamBoostType[] = ["ghost-formation", "team-boost", "captain-boost", "defense-shield", "goalkeeper-boost"]
const BOOST_DURATIONS: TeamBoostDuration[] = ["1-match", "2-matches", "10-matches", "20-matches"]
const GHOST_FORMATION_PRICES = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9] as const
const GHOST_FORMATION_KEY = "pitchside-ghost-formation-league"

type ArtKind = "card" | "gems" | "bux" | "item" | "package"

function ProductArt({ kind, icon, label }: { kind: ArtKind; icon?: ReactNode; label?: string }) {
  const styles: Record<ArtKind, string> = {
    card: "from-violet-500/40 via-indigo-500/15 to-cyan-400/20 border-violet-300/30",
    gems: "from-pink-500/45 via-rose-500/15 to-purple-500/20 border-pink-300/30",
    bux: "from-emerald-500/40 via-green-500/15 to-cyan-400/15 border-emerald-300/30",
    item: "from-amber-400/35 via-orange-500/10 to-lime-400/15 border-amber-300/30",
    package: "from-sky-500/35 via-blue-500/10 to-violet-500/20 border-sky-300/30",
  }
  return (
    <div className={`relative mx-auto flex h-[82px] w-full items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br ${styles[kind]} shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_8px_20px_rgba(0,0,0,.22)]`}>
      <div className="absolute -right-6 -top-8 h-20 w-20 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-8 -left-5 h-16 w-16 rounded-full bg-black/20 blur-xl" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-black/20 text-white shadow-lg backdrop-blur-sm">
        {icon}
      </div>
      {label && <span className="absolute bottom-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-white/90">{label}</span>}
    </div>
  )
}

function PriceButton({ children, onClick, accent = "cyan" }: { children: ReactNode; onClick: () => void; accent?: "cyan" | "pink" | "green" | "gold" }) {
  const colors = {
    cyan: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    pink: "bg-pink-500 text-white hover:bg-pink-400",
    green: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
    gold: "bg-amber-400 text-slate-950 hover:bg-amber-300",
  }
  return <Button size="sm" onClick={onClick} className={`mt-2 w-full rounded-xl px-2 text-[10px] font-black shadow-lg ${colors[accent]}`}>{children}</Button>
}

function ProductCard({
  kind, icon, title, subtitle, price, priceIcon, onBuy, accent = "cyan", badge
}: {
  kind: ArtKind
  icon: ReactNode
  title: string
  subtitle: string
  price: ReactNode
  priceIcon?: ReactNode
  onBuy: () => void
  accent?: "cyan" | "pink" | "green" | "gold"
  badge?: string
}) {
  return (
    <Card className="overflow-hidden border-white/5 bg-[#111416] p-2.5 shadow-[0_8px_24px_rgba(0,0,0,.28)]">
      <div className="relative">
        <ProductArt kind={kind} icon={icon} label={badge} />
      </div>
      <p className="mt-2 truncate text-[11px] font-black">{title}</p>
      <p className="mt-0.5 min-h-[24px] text-[8px] leading-3 text-muted-foreground">{subtitle}</p>
      <PriceButton onClick={onBuy} accent={accent}>{priceIcon}{price}</PriceButton>
    </Card>
  )
}

function readClaims(): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(FREE_CLAIMS_KEY) || "{}")
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch { return {} }
}

function formatCooldown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0")
}

function durationLabel(duration: TeamBoostDuration) {
  return duration === "1-match" ? "1 Match" : duration === "2-matches" ? "2 Matches" : duration === "10-matches" ? "10 Matches" : "20 Matches"
}

export function Shop() {
  const [wallet, setWallet] = useState<Wallet>(() => readWallet())
  const [message, setMessage] = useState("")
  const [specialClaims, setSpecialClaims] = useState(() => getSpecialPlayerClaims())
  const [revealedSpecial, setRevealedSpecial] = useState<ReturnType<typeof getSpecialPlayerClaims>[number] | null>(null)
  const [claims, setClaims] = useState<Record<string, number>>({})
  const [trainingAd, setTrainingAd] = useState<{ mode: TrainingMode; seconds: number } | null>(null)
  const [kitEditorOpen, setKitEditorOpen] = useState(false)
  const [packagePreview, setPackagePreview] = useState<StorePackageReward | null>(null)
  const [equippingPackage, setEquippingPackage] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState<Record<TeamBoostType, TeamBoostDuration>>({
    "ghost-formation": "1-match",
    "team-boost": "1-match",
    "captain-boost": "1-match",
    "defense-shield": "1-match",
    "goalkeeper-boost": "1-match",
  })
  const [, setTick] = useState(0)
  const profile = readProfile()
  const leagueProgress = readLeagueProgress()
  const currentLeague = LEAGUE_LEVELS[leagueProgress.leagueIndex] || "academy"
  const ghostPrice = GHOST_FORMATION_PRICES[leagueProgress.leagueIndex] ?? 7
  const country = getCountry(profile?.countryCode)
  const realMoneyPacks = readRealMoneyPacks().filter((pack) => pack.enabled)

  useEffect(() => {
    setClaims(readClaims())
    const openKit = () => setKitEditorOpen(true)
    window.addEventListener("pitchside-open-kit-editor", openKit)
    const timer = window.setInterval(() => setTick((v) => v + 1), 1000)
    return () => { window.removeEventListener("pitchside-open-kit-editor", openKit); window.clearInterval(timer) }
  }, [])

  useEffect(() => {
    const open = localStorage.getItem("pitchside-open-kit-editor")
    if (open === "1") { localStorage.removeItem("pitchside-open-kit-editor"); setKitEditorOpen(true) }
  }, [])


  const openPackagePreview = (type: StorePackageReward["type"]) => {
    setPackagePreview(getStorePackageContents(type))
    setEquippingPackage(false)
  }

  const equipPreviewPackage = () => {
    if (!packagePreview) return
    setEquippingPackage(true)
    const players = packagePreview.players.map((id) => getStorePlayer(id)).filter(Boolean)
    const result = addPackagePlayers(loadClubSquad(squad), players)
    const rewardBoostTypes: TeamBoostType[] = ["team-boost", "defense-shield", "goalkeeper-boost", "captain-boost", "ghost-formation"]
    for (let i = 0; i < packagePreview.boosts; i += 1) activateTeamBoost(rewardBoostTypes[i % rewardBoostTypes.length], "1-match")
    const next = { bucks: wallet.bucks + packagePreview.bucks, gems: wallet.gems + packagePreview.gems }
    saveWallet(next)
    setWallet(next)
    window.setTimeout(() => {
      setPackagePreview(null)
      setEquippingPackage(false)
      flash(result.added.length ? result.added.length + " player cards equipped." : "Package equipped.")
    }, 650)
  }

  const activateInjuryShield = (matches: 2 | 5 | 10, price: number) => {
    if (wallet.bucks < price) return flash("Not enough Bux.")
    const next = { ...wallet, bucks: wallet.bucks - price }
    saveWallet(next)
    setWallet(next)
    saveInjuryShield(matches)
    flash("Injury Shield active for " + matches + " matches.")
  }

  const flash = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(""), 2200)
  }

  const grant = (bucks: number, gems: number, label: string) => {
    const next = { bucks: wallet.bucks + bucks, gems: wallet.gems + gems }
    saveWallet(next)
    setWallet(next)
    flash(label)
  }

  const claimFree = (reward: typeof FREE_REWARDS[number]) => {
    const now = Date.now()
    const last = Number(claims[reward.id] || 0)
    if (last && now - last < FREE_COOLDOWN) return flash("This reward is still locked.")
    const nextClaims = { ...claims, [reward.id]: now }
    localStorage.setItem(FREE_CLAIMS_KEY, JSON.stringify(nextClaims))
    setClaims(nextClaims)
    grant(reward.bucks, reward.gems, reward.name + " claimed free.")
  }

  const claimTimed = (id: string, bucks: number, gems: number, label: string) => {
    const now = Date.now()
    const last = Number(claims[id] || 0)
    if (last && now - last < FREE_COOLDOWN) return flash("This free reward is still locked.")
    const nextClaims = { ...claims, [id]: now }
    localStorage.setItem(FREE_CLAIMS_KEY, JSON.stringify(nextClaims))
    setClaims(nextClaims)
    grant(bucks, gems, label)
  }

  const trainingState = getTrainingState()

  const runTraining = (mode: TrainingMode) => {
    if (mode.endsWith("-team")) {
      const price = TRAINING_CONFIG[mode].priceUsd.toFixed(2)
      return flash("Full-team training is priced at $" + price + ". Real-money billing is not connected yet.")
    }
    const result = startTraining(mode, selectedPlayerId, club.map((p) => p.id))
    if (!result.ok) return flash(result.message)
    setTrainingAd({ mode, seconds: TRAINING_CONFIG[mode].adSeconds })
  }

  const buyTrainingSlots = (mode: TrainingMode) => {
    const result = purchaseTrainingSlots(mode)
    if (!result.ok) return flash(result.message)
    flash(TRAINING_CONFIG[mode].slotUpgrade + " training slots permanently unlocked.")
  }

  const claimFreeTeamBoost = (type: TeamBoostType) => {
    const now = Date.now()
    const id = `free-team-${type}`
    const last = Number(claims[id] || 0)
    if (last && now - last < FREE_COOLDOWN) return flash("This free boost is still locked.")
    const nextClaims = { ...claims, [id]: now }
    localStorage.setItem(FREE_CLAIMS_KEY, JSON.stringify(nextClaims))
    setClaims(nextClaims)
    activateTeamBoost(type, "1-match")
    flash(`${TEAM_BOOSTS[type].name} activated free for 1 match.`)
  }

  const buyTeamBoost = (type: TeamBoostType) => {
    const duration = selectedDuration[type]
    const price = TEAM_BOOSTS[type].prices[duration]
    if (price.usd) return flash("Dollar purchase will open when store billing is connected.")
    const gems = price.gems || 0
    if (wallet.gems < gems) return flash("Not enough Gems.")
    const next = { ...wallet, gems: wallet.gems - gems }
    saveWallet(next); setWallet(next)
    activateTeamBoost(type, duration)
    flash(`${TEAM_BOOSTS[type].name} activated for ${durationLabel(duration)}.`)
  }
  const buyGhostFormation = () => {
    const price = GHOST_FORMATION_PRICES[leagueProgress.leagueIndex] ?? 9
    const saved = localStorage.getItem(GHOST_FORMATION_KEY)
    if (saved === String(leagueProgress.leagueIndex)) return flash("Ghost Formation is already active in this league.")
    flash(`Ghost Formation is ${price.toFixed(2)} for ${currentLeague}. Billing will open when store payments are connected.`)
  }

  const activateGhostFromPurchase = () => {
    localStorage.setItem(GHOST_FORMATION_KEY, String(leagueProgress.leagueIndex))
    activateGhostFormationForLeague()
    flash(`👻 Ghost Formation activated for ${currentLeague}. The formation remains hidden.`)
  }

  const spend = (currency: "bucks" | "gems", amount: number, reward: { bucks?: number; gems?: number }, label: string) => {
    if (wallet[currency] < amount) return flash(`Not enough ${currency === "bucks" ? "Bucks" : "Gems"}.`)
    const next = { bucks: wallet.bucks, gems: wallet.gems, ...reward }
    next[currency] -= amount
    saveWallet(next)
    setWallet(next)
    flash(label)
  }

  return (
    <div className="min-h-full bg-[#070909] px-3 pb-8 pt-3 text-white">
      <ScreenHeader title="Store" subtitle={country.flag + " " + country.name + " · " + country.currency} />

      <div className="mb-3 rounded-2xl border border-emerald-400/15 bg-gradient-to-r from-emerald-500/10 via-[#111416] to-[#111416] p-3 shadow-[0_10px_30px_rgba(0,0,0,.25)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10"><ShoppingBag className="h-5 w-5 text-emerald-300" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Tactical Store & Upgrades</p>
            <p className="mt-0.5 text-[8px] text-muted-foreground">Watch daily sponsors for free cards, gems, bux and tactical boosts.</p>
          </div>
          <div className="shrink-0 text-right"><p className="text-[9px] text-muted-foreground">Bux</p><p className="font-black text-emerald-300">{wallet.bucks.toLocaleString()}</p></div>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-black/25 px-2.5 py-2">
          <CircleDollarSign className="h-4 w-4 text-emerald-300" />
          <span className="text-[9px] font-black">{wallet.bucks.toLocaleString()} Bux</span>
          <span className="ml-auto flex items-center gap-1 text-[9px] font-black text-pink-300"><Gem className="h-3.5 w-3.5 fill-pink-300" />{wallet.gems.toLocaleString()}</span>
        </div>
      </div>

      <section>
        <SectionTitle icon={<Trophy className="h-3.5 w-3.5" />} title="PLAYER CARD PACKAGE STORE" meta="Guaranteed Player" />
        <div className="grid grid-cols-3 gap-2.5">
          <ProductCard kind="card" icon={<Gift className="h-8 w-8 text-fuchsia-200" />} title="Free Scout Box" subtitle="5 player cards · 30-min cooldown" price={<><Play className="mr-1 inline h-3 w-3" />CLAIM</>} onBuy={() => { claimTimed("free-scout", 0, 0, "Free Scout claimed. Check your squad."); openPackagePreview("starter-box") }} accent="pink" badge="FREE" />
          <ProductCard kind="card" icon={<Package className="h-8 w-8 text-slate-200" />} title="Silver Scout" subtitle="Rating 75–82 · 1 player" price="11,000 Bux" priceIcon={<Banknote className="mr-1 inline h-3 w-3" />} onBuy={() => spend("bucks", 11000, {}, "Silver Scout pack purchased.")} accent="cyan" />
          <ProductCard kind="card" icon={<Crown className="h-8 w-8 text-amber-200" />} title="Gold Elite" subtitle="Rating 83–88 · Poacher" price="28,000 Bux" priceIcon={<Banknote className="mr-1 inline h-3 w-3" />} onBuy={() => spend("bucks", 28000, {}, "Gold Elite pack purchased.")} accent="gold" />
          <ProductCard kind="card" icon={<Star className="h-8 w-8 text-cyan-200" />} title="Diamond Stars" subtitle="Rating 90–92 · Commander" price="45,000 Bux" priceIcon={<Banknote className="mr-1 inline h-3 w-3" />} onBuy={() => spend("bucks", 45000, {}, "Diamond Stars pack purchased.")} accent="cyan" />
          <ProductCard kind="card" icon={<Swords className="h-8 w-8 text-violet-200" />} title="Producer Pack" subtitle="Architect Archetype" price="15,000 Bux" priceIcon={<Banknote className="mr-1 inline h-3 w-3" />} onBuy={() => spend("bucks", 15000, {}, "Producer Pack purchased.")} accent="pink" />
          <ProductCard kind="card" icon={<Shield className="h-8 w-8 text-emerald-200" />} title="Stopper Pack" subtitle="Defender & Keeper Box" price="20,000 Bux" priceIcon={<Banknote className="mr-1 inline h-3 w-3" />} onBuy={() => spend("bucks", 20000, {}, "Stopper Pack purchased.")} accent="green" />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle icon={<Gem className="h-3.5 w-3.5 fill-current" />} title="GEMS STORE" meta="Instant Delivery" />
        <div className="grid grid-cols-3 gap-2.5">
          <ProductCard kind="gems" icon={<Gem className="h-8 w-8 fill-pink-300 text-pink-100" />} title="Free Gems" subtitle="3–5 Gems per ad · 30-min cooldown" price={<><Play className="mr-1 inline h-3 w-3" />WATCH AD</>} onBuy={() => { const gems = 3 + Math.floor(Math.random() * 3); claimTimed("free-gems", 0, gems, `${gems} Gems claimed.`) }} accent="pink" badge="AD" />
          <ProductCard kind="gems" icon={<Gem className="h-8 w-8 fill-pink-300 text-pink-100" />} title="80 Gems" subtitle="Handful of Gems" price="₦650" onBuy={() => flash("Payment will open when store billing is connected.")} accent="pink" />
          <ProductCard kind="gems" icon={<Gem className="h-9 w-9 fill-pink-300 text-pink-100" />} title="200 Gems" subtitle="+10% Bonus" price="₦2,900" onBuy={() => flash("Payment will open when store billing is connected.")} accent="pink" />
          <ProductCard kind="gems" icon={<Gem className="h-9 w-9 fill-pink-300 text-pink-100" />} title="1,200 Gems" subtitle="Best Value" price="₦9,000" onBuy={() => flash("Payment will open when store billing is connected.")} accent="pink" />
          <ProductCard kind="gems" icon={<Gem className="h-9 w-9 fill-pink-300 text-pink-100" />} title="2,500 Gems" subtitle="+35% Bonus" price="₦15,000" onBuy={() => flash("Payment will open when store billing is connected.")} accent="pink" />
          <ProductCard kind="gems" icon={<Gem className="h-9 w-9 fill-pink-300 text-pink-100" />} title="6,500 Gems" subtitle="+50% Value" price="$20.00" onBuy={() => flash("Payment will open when store billing is connected.")} accent="pink" />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle icon={<CircleDollarSign className="h-3.5 w-3.5" />} title="BUX STORE" meta="Club Currency" />
        <div className="grid grid-cols-3 gap-2.5">
          <ProductCard kind="bux" icon={<Banknote className="h-8 w-8 text-emerald-200" />} title="Free Bux" subtitle="100 Bux per ad · 30-min cooldown" price={<><Play className="mr-1 inline h-3 w-3" />WATCH AD</>} onBuy={() => claimTimed("free-bux", 100, 0, "100 Bux claimed.")} accent="green" badge="AD" />
          <ProductCard kind="bux" icon={<Banknote className="h-8 w-8 text-emerald-200" />} title="1,500 Bux" subtitle="Pile of Bux" price="30 Gems" priceIcon={<Gem className="mr-1 inline h-3 w-3" />} onBuy={() => spend("gems", 30, { bucks: wallet.bucks + 1500 }, "1,500 Bux added.")} accent="green" />
          <ProductCard kind="bux" icon={<Banknote className="h-8 w-8 text-emerald-200" />} title="3,500 Bux" subtitle="+15% Bonus" price="100 Gems" priceIcon={<Gem className="mr-1 inline h-3 w-3" />} onBuy={() => spend("gems", 100, { bucks: wallet.bucks + 3500 }, "3,500 Bux added.")} accent="green" />
          <ProductCard kind="bux" icon={<Banknote className="h-8 w-8 text-emerald-200" />} title="8,000 Bux" subtitle="+30% Best Deal" price="160 Gems" priceIcon={<Gem className="mr-1 inline h-3 w-3" />} onBuy={() => spend("gems", 160, { bucks: wallet.bucks + 8000 }, "8,000 Bux added.")} accent="green" />
          <ProductCard kind="bux" icon={<Banknote className="h-8 w-8 text-emerald-200" />} title="20,000 Bux" subtitle="+50% Value" price="350 Gems" priceIcon={<Gem className="mr-1 inline h-3 w-3" />} onBuy={() => spend("gems", 350, { bucks: wallet.bucks + 20000 }, "20,000 Bux added.")} accent="green" />
          <ProductCard kind="bux" icon={<Banknote className="h-8 w-8 text-emerald-200" />} title="50,000 Bux" subtitle="Treasury Pallet" price="₦8,000" onBuy={() => flash("Payment will open when store billing is connected.")} accent="green" />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle icon={<Crown className="h-3.5 w-3.5" />} title="ITEM STORE" meta="Team Boosts & Gear" />
        <div className="grid grid-cols-3 gap-2.5">
          <ProductCard kind="item" icon={<Crown className="h-8 w-8 text-amber-200" />} title="Captain Boost" subtitle="Boosts your captain" price={<><Play className="mr-1 inline h-3 w-3" />WATCH AD</>} onBuy={() => claimFreeTeamBoost("captain-boost")} accent="gold" badge="FREE" />
          <ProductCard kind="item" icon={<Zap className="h-8 w-8 text-cyan-200" />} title="Ghost Formation" subtitle={`League subscription · ${currentLeague.replace("-", " ")} · all matches in league`} price={`${ghostPrice.toFixed(2)}`} onBuy={() => flash(`Ghost Formation · ${currentLeague.replace("-", " ")} · ${ghostPrice.toFixed(2)}. Purchase opens when billing is connected.`)} accent="cyan" />
          <ProductCard kind="item" icon={<Shirt className="h-8 w-8 text-emerald-200" />} title="Kit Editor" subtitle="Normal · Pro · Legendary · Special Event" price="OPEN" onBuy={() => setKitEditorOpen(true)} accent="green" badge="CUSTOMIZE" />
          <ProductCard kind="item" icon={<Footprints className="h-8 w-8 text-orange-200" />} title="Speed Boots" subtitle="+2% speed per match" price="40 Gems" priceIcon={<Gem className="mr-1 inline h-3 w-3" />} onBuy={() => spend("gems", 40, {}, "Speed Boots activated.")} accent="pink" />
          <ProductCard kind="item" icon={<HeartPulse className="h-8 w-8 text-rose-200" />} title="Injury Shield · 2" subtitle="2 matches injury protection" price="2,000 Bux" priceIcon={<Banknote className="mr-1 inline h-3 w-3" />} onBuy={() => activateInjuryShield(2, 2000)} accent="gold" />
          <ProductCard kind="item" icon={<HeartPulse className="h-8 w-8 text-rose-200" />} title="Injury Shield · 5" subtitle="5 matches injury protection" price="5,000 Bux" priceIcon={<Banknote className="mr-1 inline h-3 w-3" />} onBuy={() => activateInjuryShield(5, 5000)} accent="gold" />
          <ProductCard kind="item" icon={<HeartPulse className="h-8 w-8 text-rose-200" />} title="Injury Shield · 10" subtitle="10 matches injury protection" price="8,000 Bux" priceIcon={<Banknote className="mr-1 inline h-3 w-3" />} onBuy={() => activateInjuryShield(10, 8000)} accent="gold" />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle icon={<Package className="h-3.5 w-3.5" />} title="PACKAGE STORE" meta="Limited Bundles" />
        <div className="grid grid-cols-3 gap-2.5">
          <ProductCard kind="package" icon={<Package className="h-8 w-8 text-amber-200" />} title="Starter Box" subtitle="5 player cards · 500 Bux · 3 Gems · at least one 80–84 OVR" price="$2.30" onBuy={() => openPackagePreview("starter-box")} accent="gold" />
          <ProductCard kind="package" icon={<Trophy className="h-8 w-8 text-orange-200" />} title="Arena Special" subtitle="9 player cards · 2,000 Bux · 2 boosts · at least one 84–88 OVR" price="$4.00" onBuy={() => openPackagePreview("arena-special")} accent="gold" />
          <ProductCard kind="package" icon={<Package className="h-8 w-8 text-cyan-200" />} title="Mega Bundle" subtitle="13 player cards · 60,000 Bux · 3 boosts · 20 Gems · at least one 88–90 OVR" price="$10.00" onBuy={() => openPackagePreview("mega-bundle")} accent="cyan" badge="BEST VALUE" />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle icon={<span className="text-sm">👻</span>} title="GHOST FORMATION" meta={`Current league · ${formatRealMoney(ghostPrice, profile?.countryCode)}`} />
        <Card className="border-amber-300/15 bg-[#111416] p-3">
          <div className="flex items-start gap-3">
            <ProductArt kind="item" icon={<span className="text-3xl">👻</span>} label="HIDDEN" />
            <div className="min-w-0 flex-1">
              <p className="font-black">Mystery Formation</p>
              <p className="mt-0.5 text-[8px] leading-3 text-muted-foreground">No shape is revealed. Tap to activate and the match automatically uses the hidden attacking formation.</p>
              <p className="mt-1 text-[8px] font-bold text-amber-300">Elite attacking positioning · very high goal-scoring pressure · current league only</p>
              <PriceButton onClick={buyGhostFormation} accent="gold">PURCHASE · {formatRealMoney(ghostPrice, profile?.countryCode)}</PriceButton>
              <Button size="sm" variant="outline" className="mt-1 w-full rounded-xl text-[9px] font-black" onClick={activateGhostFromPurchase}>ACTIVATE / TEST</Button>
            </div>
          </div>
        </Card>
      </section>
      <section className="mt-6">
        <SectionTitle icon={<Swords className="h-3.5 w-3.5" />} title="TACTICAL MATCH BOOSTS" meta="Different durations & prices" />
        <div className="space-y-2.5">
          {BOOST_TYPES.map((type) => {
            const item = TEAM_BOOSTS[type]
            const duration = selectedDuration[type]
            return (
              <Card key={type} className="border-white/5 bg-[#111416] p-3">
                <div className="flex items-start gap-3">
                  <ProductArt kind="item" icon={<span className="text-2xl">{item.icon}</span>} />
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{item.name}</p>
                    <p className="mt-0.5 text-[8px] leading-3 text-muted-foreground">{item.description}</p>
                    <p className="mt-1 text-[8px] font-bold text-emerald-300">{item.effect}</p>
                    <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                      {BOOST_DURATIONS.map((d) => (
                        <button key={d} type="button" onClick={() => setSelectedDuration((v) => ({ ...v, [type]: d }))} className={`min-w-[70px] rounded-lg border px-2 py-1.5 text-center text-[8px] font-black ${duration === d ? "border-emerald-300 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-muted-foreground"}`}>
                          <Timer className="mx-auto mb-0.5 h-3 w-3" />{durationLabel(d)}<br/><span className="text-emerald-300">{item.prices[d].gems ? `${"${"}item.prices[d].gems} Gems` : `${"${"}item.prices[d].usd?.toFixed(2)}`}</span>
                        </button>
                      ))}
                    </div>
                    <PriceButton onClick={() => buyTeamBoost(type)} accent="green">{item.prices[duration].gems ? <><Gem className="mr-1 inline h-3 w-3" />ACTIVATE · {item.prices[duration].gems} GEMS</> : <>ACTIVATE · ${item.prices[duration].usd?.toFixed(2)}</>}</PriceButton>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle icon={<CircleDollarSign className="h-3.5 w-3.5" />} title="PREMIUM STORE" meta="Real-money packs" />
        <div className="grid grid-cols-2 gap-2.5">
          {realMoneyPacks.map((pack) => (
            <Card key={pack.id} className="border-white/5 bg-[#111416] p-2.5">
              <ProductArt kind={pack.gems ? "gems" : "bux"} icon={pack.gems ? <Gem className="h-8 w-8 fill-pink-300 text-pink-100" /> : <Banknote className="h-8 w-8 text-emerald-200" />} />
              <p className="mt-2 font-black">{pack.name}</p>
              <p className="mt-0.5 text-[8px] text-muted-foreground">{pack.description}</p>
              <p className="mt-2 text-sm font-black">{formatRealMoney(pack.usd, profile?.countryCode)}</p>
              <PriceButton onClick={() => flash("Payment will open when store billing is connected.")} accent={pack.gems ? "pink" : "green"}>PURCHASE</PriceButton>
            </Card>
          ))}
        </div>
      </section>


      {packagePreview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 px-3 py-5" onClick={() => !equippingPackage && setPackagePreview(null)}>
          <Card className="max-h-[92vh] w-full max-w-md overflow-hidden border-cyan-300/20 bg-[#0a0d0d] p-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">PLAYER CARDS</p><p className="mt-1 text-lg font-black">{packagePreview.count} cards revealed</p></div>
              {!equippingPackage && <Button variant="ghost" size="icon" onClick={() => setPackagePreview(null)}><span className="text-lg">×</span></Button>}
            </div>
            <div className="mt-3 grid max-h-[62vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
              {packagePreview.players.map((id, index) => {
                const player = getStorePlayer(id)
                if (!player) return null
                const stats = player.attributes || { pace: player.rating, passing: player.rating, shooting: player.rating, defending: player.rating, stamina: player.stamina, heading: player.rating, strength: player.rating }
                const dribbling = Math.round(((stats.pace || player.rating) + (stats.passing || player.rating)) / 2)
                return <div key={id} className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 via-[#15191a] to-cyan-500/5 p-2 transition-all duration-500", equippingPackage ? "translate-y-8 scale-75 opacity-0" : "")} style={equippingPackage ? { transitionDelay: (index * 35) + "ms" } : undefined}>
                  <div className="relative h-28 overflow-hidden rounded-xl bg-black/30"><div className="absolute right-1 top-1 z-10 rounded-lg bg-black/70 px-1.5 py-1 text-[10px] font-black text-cyan-300">{player.rating}</div>{player.face ? <img src={player.face} alt="" className="h-full w-full object-cover object-top" /> : <div className="flex h-full items-center justify-center text-2xl font-black">{player.name.split(" ").map((n) => n[0]).join("").slice(0,2)}</div>}</div>
                  <p className="mt-1.5 truncate text-[10px] font-black">{player.name}</p><p className="text-[7px] uppercase text-muted-foreground">{player.pos} · {player.style}</p>
                  <div className="mt-1.5 grid grid-cols-3 gap-1">{[["SPD",stats.pace],["DRB",dribbling],["PAS",stats.passing],["SHO",stats.shooting],["STR",stats.strength],["DEF",stats.defending]].map(([label,value]) => <div key={label} className="rounded-md bg-white/5 px-1 py-1 text-center"><p className="text-[6px] text-muted-foreground">{label}</p><p className="text-[9px] font-black">{value}</p></div>)}</div>
                </div>
              })}
            </div>
            <Button disabled={equippingPackage} onClick={equipPreviewPackage} className="mt-3 w-full rounded-xl font-black">{equippingPackage ? "EQUIPPING..." : "EQUIP ALL"}</Button>
          </Card>
        </div>
      )}
      {revealedSpecial && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 px-5" onClick={() => setRevealedSpecial(null)}>
          <Card glow="cyan" className="w-full max-w-sm overflow-hidden border-amber-300/30 bg-[#0c1010] p-4 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-300">SPECIAL PLAYER UNLOCKED</p>
            <div className="mx-auto mt-3 h-40 w-32 overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-400/20 via-violet-500/15 to-cyan-400/15 shadow-2xl">
              {revealedSpecial.face && <img src={revealedSpecial.face} alt="" className="h-full w-full object-cover" />}
            </div>
            <p className="mt-3 font-display text-2xl font-black">{revealedSpecial.name}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-cyan-300">{revealedSpecial.specialStyle} · {revealedSpecial.rating} OVR</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/5 p-2"><p className="text-[7px] text-muted-foreground">HEIGHT</p><p className="text-xs font-black">{revealedSpecial.height}cm</p></div>
              <div className="rounded-xl bg-white/5 p-2"><p className="text-[7px] text-muted-foreground">COLOUR</p><p className="text-xs font-black">{revealedSpecial.specialColor}</p></div>
              <div className="rounded-xl bg-white/5 p-2"><p className="text-[7px] text-muted-foreground">POS</p><p className="text-xs font-black">{revealedSpecial.pos}</p></div>
            </div>
            <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3">
              <p className="text-[8px] font-black uppercase text-amber-300">SPECIAL ABILITY</p>
              <p className="mt-1 text-sm font-black">{revealedSpecial.specialAbility}</p>
            </div>
            <Button onClick={() => setRevealedSpecial(null)} className="mt-4 w-full rounded-xl font-black">ADD TO COLLECTION</Button>
          </Card>
        </div>
      )}
      {message && <div className="fixed bottom-5 left-3 right-3 z-50 rounded-2xl border border-primary/30 bg-[#111416] p-3 text-center text-xs font-bold shadow-2xl">{message}</div>}
      {trainingAd && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"><Card glow="cyan" className="w-full max-w-sm p-5 text-center"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sponsored Training</p><p className="mt-2 font-display text-xl font-black">{TRAINING_CONFIG[trainingAd.mode].label}</p><p className="mt-2 text-sm text-muted-foreground">Complete the sponsor requirement to start training. {trainingAd.seconds}s remaining</p></Card></div>}
    </div>
  )
}

function SectionTitle({ icon, title, meta }: { icon: ReactNode; title: string; meta?: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5">
      <span className="text-amber-300">{icon}</span>
      <p className="text-[10px] font-black uppercase tracking-wide">{title}</p>
      {meta && <span className="ml-auto text-[7px] font-black text-emerald-300">{meta}</span>}
    </div>
  )
}
