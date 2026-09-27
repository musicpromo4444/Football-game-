"use client"

export type AuctionPosition = "GK" | "DEF" | "MID" | "FWD"

export type AuctionAttributes = {
  pace: number
  passing: number
  shooting: number
  defending: number
  stamina: number
  heading: number
  strength: number
}

export type AuctionPlayer = {
  id: string
  name: string
  number: number
  position: AuctionPosition
  rating: number
  height: number
  style: string
  face: string
  look: string
  attributes: AuctionAttributes
  startingBucks: number
  startingGems: number
  currentBucks: number
  currentGems: number
  buyNowBucks: number
  buyNowGems: number
  endsAt: number
  enabled: boolean
  highestBidder?: "you" | null
  status?: "live" | "sold" | "unsold"
  heldBucks?: number
  heldGems?: number
}

const NAMES = ["Milo Vance","Kairo Mendes","Jonas Vale","Rayan Costa","Dario Silva","Noah Mercer","Luca Marin","Eli Navarro","Tariq Bello","Soren Nygaard","Kenji Ito","Mateo Cruz","Amir Diallo","Nico Varela","Jude Mercer","Leo Santos","Mika Tanaka","Adrian Cole","Samir Khan","Theo Grant"]
const STYLES = ["Advanced Forward","Poacher","Complete Forward","Inside Forward","Winger","Mezzala","Playmaker","Box-to-Box","Ball Winner","Deep-Lying Playmaker","Wingback","Ball-Playing Defender","Stopper","Sweeper Keeper"]
const LOOKS = ["Sharp Fade","Curly Crop","Short Twist","Clean Cut","High Fade","Wavy Top","Buzz Cut","Braided Top","Classic Crop","Long Curl"]
const FACES = ["MV","KM","JV","RC","DS","NM","LM","EN","TB","SN","KI","MC","AD","NV","JM","LS","MT","AC","SK","TG"]

function rand(min:number,max:number){ return Math.floor(Math.random()*(max-min+1))+min }
function pick<T>(items:T[]){ return items[rand(0,items.length-1)] }

export function generateAuctionPlayer(index = 0): AuctionPlayer {
  const position = pick<AuctionPosition>(["GK","DEF","MID","FWD"])
  const rating = rand(72, 91)
  const base = rand(62, 94)
  const attributes = {
    pace: Math.max(35, Math.min(99, base + rand(-12,12))),
    passing: Math.max(35, Math.min(99, base + rand(-12,12))),
    shooting: Math.max(25, Math.min(99, base + rand(-14,14))),
    defending: Math.max(25, Math.min(99, base + rand(-14,14))),
    stamina: Math.max(45, Math.min(99, base + rand(-10,10))),
    heading: Math.max(30, Math.min(99, base + rand(-15,10))),
    strength: Math.max(40, Math.min(99, base + rand(-10,10))),
  }
  const bucks = Math.round(rand(1200, 15000) / 100) * 100
  const gems = rand(0, 80)
  return {
    id: `a-${Date.now()}-${index}-${rand(1000,9999)}`,
    name: pick(NAMES),
    number: rand(1,99),
    position,
    rating,
    height: rand(168,201),
    style: pick(STYLES),
    face: pick(FACES),
    look: pick(LOOKS),
    attributes,
    startingBucks: bucks,
    startingGems: gems,
    currentBucks: bucks,
    currentGems: gems,
    buyNowBucks: Math.round((bucks * 1.8) / 100) * 100,
    buyNowGems: Math.max(gems, Math.round((gems * 1.6))),
    endsAt: Date.now() + rand(5,30) * 60 * 1000,
    enabled: true,
    highestBidder: null,
    status: "live",
    heldBucks: 0,
    heldGems: 0,
  }
}

export function generateAuctionPlayers(amount:number): AuctionPlayer[] {
  return Array.from({length:Math.max(1,Math.min(30,amount))},(_,i)=>generateAuctionPlayer(i))
}

export const DEFAULT_AUCTION_PLAYERS: AuctionPlayer[] = generateAuctionPlayers(4)

export const AUCTION_KEY = "pitchside-auction-players"
export const AUCTION_WALLET_KEY = "pitchside-wallet"

export function readAuctionPlayers(): AuctionPlayer[] {
  if (typeof window === "undefined") return DEFAULT_AUCTION_PLAYERS
  try {
    const saved = JSON.parse(localStorage.getItem(AUCTION_KEY) || "null")
    if (Array.isArray(saved) && saved.length) return saved
  } catch {}
  return DEFAULT_AUCTION_PLAYERS
}

export function saveAuctionPlayers(players: AuctionPlayer[]) {
  if (typeof window !== "undefined") localStorage.setItem(AUCTION_KEY, JSON.stringify(players))
}

export function formatAuctionTime(endsAt:number, now=Date.now()) {
  const seconds=Math.max(0,Math.ceil((endsAt-now)/1000))
  const m=Math.floor(seconds/60).toString().padStart(2,"0")
  const s=(seconds%60).toString().padStart(2,"0")
  return `${m}:${s}`
}

export function getNextBid(current:number){ return Math.max(100,current+100) }

export function renameAuctionPlayer(name:string): string {
  return name.trim().slice(0,24) || "Panda Player"
}
