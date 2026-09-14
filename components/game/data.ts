export type TabId = "private" | "league" | "play" | "squad" | "settings"

export type StandingRow = {
  pos: number
  club: string
  short: string
  pld: number
  gd: number
  pts: number
  form: ("W" | "D" | "L")[]
  self?: boolean
}

export const standings: StandingRow[] = [
  { pos: 1, club: "Neon Rovers", short: "NRV", pld: 14, gd: 22, pts: 34, form: ["W", "W", "W", "D", "W"] },
  { pos: 2, club: "Obsidian FC", short: "OBS", pld: 14, gd: 18, pts: 31, form: ["W", "D", "W", "W", "L"] },
  { pos: 3, club: "Vertex United", short: "VTX", pld: 14, gd: 12, pts: 28, form: ["L", "W", "W", "D", "W"] },
  {
    pos: 4,
    club: "Your Club — Aurora",
    short: "AUR",
    pld: 14,
    gd: 9,
    pts: 26,
    form: ["W", "L", "W", "W", "D"],
    self: true,
  },
  { pos: 5, club: "Pulse Athletic", short: "PLS", pld: 14, gd: 4, pts: 23, form: ["D", "D", "W", "L", "W"] },
  { pos: 6, club: "Cobalt City", short: "CBT", pld: 14, gd: -2, pts: 19, form: ["L", "W", "D", "L", "W"] },
  { pos: 7, club: "Ember Wanderers", short: "EMB", pld: 14, gd: -8, pts: 15, form: ["L", "L", "D", "W", "L"] },
  { pos: 8, club: "Halcyon Town", short: "HAL", pld: 14, gd: -14, pts: 11, form: ["L", "D", "L", "L", "L"] },
]

export type Fixture = {
  id: string
  home: string
  away: string
  time: string
  day: string
  live?: boolean
}

export const fixtures: Fixture[] = [
  { id: "f1", home: "Aurora", away: "Pulse Athletic", time: "20:45", day: "Today", live: true },
  { id: "f2", home: "Neon Rovers", away: "Obsidian FC", time: "18:00", day: "Tomorrow" },
  { id: "f3", home: "Vertex United", away: "Aurora", time: "21:15", day: "Sat" },
  { id: "f4", home: "Cobalt City", away: "Ember Wanderers", time: "16:30", day: "Sun" },
]

export type Result = {
  id: string
  home: string
  away: string
  hs: number
  as: number
}

export const results: Result[] = [
  { id: "r1", home: "Aurora", away: "Cobalt City", hs: 3, as: 1 },
  { id: "r2", home: "Halcyon Town", away: "Aurora", hs: 0, as: 2 },
  { id: "r3", home: "Aurora", away: "Vertex United", hs: 1, as: 1 },
]

export type SponsorChallenge = {
  id: string
  sponsor: string
  title: string
  reward: string
  progress: number
  goal: number
  accent: "cyan" | "emerald"
}

export const sponsorChallenges: SponsorChallenge[] = [
  {
    id: "c1",
    sponsor: "VOLTA",
    title: "Complete 40 gesture passes",
    reward: "+2,500 coins",
    progress: 28,
    goal: 40,
    accent: "cyan",
  },
  {
    id: "c2",
    sponsor: "APEX GEAR",
    title: "Win a sudden-death final",
    reward: "Rare kit crate",
    progress: 0,
    goal: 1,
    accent: "emerald",
  },
  {
    id: "c3",
    sponsor: "HYPERADE",
    title: "Keep 3 clean sheets",
    reward: "+1 stamina boost",
    progress: 2,
    goal: 3,
    accent: "cyan",
  },
]

export const playstyles: string[] = [
  "Tiki-Taka",
  "Gegenpress",
  "Catenaccio",
  "Total Football",
  "Route One",
  "Wing Overload",
  "Low Block",
  "Tiki-Counter",
  "False Nine",
  "Park The Bus",
  "High Line",
  "Direct Play",
  "Possession",
  "Vertical Tiki-Taka",
  "Fluid Front Three",
  "Overlap Mania",
  "Inverted Fullbacks",
  "Box Midfield",
  "Long Ball",
  "Sweeper Keeper",
  "Counter Blitz",
  "Half-Space Focus",
  "Target Man",
  "Pressing Trap",
  "Diamond Core",
]

