"use client"

import { useEffect, useState } from "react"
import { Plus, Save, Trash2, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Pill } from "@/components/game/ui-bits"
import { supabase } from "@/lib/supabase"

type Prize = { id:string; place:string; rewardType:string; itemId:string; quantity:number; customValue:string; enabled:boolean }
type Item = { id:string; item_type:string; name:string; rarity:string; description:string; image_url:string }

const prizeTypes = ["Bux","Gems","Special Player","Player Pack","Mystery Box","Kit/Jersey","Custom Kit","Cosmetic","Badge","Boost"]
const places = ["1st Place","2nd Place","3rd Place","Semifinalist","Participation"]

export function AdminTournaments({ adminToken = "" }: { adminToken?: string }) {
  const [items,setItems]=useState<Item[]>([])
  const [prizes,setPrizes]=useState<Prize[]>([])
  const [saved,setSaved]=useState(false)
  const [t,setT]=useState({name:"",description:"",type:"Knockout Cup",start:"",end:"",entryType:"Free",entryAmount:0,maxPlayers:16,games:5,wins:3,drawAllowed:true,lossEliminates:true})
  const addPrize=()=>setPrizes(p=>[...p,{id:crypto.randomUUID(),place:"1st Place",rewardType:"Bux",itemId:"",quantity:1000,customValue:"",enabled:true}])
  useEffect(()=>{(async()=>{const {data}=await supabase.from("pitchside_game_items").select("id,item_type,name,rarity,description,image_url").eq("enabled",true).order("name");if(data)setItems(data)})()},[])
  const save=async()=>{ 
  if (!adminToken) { setSaved(false); return }
  const res=await fetch("/api/admin/tournaments",{method:"POST",headers:{"Content-Type":"application/json","x-pitchside-admin-token":adminToken},body:JSON.stringify({tournament:t,prizes})})
  const data=await res.json()
  if (!res.ok) { window.alert(data.error || "Could not publish tournament"); return }
  localStorage.setItem("pitchside-tournament-draft",JSON.stringify({t,prizes,tournamentId:data.tournamentId}))
  setSaved(true);setTimeout(()=>setSaved(false),1500)
}
  return <div className="space-y-3">
    <Card glow="cyan" className="p-4">
      <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Tournament Builder</p><p className="font-bold">Create a featured tournament</p></div></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-[10px] font-bold text-muted-foreground">Name<input value={t.name} onChange={e=>setT({...t,name:e.target.value})} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"/></label>
        <label className="text-[10px] font-bold text-muted-foreground">Type<select value={t.type} onChange={e=>setT({...t,type:e.target.value})} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs">{["Knockout Cup","Win Streak","Endurance","Perfect Run","Goal Rush","Clean Sheet Challenge","Champions Cup","Survival"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="text-[10px] font-bold text-muted-foreground">Starts<input type="datetime-local" value={t.start} onChange={e=>setT({...t,start:e.target.value})} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"/></label>
        <label className="text-[10px] font-bold text-muted-foreground">Ends<input type="datetime-local" value={t.end} onChange={e=>setT({...t,end:e.target.value})} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"/></label>
        <label className="text-[10px] font-bold text-muted-foreground">Entry<select value={t.entryType} onChange={e=>setT({...t,entryType:e.target.value})} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"><option>Free</option><option>Bux</option><option>Gems</option></select></label>
        <label className="text-[10px] font-bold text-muted-foreground">Entry amount<input type="number" min={0} value={t.entryAmount} onChange={e=>setT({...t,entryAmount:Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"/></label>
        <label className="text-[10px] font-bold text-muted-foreground">Max players<input type="number" min={2} value={t.maxPlayers} onChange={e=>setT({...t,maxPlayers:Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"/></label>
        <label className="text-[10px] font-bold text-muted-foreground">Required games<input type="number" min={1} value={t.games} onChange={e=>setT({...t,games:Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"/></label>
        <label className="text-[10px] font-bold text-muted-foreground">Required wins<input type="number" min={1} value={t.wins} onChange={e=>setT({...t,wins:Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"/></label>
      </div>
      <textarea value={t.description} onChange={e=>setT({...t,description:e.target.value})} placeholder="Tournament rules / write-up" className="mt-2 min-h-16 w-full rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"/>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-bold"><label><input type="checkbox" checked={t.drawAllowed} onChange={e=>setT({...t,drawAllowed:e.target.checked})}/> Draw allowed</label><label><input type="checkbox" checked={t.lossEliminates} onChange={e=>setT({...t,lossEliminates:e.target.checked})}/> Loss eliminates</label></div>
    </Card>
    <Card className="p-4">
      <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Winner Prize Builder</p><p className="font-bold">Check any prizes you want to combine</p></div><Button size="sm" variant="outline" onClick={addPrize}><Plus className="mr-1 h-4 w-4"/>Add prize</Button></div>
      <div className="mt-3 space-y-2">
      {prizes.map(p=><div key={p.id} className="rounded-xl border border-border bg-secondary/20 p-3">
        <div className="flex items-center gap-2"><input type="checkbox" checked={p.enabled} onChange={e=>setPrizes(x=>x.map(q=>q.id===p.id?{...q,enabled:e.target.checked}:q))}/><select value={p.place} onChange={e=>setPrizes(x=>x.map(q=>q.id===p.id?{...q,place:e.target.value}:q))} className="flex-1 rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs">{places.map(x=><option key={x}>{x}</option>)}</select><button onClick={()=>setPrizes(x=>x.filter(q=>q.id!==p.id))}><Trash2 className="h-4 w-4"/></button></div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select value={p.rewardType} onChange={e=>setPrizes(x=>x.map(q=>q.id===p.id?{...q,rewardType:e.target.value,itemId:""}:q))} className="rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs">{prizeTypes.map(x=><option key={x}>{x}</option>)}</select>
          {["Bux","Gems","Mystery Box","Player Pack"].includes(p.rewardType) ? <input type="number" min={0} value={p.quantity} onChange={e=>setPrizes(x=>x.map(q=>q.id===p.id?{...q,quantity:Number(e.target.value)}:q))} className="rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs" placeholder="Amount"/> :
          <select value={p.itemId} onChange={e=>setPrizes(x=>x.map(q=>q.id===p.id?{...q,itemId:e.target.value}:q))} className="rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs"><option value="">Choose from Game Item Library</option>{items.map(i=><option key={i.id} value={i.id}>{i.name} · {i.rarity}</option>)}</select>}
        </div>
      </div>)}
      {!prizes.length&&<p className="rounded-xl bg-secondary/30 p-3 text-xs text-muted-foreground">No prize selected. This tournament can award nothing.</p>}
      </div>
      <Button onClick={save} className="mt-3 w-full rounded-xl"><Save className="mr-1 h-4 w-4"/>{saved?"Published":"Publish tournament"}</Button>
    </Card>
    <Card className="p-4"><p className="text-xs font-black">Game Item Library</p><p className="mt-1 text-[10px] text-muted-foreground">Every kit, custom kit, cosmetic, player, pack, box, badge and future item can be registered here and selected as a prize.</p><div className="mt-2 flex flex-wrap gap-1">{items.map(i=><Pill key={i.id}>{i.name}</Pill>)}</div></Card>
  </div>
}
