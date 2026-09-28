export type TabId = "private" | "league" | "play" | "squad" | "shop" | "settings"

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
    reward: "+2,500 bucks",
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

export type PlayerRole =
  | "Poacher" | "Advanced Forward" | "Target Forward" | "Inside Forward" | "Winger"
  | "Playmaker" | "Shadow Striker" | "Box-to-Box" | "Ball Winner" | "Holding Midfielder"
  | "Wingback" | "Ball-Playing Defender" | "Deep-Lying Playmaker" | "Inverted Fullback"
  | "Sweeper Keeper" | "False Nine" | "Complete Forward" | "Mezzala" | "Pressing Forward" | "Stopper"

export const playerRoles: { role: PlayerRole; behavior: string }[] = [
  { role: "Poacher", behavior: "stays high and attacks gaps for finishes" },
  { role: "Advanced Forward", behavior: "constantly runs behind the defensive line" },
  { role: "Target Forward", behavior: "holds up play and attacks aerial balls" },
  { role: "Inside Forward", behavior: "starts wide then cuts inside to shoot" },
  { role: "Winger", behavior: "stays wide, beats the fullback and creates accurate crosses" },
  { role: "Playmaker", behavior: "finds passing lanes and creates chances" },
  { role: "Shadow Striker", behavior: "arrives late into the box" },
  { role: "Box-to-Box", behavior: "supports both penalty areas" },
  { role: "Ball Winner", behavior: "presses and hunts possession" },
  { role: "Holding Midfielder", behavior: "protects the defence and holds position" },
  { role: "Wingback", behavior: "overlaps wide and recovers into defence" },
  { role: "Ball-Playing Defender", behavior: "steps out and starts attacks with passes" },
  { role: "Deep-Lying Playmaker", behavior: "controls tempo from deep" },
  { role: "Inverted Fullback", behavior: "moves inside to support midfield" },
  { role: "Sweeper Keeper", behavior: "comes off the line and covers through balls" },
  { role: "False Nine", behavior: "drops deep and pulls defenders out" },
  { role: "Complete Forward", behavior: "combines runs, link play and finishing" },
  { role: "Mezzala", behavior: "attacks the half-space and creates overloads" },
  { role: "Pressing Forward", behavior: "relentlessly pressures defenders" },
  { role: "Stopper", behavior: "steps out early to confront attackers" },
]

export type SpecialPlayerStyle =
  | "Hammer" | "Free-Kick Specialist" | "Mezzala" | "Pressing Forward" | "Long-Range Sniper"
  | "Dribble King" | "Maestro" | "Wall" | "Wingback Master" | "Guardian" | "Speed Demon" | "Power Finisher"

export type SpecialPlayer = {
  id: string
  style: SpecialPlayerStyle
  role: PlayerRole
  rating: number
  attributes: NonNullable<Player["attributes"]>
  specialAbility: string
}

export const specialPlayerStyles: { style: SpecialPlayerStyle; behavior: string }[] = [
  { style: "Hammer", behavior: "dominates aerial duels and attacks crosses with elite headers" },
  { style: "Free-Kick Specialist", behavior: "exceptional curl, dip and accuracy on free kicks" },
  { style: "Mezzala", behavior: "intelligently attacks half-spaces from midfield" },
  { style: "Pressing Forward", behavior: "forces mistakes with relentless defensive pressure" },
  { style: "Long-Range Sniper", behavior: "creates space for unusually accurate distance shots" },
  { style: "Dribble King", behavior: "uses elite close control to beat defenders 1v1" },
  { style: "Maestro", behavior: "plays unusually precise weighted through-balls" },
  { style: "Wall", behavior: "elite tackling, interception and defensive duels" },
  { style: "Wingback Master", behavior: "wins the ball, carries wide and delivers highly accurate crosses" },
  { style: "Guardian", behavior: "elite positioning, reactions and one-on-one saves" },
  { style: "Speed Demon", behavior: "explodes into space with exceptional acceleration" },
  { style: "Power Finisher", behavior: "converts high-power shots with exceptional consistency" },
]