export type Player = {
  id: string
  name: string
  pos: "GK" | "DEF" | "MID" | "FWD"
  rating: number
  stamina: number
  style: string
}

export const squad: Player[] = [
  { id: "p1", name: "L. Farrow", pos: "GK", rating: 84, stamina: 92, style: "Sweeper Keeper" },
  { id: "p2", name: "D. Nakamura", pos: "DEF", rating: 81, stamina: 74, style: "Inverted Fullbacks" },
  { id: "p3", name: "R. Okafor", pos: "DEF", rating: 86, stamina: 63, style: "High Line" },
  { id: "p4", name: "M. Silvana", pos: "MID", rating: 88, stamina: 55, style: "Tiki-Taka" },
  { id: "p5", name: "J. Petrov", pos: "MID", rating: 83, stamina: 81, style: "Box Midfield" },
  { id: "p6", name: "A. Cruz", pos: "FWD", rating: 90, stamina: 38, style: "False Nine" },
  { id: "p7", name: "K. Adeyemi", pos: "FWD", rating: 85, stamina: 69, style: "Counter Blitz" },
]

export type AuctionLot = {
  id: string
  name: string
  pos: Player["pos"]
  rating: number
  bid: number
  buyNow: number
  timeLeft: string
  style: string
}

export const auctionLots: AuctionLot[] = [
  { id: "a1", name: "T. Bergström", pos: "FWD", rating: 89, bid: 4.2, buyNow: 7.5, timeLeft: "02:14", style: "Fluid Front Three" },
  { id: "a2", name: "O. Diallo", pos: "MID", rating: 87, bid: 3.1, buyNow: 5.8, timeLeft: "09:47", style: "Gegenpress" },
  { id: "a3", name: "V. Rossi", pos: "DEF", rating: 84, bid: 1.9, buyNow: 3.4, timeLeft: "14:02", style: "Catenaccio" },
  { id: "a4", name: "S. Haruki", pos: "GK", rating: 82, bid: 1.2, buyNow: 2.6, timeLeft: "21:33", style: "Sweeper Keeper" },
]

export type TrainingGame = {
  id: string
  name: string
  attribute: string
  best: number
  accent: "cyan" | "emerald"
}

export const trainingGames: TrainingGame[] = [
  { id: "t1", name: "Reaction Wall", attribute: "Pace", best: 1240, accent: "cyan" },
  { id: "t2", name: "Precision Rings", attribute: "Passing", best: 980, accent: "emerald" },
  { id: "t3", name: "Power Meter", attribute: "Shooting", best: 1510, accent: "cyan" },
  { id: "t4", name: "Tempo Taps", attribute: "Stamina", best: 760, accent: "emerald" },
]

export type PrivateLeague = {
  id: string
  name: string
  members: number
  code: string
  owner?: boolean
}

export const privateLeagues: PrivateLeague[] = [
  { id: "pl1", name: "Sunday Sweats", members: 8, code: "SWEAT-42", owner: true },
  { id: "pl2", name: "Office Legends", members: 12, code: "DESK-99" },
  { id: "pl3", name: "The Gaffers", members: 5, code: "TACTIX-7" },
]

export type PackageTier = "bronze" | "silver" | "gold"

export type PackageSlot = {
  id: string
  tier: PackageTier
  /** Seconds remaining on the unlock timer. 0 = ready to open. null = empty slot. */
  unlockIn: number | null
}

export const packageSlots: PackageSlot[] = [
  { id: "pk1", tier: "gold", unlockIn: 0 },
  { id: "pk2", tier: "silver", unlockIn: 5400 },
  { id: "pk3", tier: "bronze", unlockIn: 1200 },
  { id: "pk4", tier: null as unknown as PackageTier, unlockIn: null },
]

