"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Trophy, Users, Swords, Medal, Shield, UserPlus, Play, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, ScreenHeader } from "@/components/game/ui-bits"
import { PrivateLeagues } from "@/components/game/screens/private-leagues"
import { supabase } from "@/lib/supabase"

type Page = "home" | "tournaments" | "league" | "friends"

const tournaments = [
  { id: "t1", name: "Neon Cup", format: "Knockout", entry: "Free", prize: "10,000 Bux", status: "Open", players: "8/16" },
  { id: "t2", name: "World Rivals", format: "Group → Knockout", entry: "Free", prize: "25 Gems + Elite Kit", status: "Starts in 2h", players: "32/64" },
  { id: "t3", name: "Weekend Champions", format: "Knockout", entry: "10 Gems", prize: "50 Gems + Special Player", status: "Open", players: "47/64" },
]

const friends = [
  { name: "Jay United", club: "JAY", online: true },
  { name: "Musa FC", club: "MFC", online: true },
  { name: "Kenny Rovers", club: "KRV", online: false },
]

function Back({ onBack }: { onBack: () => void }) {
  return <button type="button" onClick={onBack} className="mb-3 flex items-center gap-2 text-xs font-bold text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Cancel</button>
}

export function CompetitionHub() {
  const [page, setPage] = useState<Page>("home")
  const [friendCode, setFriendCode] = useState("")
  const [notice, setNotice] = useState("")
  const [presence, setPresence] = useState<Record<string, string>>({})
  const [invite, setInvite] = useState<any>(null)
  const [friendRows, setFriendRows] = useState<any[]>([])

  useEffect(() => {
    let channel: any
    let inviteChannel: any
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user || cancelled) return
      const { data: rows } = await supabase.from("pitchside_friendships").select("friend_id,status").eq("user_id", data.user.id).eq("status","accepted")
      if (rows?.length) {
        const ids = rows.map((r:any)=>r.friend_id)
        const { data: profiles } = await supabase.from("players").select("user_id,display_name").in("user_id", ids)
        setFriendRows(rows.map((r:any)=>({ ...r, name: profiles?.find((p:any)=>p.user_id===r.friend_id)?.display_name || "Panda Manager", club: "PFC" })))
      }
      channel = supabase.channel("pitchside-friends-presence")
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState(); const next: Record<string,string> = {}
          Object.entries(state).forEach(([key,value]:any)=>{ next[key]=value?.[0]?.status || "online" }); setPresence(next)
        })
        .subscribe(async (status:string)=>{ if(status==="SUBSCRIBED") await channel.track({status:"online"}) })
      inviteChannel = supabase.channel(`pitchside-friend-invite:${data.user.id}`)
        .on("broadcast",{event:"friend-invite"},({payload}:any)=>setInvite(payload)).subscribe()
    })()
    return () => { cancelled=true; if(channel) supabase.removeChannel(channel); if(inviteChannel) supabase.removeChannel(inviteChannel) }
  }, [])

  if (page === "league") return <div className="pb-4"><div className="px-5 pt-3"><Back onBack={() => setPage("home")} /></div><PrivateLeagues onBack={() => setPage("home")} /></div>

  if (page === "tournaments") {
    return (
      <div className="pb-6">
        <div className="px-5 pt-3"><Back onBack={() => setPage("home")} /></div>
        <ScreenHeader title="Tournaments" subtitle="Compete through rounds and chase the final" />
        <div className="space-y-3 px-5">
          {tournaments.map((t) => (
            <Card key={t.id} className="overflow-hidden p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Trophy className="h-6 w-6" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-black">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.format} · {t.players}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
                    <div className="rounded-lg bg-secondary p-2"><span className="text-muted-foreground">Prize</span><br/><b>{t.prize}</b></div>
                    <div className="rounded-lg bg-secondary p-2"><span className="text-muted-foreground">Entry</span><br/><b>{t.entry}</b></div>
                  </div>
                </div>
              </div>
              <Button className="mt-3 h-10 w-full rounded-xl" onClick={() => { window.localStorage.setItem("pitchside-tournament", t.id); window.dispatchEvent(new Event("pitchside-start-tournament")) }}>
                <Play className="mr-2 h-4 w-4" /> {t.status === "Open" ? "Enter Tournament" : t.status}
              </Button>
            </Card>
          ))}
          <Card className="border-primary/20 p-4">
            <div className="flex items-center gap-2"><Medal className="h-4 w-4 text-primary" /><p className="text-xs font-black">Tournament path</p></div>
            <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[8px]">
              {["Round of 16","Quarter","Semi","FINAL"].map((x,i)=><div key={x} className={`rounded-lg bg-secondary p-2 ${i===3 ? "text-primary" : ""}`}>{x}</div>)}
            </div>
            <p className="mt-3 text-[9px] text-muted-foreground">Win to advance. Lose and your run ends. Draws go to the tournament tiebreak rules.</p>
          </Card>
        </div>
      </div>
    )
  }

  if (page === "friends") {
    return (
      <div className="pb-6">
        <div className="px-5 pt-3"><Back onBack={() => setPage("home")} /></div>
        <ScreenHeader title="Friends" subtitle="Challenge friends and build your football circle" />
        <div className="space-y-3 px-5">
          {invite && <Card className="border-primary/30 p-4"><p className="text-xs font-black">{invite.from} challenged you</p><div className="mt-3 flex gap-2"><Button className="flex-1" onClick={()=>{(async()=>{const {readWallet,saveWallet}=await import("@/lib/economy");const w=readWallet();if(w.bucks<100){setNotice("You need 100 Bux to accept this match.");return}saveWallet({...w,bucks:w.bucks-100});await supabase.from("pitchside_friend_matches").update({status:"accepted",stake_status:"escrowed"}).eq("id",invite.matchId);window.localStorage.setItem("pitchside-friend-challenge",invite.from);window.dispatchEvent(new CustomEvent("pitchside-start-friend-match",{detail:{matchId:invite.matchId}}));setInvite(null)})()}}>Accept</Button><Button variant="outline" onClick={async()=>{if(invite?.matchId) await supabase.from("pitchside_friend_matches").update({status:"declined",stake_status:"refunded"}).eq("id",invite.matchId);setInvite(null)}}>Decline</Button></div></Card>}<Card className="p-4"><input value={friendCode} onChange={e=>setFriendCode(e.target.value)} placeholder="Friend code or manager name" className="h-10 flex-1 rounded-xl border border-border bg-secondary px-3 text-xs outline-none" /><Button onClick={async()=>{ if(!friendCode.trim()) return; if(supabase){const {data:u}=await supabase.auth.getUser(); if(u.user){const {data}=await supabase.from("pitchside_friendships").select("id").eq("friend_code",friendCode.trim()).maybeSingle(); setNotice(data?"Friend found.":"Friend code not found.")}} else setNotice("Enter a friend code.")}} className="h-10 rounded-xl"><UserPlus className="mr-1 h-4 w-4"/> Add</Button></div></Card>
          {(friendRows.length ? friendRows.map((r:any)=>({name:r.name,club:r.club,friendId:r.friend_id})) : friends.map(f=>({name:f.name,club:f.club,friendId:"",online:f.online}))).map((f:any,i:number) => { const status=f.friendId ? (presence[f.friendId] || "offline") : (f.online ? "online" : "offline"); const available=status==="online"; return <Card key={f.name+i} className="flex items-center gap-3 p-4"><span className={`h-3 w-3 rounded-full ${available ? "bg-emerald-400" : status==="in-match" ? "bg-amber-400" : "bg-muted-foreground"}`}/><div className="flex-1"><p className="text-sm font-bold">{f.name}</p><p className="text-[9px] text-muted-foreground">{f.club} · {available ? "Online" : status==="in-match" ? "In Match" : "Offline"}</p></div><Button disabled={!available || !f.friendId} onClick={async()=>{const {data:u}=await supabase.auth.getUser();if(!u.user||!f.friendId)return;const { readWallet, saveWallet } = await import("@/lib/economy"); const currentWallet=readWallet(); if(currentWallet.bucks<100){setNotice("You need 100 Bux to challenge a friend.");return} saveWallet({...currentWallet,bucks:currentWallet.bucks-100}); const {data:match,error}=await supabase.from("pitchside_friend_matches").insert({challenger_id:u.user.id,opponent_id:f.friendId,status:"pending",stake_bux:100,winner_payout_bux:180,house_fee_bux:20,stake_status:"escrowed"}).select("id").single(); if(error||!match){saveWallet({...currentWallet,bucks:currentWallet.bucks});setNotice("Could not send the match invite.");return} const ch=supabase.channel(`pitchside-friend-invite:${f.friendId}`);await ch.subscribe();await ch.send({type:"broadcast",event:"friend-invite",payload:{from:u.user.id,matchType:"friend",matchId:match?.id,stakeBux:100,winnerPayoutBux:180}});await supabase.removeChannel(ch);setNotice(`100 Bux staked. Invite sent to ${f.name}.`)}} variant="outline" className="h-9 rounded-xl text-[10px]"><Swords className="mr-1 h-3.5 w-3.5"/>{available ? "Challenge" : status==="in-match" ? "In Match" : "Offline"}</Button></Card>})}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-6">
      <ScreenHeader title="Football Hub" subtitle="Tournaments, leagues and friends" />
      <div className="space-y-3 px-5">
        <button type="button" onClick={() => setPage("tournaments")} className="w-full text-left"><Card glow="emerald" className="p-5"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Trophy className="h-7 w-7"/></span><div className="flex-1"><p className="font-display text-lg font-black">Tournaments</p><p className="text-xs text-muted-foreground">Enter cups, survive rounds and play for prizes.</p></div><span className="text-primary">›</span></div></Card></button>
        <button type="button" onClick={() => setPage("league")} className="w-full text-left"><Card className="p-5"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Shield className="h-7 w-7"/></span><div className="flex-1"><p className="font-display text-lg font-black">League</p><p className="text-xs text-muted-foreground">Create private leagues or join friends with a code.</p></div><span className="text-primary">›</span></div></Card></button>
        <button type="button" onClick={() => setPage("friends")} className="w-full text-left"><Card className="p-5"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Users className="h-7 w-7"/></span><div className="flex-1"><p className="font-display text-lg font-black">Friends</p><p className="text-xs text-muted-foreground">Add friends, see who's online and challenge them.</p></div><span className="text-primary">›</span></div></Card></button>
      </div>
    </div>
  )
}