export const specialPlayers: SpecialPlayer[] = [
  { id: "sp1", style: "Hammer", role: "Target Forward", rating: 90, specialAbility: "Aerial Hammer", attributes: { pace: 68, passing: 72, shooting: 91, defending: 18, stamina: 88, heading: 99, strength: 98 } },
  { id: "sp2", style: "Free-Kick Specialist", role: "Playmaker", rating: 91, specialAbility: "Dead-Ball Master", attributes: { pace: 78, passing: 98, shooting: 92, defending: 42, stamina: 86, heading: 45, strength: 58 } },
  { id: "sp3", style: "Mezzala", role: "Mezzala", rating: 92, specialAbility: "Half-Space Overload", attributes: { pace: 87, passing: 94, shooting: 88, defending: 58, stamina: 96, heading: 51, strength: 70 } },
  { id: "sp4", style: "Pressing Forward", role: "Pressing Forward", rating: 89, specialAbility: "Relentless Press", attributes: { pace: 91, passing: 74, shooting: 84, defending: 67, stamina: 99, heading: 58, strength: 78 } },
  { id: "sp5", style: "Long-Range Sniper", role: "Advanced Forward", rating: 93, specialAbility: "Sniper Strike", attributes: { pace: 89, passing: 78, shooting: 99, defending: 15, stamina: 84, heading: 73, strength: 76 } },
  { id: "sp6", style: "Dribble King", role: "Inside Forward", rating: 94, specialAbility: "Ankle Breaker", attributes: { pace: 98, passing: 88, shooting: 90, defending: 22, stamina: 92, heading: 44, strength: 63 } },
  { id: "sp7", style: "Maestro", role: "Playmaker", rating: 94, specialAbility: "Threaded Needle", attributes: { pace: 82, passing: 99, shooting: 84, defending: 46, stamina: 90, heading: 39, strength: 55 } },
  { id: "sp8", style: "Wall", role: "Ball-Playing Defender", rating: 92, specialAbility: "Lockdown", attributes: { pace: 78, passing: 87, shooting: 20, defending: 99, stamina: 94, heading: 94, strength: 97 } },
  { id: "sp9", style: "Wingback Master", role: "Wingback", rating: 90, specialAbility: "Endless Overlap", attributes: { pace: 96, passing: 91, shooting: 48, defending: 88, stamina: 99, heading: 52, strength: 75 } },
  { id: "sp10", style: "Guardian", role: "Sweeper Keeper", rating: 95, specialAbility: "Impossible Save", attributes: { pace: 72, passing: 89, shooting: 12, defending: 99, stamina: 96, heading: 62, strength: 91 } },
  { id: "sp11", style: "Speed Demon", role: "Winger", rating: 91, specialAbility: "Afterburner", attributes: { pace: 99, passing: 86, shooting: 82, defending: 27, stamina: 94, heading: 43, strength: 65 } },
  { id: "sp12", style: "Power Finisher", role: "Complete Forward", rating: 92, specialAbility: "Thunder Shot", attributes: { pace: 86, passing: 79, shooting: 98, defending: 19, stamina: 90, heading: 91, strength: 94 } },
]

export type Player = {
  id: string
  name: string
  pos: "GK" | "DEF" | "MID" | "FWD"
  rating: number
  stamina: number
  style: PlayerRole
  number?: number
  face?: string
  look?: string
  height?: number
  attributes?: {
    pace: number
    passing: number
    shooting: number
    defending: number
    stamina: number
    heading: number
    strength: number
  }
  specialStyle?: SpecialPlayerStyle
  specialName?: string
  specialAbility?: string
  specialColor?: string
  specialTemplateId?: string
}