export const seasonPass = {
  season: "Season 4 · Neon Rush",
  tier: 23,
  maxTier: 50,
  xp: 640,
  xpGoal: 1000,
  nextReward: "Legendary Kit Crate",
  premium: true,
}

export type WeeklyChallenge = {
  id: string
  title: string
  progress: number
  goal: number
  reward: string
  accent: "cyan" | "emerald"
}

export const weeklyChallenge = {
  title: "Weekly Objectives",
  endsIn: "3d 14h",
  totalReward: "Gold Package + 500 Gems",
  milestones: [
    { id: "w1", title: "Win 5 online matches", progress: 3, goal: 5, reward: "+1,200 coins", accent: "cyan" as const },
    { id: "w2", title: "Score 12 goals", progress: 9, goal: 12, reward: "Silver Package", accent: "emerald" as const },
    { id: "w3", title: "Complete 3 friend matches", progress: 1, goal: 3, reward: "+150 gems", accent: "cyan" as const },
  ] satisfies WeeklyChallenge[],
}

export const wallet = {
  coins: 18420,
  gems: 340,
}

export type SeasonPassReward = {
  tier: number
  free: string
  paid: string
  freeClaimed?: boolean
  paidClaimed?: boolean
}

export const seasonPassWidget = {
  season: "Season 4 · Neon Rush",
  endsIn: "11d 06h",
  tier: 23,
  maxTier: 50,
  xp: 640,
  xpGoal: 1000,
  bankValue: 12,
  bankLabel: "Progress Bank",
  rewards: [
    { tier: 21, free: "250 Coins", paid: "Rare Crate", freeClaimed: true, paidClaimed: true },
    { tier: 22, free: "1 Gem", paid: "500 Coins", freeClaimed: true, paidClaimed: true },
    { tier: 23, free: "Stamina x2", paid: "Epic Kit", freeClaimed: false, paidClaimed: false },
    { tier: 24, free: "300 Coins", paid: "5 Gems", freeClaimed: false, paidClaimed: false },
    { tier: 25, free: "Silver Crate", paid: "Legend Token", freeClaimed: false, paidClaimed: false },
    { tier: 26, free: "150 Coins", paid: "Gold Crate", freeClaimed: false, paidClaimed: false },
    { tier: 27, free: "2 Gems", paid: "Elite Boots", freeClaimed: false, paidClaimed: false },
  ] satisfies SeasonPassReward[],
}

export type DailyChallengeDay = {
  day: number
  reward: string
  state: "claimed" | "today" | "locked"
}

export type WeeklyResetObjective = {
  id: string
  title: string
  progress: number
  goal: number
  reward: string
  claimable?: boolean
}

export const weeklyResetGrid = {
  title: "Weekly Reset",
  resetsIn: "3d 14h",
  days: [
    { day: 1, reward: "100 Coins", state: "claimed" },
    { day: 2, reward: "1 Gem", state: "claimed" },
    { day: 3, reward: "Bronze Crate", state: "claimed" },
    { day: 4, reward: "250 Coins", state: "today" },
    { day: 5, reward: "3 Gems", state: "locked" },
    { day: 6, reward: "Silver Crate", state: "locked" },
    { day: 7, reward: "Gold Crate", state: "locked" },
  ] satisfies DailyChallengeDay[],
  objectives: [
    { id: "o1", title: "Win 5 online matches", progress: 5, goal: 5, reward: "+1,200 Coins", claimable: true },
    { id: "o2", title: "Score 12 goals", progress: 9, goal: 12, reward: "Silver Package" },
    { id: "o3", title: "Complete 3 friend matches", progress: 1, goal: 3, reward: "+150 Gems" },
  ] satisfies WeeklyResetObjective[],
}

export const dailyLoginBonus = {
  day: 4,
  reward: "250 Coins",
  rewardIcon: "coins" as const,
  streak: 4,
}

export const manager = {
  name: "A. Vega",
  club: "Aurora FC",
  crest: "AUR",
  level: 27,
}
