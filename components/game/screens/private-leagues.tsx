"u
function buildKnockout(teams: Team[]): Fixture[] {
  const out: Fixture[] = []
  for (let i = 0; i + 1 < teams.length; i += 2) out.push({id:crypto.randomUUID?.() || "r1-"+i,round:1,home:teams[i].id,away:teams[i+1].id,homeGoals:null,awayGoals:null,played:false})
  return out
}
se client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Copy, Check, Users, Crown, Sparkles, Globe2, MapPin, ShieldCheck, Hash, Trophy, CalendarDays, ArrowLeft, Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScreenHeader, Card } from "@/components/game/ui-bits"
import { supabase } from "@/lib/supabase"

type Mode = "Home & Away" | "Knockout"
type League = {
  id: string; name: string; scope: "Worldwide" | "Country"; country?: string
  minRating: number | null; maxUsers: number; members: number; code: string; owner: boolean
  mode: Mode; started?: boolean
}
type Team = { id: string; name: string; played: number; wins: number; draws: number; losses: number; gf: number; ga: number }
type Fixture = { id: string; round?: number; home: string; away: string; homeGoals: number | null; awayGoals: number | null; played: boolean }

const STORAGE_KEY = "pitchside-user-leagues"
const DETAIL_KEY = "pitchside-league-details"

function readLeagues(): League[] {
  if (typeof window === "undefined") return []
  try { const x = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(x) ? x : [] } catch { return [] }
}
function saveLeagues(x: League[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(x)); window.dispatchEvent(new Event("pitchside-leagues-updated")) }
function makeCode() { return "PS-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.floor(10 + Math.random() * 90) }
function readDetails(): Record<string, {teams: Team[]; fixtures: Fixture[]}> {
  try { return JSON.parse(localStorage.getItem(DETAIL_KEY) || "{}") } catch { return {} }
}
function saveDetails(x: Record<string, {teams: Team[]; fixtures: Fixture[]}>) { localStorage.setItem(DETAIL_KEY, JSON.stringify(x)) }

function buildRoundRobin(teams: Team[]): Fixture[] {
  const ids = teams.map(t => t.id)
  const list = [...ids]
  if (list.length % 2) list.push("BYE")
  const out: Fixture[] = []
  const rounds = list.length - 1
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < list.length / 2; i++) {
      const a = list[i], b = list[list.length - 1 - i]
      if (a !== "BYE" && b !== "BYE") {
        out.push({ id: crypto.randomUUID?.() || `${r}-a${i}`, round:r+1, home: a, away: b, homeGoals: null, awayGoals: null, played: false })
        out.push({ id: crypto.randomUUID?.() || `${r}-b${i}`, round:r+1, home: b, away: a, homeGoals: null, awayGoals: null, played: false })
      }
    }
    const fixed = list[0], rest = list.slice(1)
    rest.unshift(rest.pop()!)
    list.splice(0, list.length, fixed, ...rest)
  }
  return out
}

function buildKnockout(teams: Team[]): Fixture[] {
  const out: Fixture[] = []
  for (let i = 0; i + 1 < teams.length; i += 2) out.push({id:crypto.randomUUID?.() || "r1-"+i,round:1,home:teams[i].id,away:teams[i+1].id,homeGoals:null,awayGoals:null,played:false})
  return out
}