export const squad: Player[] = [
  { id: "p1", name: "L. Farrow", pos: "GK", rating: 84, stamina: 92, style: "Sweeper Keeper", specialStyle: "Guardian", specialName: "The Guardian" },
  { id: "p2", name: "D. Nakamura", pos: "DEF", rating: 81, stamina: 74, style: "Inverted Fullback", specialStyle: "Wingback Master", specialName: "Wing Phantom" },
  { id: "p3", name: "R. Okafor", pos: "DEF", rating: 86, stamina: 63, style: "Ball-Playing Defender", specialStyle: "Wall", specialName: "Iron Wall" },
  { id: "p4", name: "M. Silvana", pos: "MID", rating: 88, stamina: 55, style: "Mezzala", specialStyle: "Mezzala", specialName: "Silk Runner" },
  { id: "p5", name: "J. Petrov", pos: "MID", rating: 83, stamina: 81, style: "Playmaker", specialStyle: "Maestro", specialName: "The Architect" },
  { id: "p6", name: "A. Cruz", pos: "FWD", rating: 90, stamina: 38, style: "False Nine", specialStyle: "Hammer", specialName: "The Anvil" },
  { id: "p7", name: "K. Adeyemi", pos: "FWD", rating: 85, stamina: 69, style: "Inside Forward", specialStyle: "Dribble King", specialName: "Velvet Feet" },
  { id: "p8", name: "S. Okoro", pos: "DEF", rating: 82, stamina: 78, style: "Stopper" },
  { id: "p9", name: "E. Mensah", pos: "DEF", rating: 80, stamina: 84, style: "Wingback" },
  { id: "p10", name: "N. Ibrahim", pos: "MID", rating: 84, stamina: 88, style: "Box-to-Box" },
  { id: "p11", name: "R. Silva", pos: "FWD", rating: 82, stamina: 76, style: "Winger" },
  { id: "p12", name: "T. Bello", pos: "GK", rating: 79, stamina: 90, style: "Sweeper Keeper" },
  { id: "p13", name: "V. Rossi", pos: "DEF", rating: 83, stamina: 86, style: "Ball-Playing Defender" },
  { id: "p14", name: "O. Diallo", pos: "DEF", rating: 80, stamina: 79, style: "Stopper" },
  { id: "p15", name: "M. Chen", pos: "DEF", rating: 78, stamina: 91, style: "Wingback" },
  { id: "p16", name: "I. Mensah", pos: "MID", rating: 81, stamina: 87, style: "Holding Midfielder" },
  { id: "p17", name: "S. Haruki", pos: "MID", rating: 85, stamina: 83, style: "Deep-Lying Playmaker" },
  { id: "p18", name: "A. Okeke", pos: "MID", rating: 82, stamina: 89, style: "Ball Winner" },
  { id: "p19", name: "T. Bergstrom", pos: "MID", rating: 84, stamina: 77, style: "Box-to-Box" },
  { id: "p20", name: "Y. Silva", pos: "FWD", rating: 81, stamina: 85, style: "Pressing Forward" },
  { id: "p21", name: "P. Novak", pos: "FWD", rating: 83, stamina: 72, style: "Advanced Forward" },
  { id: "p22", name: "J. Adekunle", pos: "FWD", rating: 80, stamina: 88, style: "Poacher" },
  { id: "p23", name: "C. Mensah", pos: "FWD", rating: 79, stamina: 90, style: "Winger" },
  { id: "p24", name: "E. Costa", pos: "FWD", rating: 82, stamina: 80, style: "Complete Forward" },
]


