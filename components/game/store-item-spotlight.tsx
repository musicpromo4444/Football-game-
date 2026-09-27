"use client"

import { useEffect, useState } from "react"
import { X, ShoppingBag, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const KEY="pitchside-item-promo-last"
const ITEMS=[
 {title:"LEGENDARY KITS",sub:"Luxury gold designs. Customize your colors.",tag:"NEW",price:"Premium",kind:"kit"},
 {title:"SPECIAL EVENT KITS",sub:"Zebra • Cheetah • Dragon • Lion • Galaxy",tag:"LIMITED",price:"Limited",kind:"kit"},
 {title:"PRO KIT COLLECTION",sub:"30 professional patterns. Pick your colors.",tag:"60 GEMS",price:"60 Gems",kind:"kit"},
 {title:"MATCH BOOSTS",sub:"Power up your next match with special boosts.",tag:"STORE",price:"From 20 Gems",kind:"item"},
 {title:"PLAYER PACKS",sub:"Open a pack and strengthen your squad.",tag:"STORE",price:"Available now",kind:"pack"},
]

export function StoreItemSpotlight({reason="daily",onOpenKitEditor}:{reason?: "daily"|"match",onOpenKitEditor?:()=>void}){
 const [open,setOpen]=useState(false); const [item,setItem]=useState(ITEMS[0])
 useEffect(()=>{
  const day=new Date().toISOString().slice(0,10)
  const last=localStorage.getItem(KEY)
  if(reason==="daily" && last===day)return
  if(reason==="daily")localStorage.setItem(KEY,day)
  setItem(ITEMS[Math.floor(Math.random()*ITEMS.length)]);setOpen(true)
 },[reason])
 if(!open)return null
 return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
  <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-primary/35 bg-gradient-to-b from-[#101b19] via-[#0c1213] to-[#080a0b] shadow-2xl">
   <button onClick={()=>setOpen(false)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white/70"><X className="h-5 w-5"/></button>
   <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/20 blur-3xl"/>
   <div className="px-5 pb-5 pt-6 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10"><ShoppingBag className="h-6 w-6 text-primary"/></div>
    <p className="mt-3 text-[9px] font-black uppercase tracking-[0.25em] text-primary">{reason==="match"?"MATCH COMPLETE":"TODAY'S FEATURE"}</p>
    <h2 className="mt-1 font-display text-2xl font-black">{item.title}</h2>
    <p className="mx-auto mt-2 max-w-xs text-xs text-muted-foreground">{item.sub}</p>
    <div className="mx-auto mt-5 flex max-w-[280px] items-end justify-center gap-2">{["#10b981","#f5c84b","#06b6d4","#8b5cf6","#ef4444","#f5f5f5"].map((c,i)=><div key={i} className="flex h-20 w-10 items-end justify-center rounded-xl border border-white/10 bg-black/25 p-1"><div className="h-14 w-7 rounded-md border border-white/20" style={{background:c}}/></div>)}</div>
    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black"><Sparkles className="h-3 w-3 text-amber-300"/>{item.tag}</div>
    <p className="mt-2 text-[10px] text-muted-foreground">{item.price}</p>
    <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={()=>setOpen(false)} className="rounded-xl">IGNORE</Button><Button onClick={()=>{setOpen(false);if(item.kind==="kit")onOpenKitEditor?.()}} className="rounded-xl">{item.kind==="kit"?"VIEW KITS":"VIEW STORE"}</Button></div>
   </div>
  </div>
 </div>
}