export function PrivateLeagues({ onBack }: { onBack?: () => void }) {
  const [leagues, setLeagues] = useState<League[]>(readLeagues)
  const [details, setDetails] = useState(readDetails)
  const [selected, setSelected] = useState<string | null>(null)
  const [leagueName, setLeagueName] = useState("")
  const [scope, setScope] = useState<"Worldwide" | "Country">("Worldwide")
  const [country, setCountry] = useState("")
  const [minRating, setMinRating] = useState("Minimum")
  const [maxUsers, setMaxUsers] = useState("8")
  const [mode, setMode] = useState<Mode>("Home & Away")
  const [joinCode, setJoinCode] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session?.user || cancelled) return
      const { data: rows } = await supabase.from("pitchside_private_leagues").select("id,name,scope,country,min_rating,max_users,invitation_code,mode,status").order("created_at",{ascending:false})
      if (!rows || cancelled) return
      const mapped = rows.map((r:any) => ({ id:r.id,name:r.name,scope:r.scope,country:r.country || undefined,minRating:r.min_rating,maxUsers:r.max_users,members:1,code:r.invitation_code,owner:r.owner_id===session.session.user.id,mode:r.mode,started:r.status==="started" }))
      for (const l of mapped) {
        const { count } = await supabase.from("pitchside_private_league_members").select("id",{count:"exact",head:true}).eq("league_id",l.id)
        l.members = count || 0
      }
      if (!cancelled) setLeagues(mapped)
    })()
    return () => { cancelled = true }
  }, [])

  const codePreview = useMemo(() => makeCode(), [leagueName])

  const copy = (code: string) => { navigator.clipboard?.writeText(code).catch(() => {}); setCopied(code); setTimeout(() => setCopied(c => c === code ? null : c), 1500) }

  const createLeague = async () => {
    if (!leagueName.trim()) return setMessage("Enter a league name.")
    if (scope === "Country" && !country.trim()) return setMessage("Choose a country.")
    const league: League = { id: crypto.randomUUID?.() || Date.now().toString(), name: leagueName.trim(), scope, country: scope === "Country" ? country.trim() : undefined, minRating: minRating === "Minimum" ? null : Number(minRating), maxUsers: Number(maxUsers), members: 1, code: codePreview, owner: true, mode }
    let remoteId: string | null = null
    if (supabase) {
      const { data: session } = await supabase.auth.getSession()
      if (session.session?.user) {
        const { data: remote, error } = await supabase.from("pitchside_private_leagues").insert({
          owner_id: session.session.user.id, name: league.name, mode: league.mode, scope: league.scope,
          country: league.country || null, min_rating: league.minRating, max_users: league.maxUsers, invitation_code: league.code
        }).select().single()
        if (!error && remote) {
          remoteId = remote.id
          await supabase.from("pitchside_private_league_members").insert({league_id: remote.id,user_id:session.session.user.id,team_name:"My FC"})
        }
      }
    }
    if (remoteId) league.id = remoteId
    const next = [league, ...leagues]; setLeagues(next); saveLeagues(next)
    setLeagueName(""); setMessage("League created. Share the invitation code."); setSelected(league.id)
    const team: Team = { id: league.id + "-me", name: "My FC", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }
    const d = { ...details, [league.id]: { teams: [team], fixtures: [] } }; setDetails(d); saveDetails(d)
  }

  const joinLeague = async () => {
    const code = joinCode.trim().toUpperCase()
    let own = leagues.find(l => l.code.toUpperCase() === code)
    if (!own && supabase) {
      const { data, error } = await supabase.rpc("pitchside_join_private_league", { p_code: code })
      if (!error && data) {
        own = { id:data.id, name:data.name, scope:data.scope, country:data.country || undefined, minRating:data.min_rating, maxUsers:data.max_users, members:2, code:data.invitation_code, owner:false, mode:data.mode }
        const next = [own, ...leagues.filter(l => l.id !== own!.id)]; setLeagues(next); saveLeagues(next); setJoinCode(""); setSelected(own.id); setMessage("You joined the league successfully."); return
      }
    }
    if (!own) return setMessage("League not found. Check the invitation code.")
    if (own.members >= own.maxUsers) return setMessage("This league is full.")
    const next = leagues.map(l => l.id === own.id ? { ...l, members: l.members + 1, owner: false } : l)
    setLeagues(next); saveLeagues(next); setJoinCode(""); setSelected(own.id); setMessage("You joined the league successfully.")
  }

  const openLeague = (id: string) => {
    let d = details[id]
    if (!d) {
      const l = leagues.find(x => x.id === id)!
      const team: Team = { id: id + "-me", name: "My FC", played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }
      d = { teams: [team], fixtures: [] }; const next = { ...details, [id]: d }; setDetails(next); saveDetails(next)
    }
    setSelected(id)
  }

  const startLeague = async () => {
    if (!selected) return
    const l = leagues.find(x => x.id === selected); if (!l) return
    const d = details[selected] || { teams: [], fixtures: [] }
    if (d.teams.length < 2) return setMessage("Invite at least one more player before starting.")
    let teams = d.teams
    if (supabase) {
      const { data: members } = await supabase.from("pitchside_private_league_members").select("user_id,team_name").eq("league_id",selected)
      if (members && members.length >= 2) teams = members.map((m:any) => ({id:m.user_id,name:m.team_name || "My FC",played:0,wins:0,draws:0,losses:0,gf:0,ga:0}))
    }
    const fixtures = l.mode === "Home & Away" ? buildRoundRobin(teams) : buildKnockout(teams)

    if (supabase && fixtures.length) {
      await supabase.from("pitchside_private_league_fixtures").delete().eq("league_id", selected)
      await supabase.from("pitchside_private_league_fixtures").insert(fixtures.map((f:any) => ({
        id:f.id, league_id:selected, round_no:1, home_user_id:f.home, away_user_id:f.away
      })))
    }
    const nextDetails = { ...details, [selected]: { ...d, teams, fixtures } }
    setDetails(nextDetails); saveDetails(nextDetails)
    const nextLeagues = leagues.map(x => x.id === selected ? { ...x, started: true } : x); setLeagues(nextLeagues); saveLeagues(nextLeagues)
    if (supabase) await supabase.from("pitchside_private_leagues").update({status:"started",started_at:new Date().toISOString()}).eq("id",selected)
    setMessage("League started.")
  }


  const selectedLeague = leagues.find(l => l.id === selected)
  const selectedDetail = selected ? details[selected] : null

  if (selected && selectedLeague && selectedDetail) {
    const standings = [...selectedDetail.teams].sort((a,b) => ((b.wins*3+b.draws) - (a.wins*3+a.draws)) || ((b.gf-b.ga)-(a.gf-a.ga)) || (b.gf-a.gf))
    return <div className="pb-6">
      <div className="px-5 pt-3"><button type="button" onClick={() => setSelected(null)} className="mb-3 flex items-center gap-2 text-xs font-bold text-muted-foreground"><ArrowLeft className="h-4 w-4"/> Cancel</button></div>
      <ScreenHeader title={selectedLeague.name} subtitle={selectedLeague.mode + " · " + selectedLeague.members + "/" + selectedLeague.maxUsers + " players"} />
      <div className="space-y-3 px-5">
        <Card className="p-4">
          <div className="flex items-center gap-3"><Trophy className="h-6 w-6 text-primary"/><div><p className="text-sm font-black">Competition</p><p className="text-[10px] text-muted-foreground">{selectedLeague.scope}{selectedLeague.country ? " · " + selectedLeague.country : ""} · {selectedLeague.minRating ? "Min OVR " + selectedLeague.minRating : "No rating minimum"}</p></div></div>
          {!selectedLeague.started && selectedLeague.owner && <Button onClick={startLeague} className="mt-3 w-full rounded-xl">Start League</Button>}
          {!selectedLeague.started && !selectedLeague.owner && <p className="mt-3 rounded-xl bg-secondary p-3 text-[10px] text-muted-foreground">Waiting for the league creator to start the competition.</p>}

        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><Users className="h-4 w-4 text-primary"/><p className="text-xs font-black">Standings</p></div>
          <div className="grid grid-cols-[22px_1fr_34px_34px_34px_42px] gap-1 border-b border-border pb-2 text-[8px] text-muted-foreground"><span>#</span><span>TEAM</span><span>P</span><span>W</span><span>D</span><span>PTS</span></div>
          <div className="space-y-1 pt-1">{standings.map((t,i) => <div key={t.id} className="grid grid-cols-[22px_1fr_34px_34px_34px_42px] items-center gap-1 rounded-lg bg-secondary/50 px-1 py-2 text-[9px]"><span>{i+1}</span><b className="truncate">{t.name}</b><span>{t.played}</span><span>{t.wins}</span><span>{t.draws}</span><b>{t.wins*3+t.draws}</b></div>)}</div>
        </Card>

        {selectedLeague.mode === "Home & Away" ? <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><CalendarDays className="h-4 w-4 text-primary"/><p className="text-xs font-black">Fixtures</p></div>
          {selectedDetail.fixtures.length === 0 ? <p className="text-[10px] text-muted-foreground">Fixtures will appear when the league starts with at least two players.</p> : <div className="space-y-2">{selectedDetail.fixtures.map(f => { const me=selectedDetail.teams[0]; const mine=!!me && (f.home===me.id || f.away===me.id); return <div key={f.id} className="rounded-xl bg-secondary/50 p-3 text-[9px]"><div className="flex justify-between"><span>{selectedDetail.teams.find(t=>t.id===f.home)?.name}</span><b>{f.played ? f.homeGoals + " - " + f.awayGoals : "vs"}</b><span>{selectedDetail.teams.find(t=>t.id===f.away)?.name}</span></div>{!f.played && mine ? <Button onClick={() => window.dispatchEvent(new CustomEvent("pitchside-start-league-fixture",{detail:{leagueId:selectedLeague.id,fixtureId:f.id,userIsHome:f.home===me.id}}))} className="mt-2 h-8 w-full rounded-lg text-[9px]">Play Fixture</Button> : null}</div> })}</div>}
        </Card> : <Card className="p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary"/><p className="text-xs font-black">Knockout</p></div><p className="mt-2 text-[10px] text-muted-foreground">Players are paired into rounds. Winners advance and losers are eliminated. The knockout bracket will use the same match engine.</p></Card>}

        <Button variant="outline" onClick={() => setSelected(null)} className="w-full rounded-xl"><Home className="mr-2 h-4 w-4"/> Back to Leagues</Button>
      </div>
    </div>
  }

  return <div className="pb-6">
    <ScreenHeader title="Leagues" subtitle="Create a league, invite players and compete" />
    <div className="space-y-4 px-5">
      <Card glow="emerald" className="p-5">
        <div className="mb-4 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent"><Sparkles className="h-5 w-5"/></span><div><p className="font-display text-sm font-bold">Create a League</p><p className="text-xs text-muted-foreground">Choose the competition style and invite players.</p></div></div>
        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">League name</label>
        <input value={leagueName} onChange={e=>setLeagueName(e.target.value)} placeholder="e.g. Weekend Warriors" className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/60 px-3.5 text-sm outline-none focus:border-accent"/>
        <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Competition style</label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">{(["Home & Away","Knockout"] as Mode[]).map(x=><button type="button" key={x} onClick={()=>setMode(x)} className={`rounded-xl border p-3 text-left ${mode===x?"border-primary bg-primary/10":"border-border bg-secondary/40"}`}><Trophy className="mb-1 h-4 w-4 text-primary"/><p className="text-xs font-bold">{x}</p><p className="text-[9px] text-muted-foreground">{x==="Home & Away" ? "Play every opponent twice" : "Win to advance"}</p></button>)}</div>
        <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">League scope</label>
        <div className="mt-1.5 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setScope("Worldwide")} className={`rounded-xl border p-3 text-left ${scope==="Worldwide"?"border-primary bg-primary/10":"border-border bg-secondary/40"}`}><Globe2 className="mb-1 h-4 w-4 text-primary"/><p className="text-xs font-bold">Worldwide</p></button><button type="button" onClick={()=>setScope("Country")} className={`rounded-xl border p-3 text-left ${scope==="Country"?"border-primary bg-primary/10":"border-border bg-secondary/40"}`}><MapPin className="mb-1 h-4 w-4 text-primary"/><p className="text-xs font-bold">Country</p></button></div>
        {scope==="Country" && <input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country name" className="mt-2 h-10 w-full rounded-xl border border-border bg-secondary/60 px-3 text-xs outline-none"/>}
        <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Minimum team rating</label>
        <select value={minRating} onChange={e=>setMinRating(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/60 px-3 text-sm"><option>Minimum</option>{[70,75,80,85,90].map(n=><option key={n}>{n}</option>)}</select>
        <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Players required</label>
        <select value={maxUsers} onChange={e=>setMaxUsers(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-border bg-secondary/60 px-3 text-sm">{[4,8,12,16,20,32,64].map(n=><option key={n}>{n} users</option>)}</select>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-border bg-secondary/40 px-3.5 py-2.5"><div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Invitation code</p><p className="font-mono text-sm font-bold text-accent">{codePreview}</p></div><button type="button" onClick={()=>copy(codePreview)} className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 py-1.5 text-xs font-semibold text-accent">{copied===codePreview?<Check className="h-3.5 w-3.5"/>:<Copy className="h-3.5 w-3.5"/>}Copy</button></div>
        <Button onClick={createLeague} className="mt-4 h-11 w-full gap-2 rounded-xl bg-accent font-semibold text-accent-foreground"><Plus className="h-4 w-4"/>Create League</Button>
      </Card>

      <Card className="p-5"><div className="flex items-center gap-2"><Hash className="h-4 w-4 text-primary"/><div><p className="font-display text-sm font-bold">Join a League</p><p className="text-[10px] text-muted-foreground">Enter the invitation code from the creator.</p></div></div><div className="mt-3 flex gap-2"><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="PS-XXXX-00" className="h-11 flex-1 rounded-xl border border-border bg-secondary/60 px-3.5 font-mono text-sm"/><Button onClick={joinLeague} className="h-11 rounded-xl bg-primary px-5">Join</Button></div></Card>
      {message && <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary">{message}</div>}
      <div><h2 className="mb-3 font-display text-sm font-bold">Your Leagues</h2>{leagues.length===0 ? <Card className="p-5 text-center"><Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground"/><p className="text-xs text-muted-foreground">No leagues yet. Create one or join with an invitation code.</p></Card> : <div className="space-y-3">{leagues.map(l=><Card key={l.id} className="p-4"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><Users className="h-5 w-5"/></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-semibold">{l.name}</p>{l.owner&&<Crown className="h-3.5 w-3.5 text-chart-4"/>}</div><p className="text-[10px] text-muted-foreground">{l.mode} · {l.scope}{l.country?" · "+l.country:""} · {l.members}/{l.maxUsers}</p></div></div><div className="mt-3 flex gap-2"><button type="button" onClick={()=>copy(l.code)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-[10px] font-bold">{copied===l.code?<Check className="h-3.5 w-3.5 text-accent"/>:<Copy className="h-3.5 w-3.5 text-muted-foreground"/>}{l.code}</button><Button onClick={()=>openLeague(l.id)} className="rounded-xl text-xs">Open League</Button></div></Card>)}</div>}</div>
    </div>
  </div>
}