export const playerPool: Player[] = [
  { id: "p25", name: "M. Varela", pos: "GK", rating: 86, stamina: 94, style: "Sweeper Keeper", number: 1, height: 191, face: "https://i.pravatar.cc/240?img=36", look: "Clean Fade", attributes: { pace: 68, passing: 82, shooting: 18, defending: 84, stamina: 94, heading: 61, strength: 86 }, specialStyle: "Guardian", specialName: "Night Watch" },
  { id: "p26", name: "K. Mensah", pos: "GK", rating: 81, stamina: 91, style: "Sweeper Keeper", number: 13, height: 188, face: "https://i.pravatar.cc/240?img=37", look: "Short Crop", attributes: { pace: 64, passing: 76, shooting: 15, defending: 80, stamina: 91, heading: 58, strength: 82 } },
  { id: "p27", name: "A. Moretti", pos: "DEF", rating: 87, stamina: 88, style: "Ball-Playing Defender", number: 4, height: 188, face: "https://i.pravatar.cc/240?img=38", look: "Textured Crop", attributes: { pace: 72, passing: 86, shooting: 28, defending: 91, stamina: 88, heading: 89, strength: 90 }, specialStyle: "Wall", specialName: "Fortress" },
  { id: "p28", name: "D. Okoye", pos: "DEF", rating: 84, stamina: 86, style: "Stopper", number: 5, height: 193, face: "https://i.pravatar.cc/240?img=39", look: "High Fade", attributes: { pace: 69, passing: 70, shooting: 22, defending: 89, stamina: 86, heading: 92, strength: 94 } },
  { id: "p29", name: "L. Tanaka", pos: "DEF", rating: 85, stamina: 90, style: "Inverted Fullback", number: 2, height: 177, face: "https://i.pravatar.cc/240?img=40", look: "Neat Crop", attributes: { pace: 88, passing: 84, shooting: 35, defending: 82, stamina: 90, heading: 58, strength: 69 } },
  { id: "p30", name: "S. Diallo", pos: "DEF", rating: 82, stamina: 87, style: "Wingback", number: 3, height: 181, face: "https://i.pravatar.cc/240?img=41", look: "Short Twist", attributes: { pace: 91, passing: 79, shooting: 38, defending: 78, stamina: 87, heading: 55, strength: 72 } },
  { id: "p31", name: "R. Kovac", pos: "DEF", rating: 83, stamina: 84, style: "Ball-Playing Defender", number: 15, height: 186, face: "https://i.pravatar.cc/240?img=42", look: "Classic Crop", attributes: { pace: 70, passing: 83, shooting: 24, defending: 86, stamina: 84, heading: 85, strength: 88 } },
  { id: "p32", name: "J. Adeola", pos: "DEF", rating: 80, stamina: 92, style: "Wingback", number: 22, height: 179, face: "https://i.pravatar.cc/240?img=43", look: "Low Fade", attributes: { pace: 90, passing: 75, shooting: 42, defending: 74, stamina: 92, heading: 52, strength: 67 } },
  { id: "p33", name: "N. Costa", pos: "MID", rating: 89, stamina: 91, style: "Playmaker", number: 8, height: 176, face: "https://i.pravatar.cc/240?img=44", look: "Wavy Top", attributes: { pace: 78, passing: 96, shooting: 82, defending: 54, stamina: 91, heading: 45, strength: 61 }, specialStyle: "Maestro", specialName: "Metronome" },
  { id: "p34", name: "T. Mensah", pos: "MID", rating: 86, stamina: 95, style: "Box-to-Box", number: 6, height: 183, face: "https://i.pravatar.cc/240?img=45", look: "Buzz Cut", attributes: { pace: 82, passing: 86, shooting: 76, defending: 78, stamina: 95, heading: 68, strength: 84 } },
  { id: "p35", name: "E. Nakamoto", pos: "MID", rating: 84, stamina: 89, style: "Deep-Lying Playmaker", number: 14, height: 174, face: "https://i.pravatar.cc/240?img=46", look: "Side Part", attributes: { pace: 66, passing: 94, shooting: 70, defending: 65, stamina: 89, heading: 42, strength: 58 } },
  { id: "p36", name: "B. Okafor", pos: "MID", rating: 85, stamina: 93, style: "Ball Winner", number: 18, height: 185, face: "https://i.pravatar.cc/240?img=47", look: "Temple Fade", attributes: { pace: 80, passing: 72, shooting: 55, defending: 91, stamina: 93, heading: 70, strength: 91 }, specialStyle: "Wall", specialName: "The Enforcer" },
  { id: "p37", name: "I. Romero", pos: "MID", rating: 87, stamina: 88, style: "Mezzala", number: 10, height: 180, face: "https://i.pravatar.cc/240?img=48", look: "Curly Crop", attributes: { pace: 84, passing: 89, shooting: 79, defending: 57, stamina: 88, heading: 48, strength: 63 }, specialStyle: "Mezzala", specialName: "Half-Space Ghost" },
  { id: "p38", name: "Y. Ibrahim", pos: "MID", rating: 83, stamina: 90, style: "Holding Midfielder", number: 20, height: 187, face: "https://i.pravatar.cc/240?img=49", look: "Short Twist", attributes: { pace: 62, passing: 80, shooting: 38, defending: 86, stamina: 90, heading: 74, strength: 89 } },
  { id: "p39", name: "C. Silva", pos: "MID", rating: 82, stamina: 87, style: "Shadow Striker", number: 21, height: 178, face: "https://i.pravatar.cc/240?img=50", look: "Modern Fade", attributes: { pace: 86, passing: 82, shooting: 84, defending: 35, stamina: 87, heading: 51, strength: 62 } },
  { id: "p40", name: "M. Bello", pos: "MID", rating: 81, stamina: 94, style: "Pressing Forward", number: 17, height: 181, face: "https://i.pravatar.cc/240?img=51", look: "Clean Cut", attributes: { pace: 88, passing: 70, shooting: 66, defending: 58, stamina: 94, heading: 59, strength: 75 } },
  { id: "p41", name: "J. Varga", pos: "FWD", rating: 88, stamina: 82, style: "Advanced Forward", number: 9, height: 184, face: "https://i.pravatar.cc/240?img=52", look: "Textured Fade", attributes: { pace: 94, passing: 70, shooting: 93, defending: 18, stamina: 82, heading: 79, strength: 81 }, specialStyle: "Long-Range Sniper", specialName: "The Cannon" },
  { id: "p42", name: "K. Adebayo", pos: "FWD", rating: 86, stamina: 85, style: "Complete Forward", number: 11, height: 187, face: "https://i.pravatar.cc/240?img=53", look: "High Fade", attributes: { pace: 88, passing: 78, shooting: 89, defending: 22, stamina: 85, heading: 88, strength: 87 } },
  { id: "p43", name: "L. Marin", pos: "FWD", rating: 84, stamina: 80, style: "Poacher", number: 19, height: 180, face: "https://i.pravatar.cc/240?img=54", look: "Short Crop", attributes: { pace: 87, passing: 61, shooting: 94, defending: 14, stamina: 80, heading: 82, strength: 73 } },
  { id: "p44", name: "S. Okoro", pos: "FWD", rating: 85, stamina: 89, style: "Winger", number: 7, height: 176, face: "https://i.pravatar.cc/240?img=55", look: "Braided Top", attributes: { pace: 96, passing: 83, shooting: 78, defending: 29, stamina: 89, heading: 44, strength: 60 }, specialStyle: "Dribble King", specialName: "Street Silk" },
  { id: "p45", name: "D. Reyes", pos: "FWD", rating: 83, stamina: 91, style: "Inside Forward", number: 23, height: 179, face: "https://i.pravatar.cc/240?img=56", look: "Curly Top", attributes: { pace: 92, passing: 76, shooting: 86, defending: 24, stamina: 91, heading: 48, strength: 64 } },
  { id: "p46", name: "A. Mensah", pos: "FWD", rating: 80, stamina: 86, style: "Target Forward", number: 25, height: 194, face: "https://i.pravatar.cc/240?img=57", look: "Buzz Cut", attributes: { pace: 62, passing: 65, shooting: 80, defending: 17, stamina: 86, heading: 96, strength: 97 }, specialStyle: "Hammer", specialName: "Tower" },
  { id: "p47", name: "N. Tanaka", pos: "FWD", rating: 82, stamina: 93, style: "Pressing Forward", number: 28, height: 175, face: "https://i.pravatar.cc/240?img=58", look: "Neat Crop", attributes: { pace: 90, passing: 69, shooting: 74, defending: 51, stamina: 93, heading: 41, strength: 57 }, specialStyle: "Pressing Forward", specialName: "The Hound" },
  { id: "p48", name: "R. Diallo", pos: "FWD", rating: 79, stamina: 88, style: "False Nine", number: 29, height: 182, face: "https://i.pravatar.cc/240?img=59", look: "Short Twist", attributes: { pace: 81, passing: 85, shooting: 72, defending: 18, stamina: 88, heading: 56, strength: 68 } },
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
    { id: "w1", title: "Win 5 online matches", progress: 3, goal: 5, reward: "+1,200 bucks", accent: "cyan" as const },
    { id: "w2", title: "Score 12 goals", progress: 9, goal: 12, reward: "Silver Package", accent: "emerald" as const },
    { id: "w3", title: "Complete 3 friend matches", progress: 1, goal: 3, reward: "+150 gems", accent: "cyan" as const },
  ] satisfies WeeklyChallenge[],
}

export const wallet = {
  bucks: 10000,
  gems: 100,
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
    { tier: 21, free: "250 Bucks", paid: "Rare Crate", freeClaimed: true, paidClaimed: true },
    { tier: 22, free: "1 Gem", paid: "500 Bucks", freeClaimed: true, paidClaimed: true },
    { tier: 23, free: "Stamina x2", paid: "Epic Kit", freeClaimed: false, paidClaimed: false },
    { tier: 24, free: "300 Bucks", paid: "5 Gems", freeClaimed: false, paidClaimed: false },
    { tier: 25, free: "Silver Crate", paid: "Legend Token", freeClaimed: false, paidClaimed: false },
    { tier: 26, free: "150 Bucks", paid: "Gold Crate", freeClaimed: false, paidClaimed: false },
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
    { day: 1, reward: "100 Bucks", state: "claimed" },
    { day: 2, reward: "1 Gem", state: "claimed" },
    { day: 3, reward: "Bronze Crate", state: "claimed" },
    { day: 4, reward: "250 Bucks", state: "today" },
    { day: 5, reward: "3 Gems", state: "locked" },
    { day: 6, reward: "Silver Crate", state: "locked" },
    { day: 7, reward: "Gold Crate", state: "locked" },
  ] satisfies DailyChallengeDay[],
  objectives: [
    { id: "o1", title: "Win 5 online matches", progress: 5, goal: 5, reward: "+1,200 Bucks", claimable: true },
    { id: "o2", title: "Score 12 goals", progress: 9, goal: 12, reward: "Silver Package" },
    { id: "o3", title: "Complete 3 friend matches", progress: 1, goal: 3, reward: "+150 Gems" },
  ] satisfies WeeklyResetObjective[],
}

export const manager = {
  name: "A. Vega",
  club: "Aurora FC",
  crest: "AUR",
  level: 27,
}
