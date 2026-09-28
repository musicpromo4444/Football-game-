"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Check, Gem, Lock, Palette, Shirt, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, ScreenHeader } from "@/components/game/ui-bits"
import { readWallet, saveWallet } from "@/lib/economy"

const KEY = "pitchside-kit-collection"

type Tier = "normal" | "pro" | "legendary" | "event"
type Kit = { tier: Tier; design: string; colorA: string; colorB: string; name: string; number: string }

const COLORS = [
  { name: "Emerald", value: "#10b981" }, { name: "Black", value: "#08090a" },
  { name: "White", value: "#f5f5f5" }, { name: "Gold", value: "#f5c84b" },
  { name: "Red", value: "#ef4444" }, { name: "Blue", value: "#2563eb" },
  { name: "Cyan", value: "#06b6d4" }, { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" }, { name: "Orange", value: "#f97316" },
]

const PRO_DESIGNS = [
  ["Bold Stripes","linear-gradient(90deg,var(--a) 0 14%,var(--b) 14% 28%,var(--a) 28% 42%,var(--b) 42% 56%,var(--a) 56% 70%,var(--b) 70% 84%,var(--a) 84%)"],
  ["Narrow Stripes","repeating-linear-gradient(90deg,var(--a) 0 9px,var(--b) 9px 16px)"],
  ["Pinstripes","repeating-linear-gradient(90deg,var(--a) 0 24px,var(--b) 24px 27px)"],
  ["Classic Hoops","repeating-linear-gradient(180deg,var(--a) 0 22px,var(--b) 22px 38px)"],
  ["Double Stripes","linear-gradient(90deg,var(--a) 0 32%,var(--b) 32% 40%,var(--a) 40% 48%,var(--b) 48% 56%,var(--a) 56%)"],
  ["Broken Stripes","repeating-linear-gradient(135deg,var(--a) 0 18px,var(--b) 18px 30px,var(--a) 30px 44px)"],
  ["Diagonal Sash","linear-gradient(150deg,transparent 0 32%,var(--b) 32% 48%,transparent 48%),var(--a)"],
  ["Double Sash","linear-gradient(150deg,transparent 0 27%,var(--b) 27% 34%,transparent 34% 42%,var(--b) 42% 49%,transparent 49%),var(--a)"],
  ["Half & Half","linear-gradient(90deg,var(--a) 0 50%,var(--b) 50%)"],
  ["Quartered","linear-gradient(90deg,var(--a) 0 50%,var(--b) 50%),linear-gradient(0deg,var(--b) 0 50%,transparent 50%)"],
  ["Chevron","repeating-linear-gradient(135deg,var(--a) 0 12px,var(--b) 12px 24px)"],
  ["Zig Zag","linear-gradient(135deg,var(--a) 25%,var(--b) 25% 50%,var(--a) 50% 75%,var(--b) 75%)"],
  ["Gradient Fade","linear-gradient(135deg,var(--a),var(--b),var(--a))"],
  ["Shoulder Panels","linear-gradient(160deg,var(--b) 0 16%,transparent 16% 84%,var(--b) 84%),var(--a)"],
  ["Side Panels","linear-gradient(90deg,var(--b) 0 12%,var(--a) 12% 88%,var(--b) 88%)"],
  ["V Panels","linear-gradient(135deg,transparent 0 45%,var(--b) 45% 55%,transparent 55%),var(--a)"],
  ["Lightning","repeating-linear-gradient(155deg,var(--a) 0 18px,var(--b) 18px 27px,var(--a) 27px 48px)"],
  ["Diamond","linear-gradient(45deg,var(--b) 25%,transparent 25% 75%,var(--b) 75%),linear-gradient(45deg,var(--b) 25%,var(--a) 25% 75%,var(--b) 75%),var(--a)"],
  ["Wave","repeating-radial-gradient(ellipse at 0 100%,var(--b) 0 10px,var(--a) 11px 24px)"],
  ["Asymmetric Split","linear-gradient(110deg,var(--a) 0 42%,var(--b) 42% 72%,var(--a) 72%)"],
  ["Cross Band","linear-gradient(0deg,transparent 0 38%,var(--b) 38% 62%,transparent 62%),var(--a)"],
  ["Triple Band","linear-gradient(0deg,transparent 0 18%,var(--b) 18% 27%,transparent 27% 42%,var(--b) 42% 51%,transparent 51% 66%,var(--b) 66% 75%,transparent 75%),var(--a)"],
  ["Tonal Blocks","linear-gradient(135deg,var(--b) 0 25%,var(--a) 25% 50%,var(--b) 50% 75%,var(--a) 75%)"],
  ["Retro Grid","repeating-linear-gradient(90deg,var(--a) 0 20px,var(--b) 20px 24px),repeating-linear-gradient(0deg,transparent 0 20px,var(--b) 20px 24px)"],
  ["Modern Grid","linear-gradient(90deg,transparent 47%,var(--b) 48% 52%,transparent 53%),linear-gradient(0deg,transparent 47%,var(--b) 48% 52%,transparent 53%),var(--a)"],
  ["Angular","linear-gradient(155deg,var(--b) 0 18%,transparent 18% 38%,var(--b) 38% 48%,transparent 48%)"],
  ["Split Chevron","linear-gradient(45deg,var(--b) 0 18%,transparent 18% 35%,var(--b) 35% 48%,transparent 48%),var(--a)"],
  ["Double Tone","linear-gradient(115deg,var(--a) 0 48%,var(--b) 48% 52%,var(--a) 52%)"],
  ["Energy Lines","repeating-linear-gradient(155deg,var(--a) 0 26px,var(--b) 26px 30px)"],
  ["Shadow Stripes","repeating-linear-gradient(90deg,var(--a) 0 32px,var(--b) 32px 34px)"],
] as const

const EVENTS = [
  ["Zebra","repeating-linear-gradient(125deg,#111 0 12px,#f4f4f4 12px 23px)"],
  ["Cheetah","radial-gradient(circle at 30% 30%,#111 0 5px,transparent 6px),radial-gradient(circle at 70% 70%,#111 0 4px,transparent 5px),#d6a83b"],
  ["Leopard","radial-gradient(circle at 30% 30%,#111 0 5px,transparent 6px),radial-gradient(circle at 70% 70%,#111 0 4px,transparent 5px),#c45be7"],
  ["Lion","linear-gradient(145deg,#08090a,#b78a21,#08090a)"],
  ["Dragon","repeating-linear-gradient(145deg,#050b14 0 18px,#0ea5e9 18px 24px,#07111c 24px 42px)"],
  ["Wolf","linear-gradient(145deg,#111827,#9ca3af,#111827)"],
  ["Fire","linear-gradient(145deg,#171717,#f97316,#dc2626,#171717)"],
  ["Galaxy","radial-gradient(circle at 35% 35%,#7c3aed,transparent 32%),linear-gradient(145deg,#05030d,#172554,#0f172a)"],
  ["Custom Draw","repeating-linear-gradient(35deg,#111 0 3px,#10b981 3px 7px,#111 7px 12px)"],
] as const

function loadCollection(): Kit[] {
  if (typeof window === "undefined") return [{ tier:"normal",design:"Solid",colorA:"#10b981",colorB:"#08090a",name:"",number:"10" }]
  try { const x=JSON.parse(localStorage.getItem(KEY)||"[]"); return Array.isArray(x)&&x.length?x:[{tier:"normal",design:"Solid",colorA:"#10b981",colorB:"#08090a",name:"",number:"10"}] } catch { return [{tier:"normal",design:"Solid",colorA:"#10b981",colorB:"#08090a",name:"",number:"10"}] }
}
function saveCollection(x:Kit[]){ localStorage.setItem(KEY,JSON.stringify(x)) }

export function KitEditor({ onClose }: { onClose:()=>void }) {
  const [tier,setTier]=useState<Tier>("normal")
  const [design,setDesign]=useState("Solid")
  const [a,setA]=useState("#10b981")
  const [b,setB]=useState("#08090a")
  const [name,setName]=useState("")
  const [number,setNumber]=useState("10")
  const [owned,setOwned]=useState<Kit[]>(loadCollection)
  const [message,setMessage]=useState("")
  const [drawColor,setDrawColor]=useState("#10b981")
  const [drawing,setDrawing]=useState(false)
  const canvasRef=useRef<HTMLCanvasElement|null>(null)
  const wallet=readWallet()
  const ownedTier=owned.some(k=>k.tier===tier)
  useEffect(()=>{if(tier!=="event"||design!=="Custom Draw")return;const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");if(!ctx)return;ctx.fillStyle="#111416";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle="#2dd4bf";ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.strokeRect(8,8,canvas.width-16,canvas.height-16);ctx.setLineDash([])},[tier,design])
  const drawAt=(e:React.PointerEvent<HTMLCanvasElement>)=>{const canvas=canvasRef.current;if(!canvas||!drawing)return;const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)*canvas.width/rect.width;const y=(e.clientY-rect.top)*canvas.height/rect.height;const ctx=canvas.getContext("2d");if(!ctx)return;ctx.fillStyle=drawColor;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill()}

  const currentBackground=useMemo(()=>{
    if(tier==="normal") return a
    if(tier==="event") return EVENTS.find(x=>x[0]===design)?.[1] || a
    if(tier==="legendary"){
      if(design==="Gold White") return "radial-gradient(circle at 70% 35%,#fff7b0 0 8%,transparent 9%),linear-gradient(145deg,#fff,#f5c84b,#fff,#d9a900)"
      if(design==="Gold Black") return "linear-gradient(145deg,#050505 0 28%,#f5c84b 29% 40%,#050505 41% 68%,#fff0a0 69% 74%,#050505 75%)"
      return "radial-gradient(circle at 78% 28%,#22d3ee 0 3%,transparent 4%),radial-gradient(circle at 22% 70%,#c026d3 0 4%,transparent 5%),linear-gradient(145deg,#d9a900,#fff2a6,#f5c84b,#064e3b,#7c3aed,#f5c84b)"
    }
    return PRO_DESIGNS.find(x=>x[0]===design)?.[1].replaceAll("var(--a)",a).replaceAll("var(--b)",b) || a
  },[tier,design,a,b])

  const buyPro=()=>{
    const w=readWallet(); if(w.gems<60){setMessage("Not enough Gems.");return}
    const next={...w,gems:w.gems-60};saveWallet(next);setOwned(x=>{const n=x.some(k=>k.tier==="pro")?x:[...x,{tier:"pro",design:"Bold Stripes",colorA:"#111",colorB:"#fff",name:"",number:"10"}];saveCollection(n);return n});setMessage("Pro Kit unlocked for 60 Gems.")
  }
  const buyPremiumKit=(kitTier:"legendary"|"event")=>{ if(owned.some(k=>k.tier===kitTier)){setMessage("Kit already owned.");return} setMessage(kitTier==="legendary" ? "Legendary Kit purchase opens when premium billing is connected." : "Special Event Kit purchase opens when event billing is connected.") }
  const saveKit=()=>{
    if(!ownedTier){setMessage("Buy this kit tier first.");return}
    const kit={tier,design,colorA:a,colorB:b,name:tier==="event"?"":name,number}
    const next=[...owned.filter(k=>k.tier!==tier),kit];saveCollection(next);setOwned(next);setMessage("Kit saved and equipped.")
  }

  return <div className="min-h-full bg-[#070909] px-3 pb-8 pt-3 text-white">
    <div className="mb-2 flex items-center gap-2"><Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="h-5 w-5"/></Button><div className="flex-1"><ScreenHeader title="Kit Editor" subtitle="One place for every owned kit"/></div></div>
    {message&&<div className="mb-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-2 text-center text-[10px] font-black text-emerald-300">{message}</div>}
    <div className="grid grid-cols-4 gap-1.5">
      {([["normal","Normal"],["pro","Pro"],["legendary","Legendary"],["event","Special Event"]] as const).map(([id,label])=><button key={id} onClick={()=>setTier(id)} className={"rounded-xl border px-2 py-2 text-[9px] font-black "+(tier===id?"border-emerald-300 bg-emerald-400/15 text-emerald-200":"border-white/10 bg-[#111416] text-muted-foreground")}>{label}</button>)}
    </div>
    <Card className="mt-3 overflow-hidden border-white/10 bg-[#111416] p-3">
      <div className="mb-2 flex items-center justify-between"><div><p className="text-[9px] uppercase tracking-widest text-emerald-300">Live Preview</p><p className="font-display text-lg font-black">{tier==="event"?"Event Kit":tier==="legendary"?"Legendary Kit":tier==="pro"?"Pro Kit":"Normal Kit"}</p></div><Shirt className="h-5 w-5 text-emerald-300"/></div>
      <div className="mx-auto flex h-64 w-52 items-center justify-center rounded-3xl bg-black/25">
        <div className="relative h-52 w-40 overflow-hidden rounded-[28px_28px_18px_18px] border-4 border-white/15 shadow-2xl" style={{background:currentBackground}}>
          <div className="absolute left-1/2 top-0 h-16 w-12 -translate-x-1/2 rounded-b-3xl border-b-4 border-white/15 bg-black/20"/>
          <div className="absolute left-2 top-10 h-28 w-5 rotate-12 rounded-full bg-black/20"/>
          <div className="absolute right-2 top-10 h-28 w-5 -rotate-12 rounded-full bg-black/20"/>
          <div className="absolute left-1/2 top-24 -translate-x-1/2 text-center text-white drop-shadow-lg"><p className="text-[10px] font-black">{tier==="event"?"":name||"YOUR NAME"}</p><p className="font-display text-5xl font-black">{number||"10"}</p></div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-black tracking-widest text-white/80">PITCHSIDE</div>
        </div>
      </div>
      {tier==="pro"&&<p className="mt-2 text-center text-[8px] text-muted-foreground">30 original professional templates · change both colors</p>}
      {tier==="legendary"&&<p className="mt-2 text-center text-[8px] text-muted-foreground">3 gold designs · name + number on the back</p>}
      {tier==="event"&&<p className="mt-2 text-center text-[8px] text-muted-foreground">Limited designs · number only · no player name</p>}
    </Card>

    {tier==="normal"&&<Card className="mt-3 border-white/10 bg-[#111416] p-3"><p className="mb-2 text-[10px] font-black uppercase tracking-widest">Choose Colors</p><div className="grid grid-cols-5 gap-2">{COLORS.map(c=><button key={c.name} onClick={()=>setA(c.value)} className={"h-9 rounded-lg border-2 "+(a===c.value?"border-white":"border-white/10")} style={{background:c.value}} aria-label={c.name}/>)}</div><p className="mt-2 text-[8px] text-muted-foreground">Normal Kits use colors only. No patterns.</p></Card>}

    {tier==="pro"&&<Card className="mt-3 border-white/10 bg-[#111416] p-3"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-widest">30 Pro Designs</p>{ownedTier?<span className="text-[8px] font-black text-emerald-300"><Check className="mr-1 inline h-3 w-3"/>OWNED</span>:<Button size="sm" onClick={buyPro} className="rounded-lg text-[9px]"><Gem className="mr-1 h-3 w-3"/>60 Gems</Button>}</div><div className="grid grid-cols-3 gap-2">{PRO_DESIGNS.map(([d])=><button key={d} disabled={!ownedTier} onClick={()=>setDesign(d)} className={"rounded-xl border p-1.5 "+(design===d?"border-emerald-300 bg-emerald-400/10":"border-white/10 bg-black/20")+" "+(!ownedTier?"opacity-50":"")}><div className="h-12 rounded-lg" style={{background:PRO_DESIGNS.find(x=>x[0]===d)?.[1].replaceAll("var(--a)",a).replaceAll("var(--b)",b)}}/><p className="mt-1 truncate text-[7px] font-black">{d}</p></button>)}</div><div className="mt-3 flex gap-2">{[a,b].map((v,i)=><div key={i} className="flex-1"><p className="mb-1 text-[7px] text-muted-foreground">COLOR {i+1}</p><div className="grid grid-cols-5 gap-1">{COLORS.map(c=><button key={c.name} onClick={()=>i===0?setA(c.value):setB(c.value)} className={"h-6 rounded border "+((i===0?a:b)===c.value?"border-white":"border-white/10")} style={{background:c.value}}/></div></div>)}</div></Card>}

    {tier==="legendary"&&<Card className="mt-3 border-amber-300/20 bg-[#111416] p-3"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-widest text-amber-300">3 Legendary Designs</p>{ownedTier?<span className="text-[8px] font-black text-emerald-300"><Check className="mr-1 inline h-3 w-3"/>OWNED</span>:<Button size="sm" onClick={()=>buyPremiumKit("legendary")} className="rounded-lg text-[9px]">GET LEGENDARY</Button>}</div><div className="grid grid-cols-3 gap-2">{["Gold White","Gold Black","Gold Gradient"].map(d=><button key={d} disabled={!ownedTier} onClick={()=>setDesign(d)} className={"rounded-xl border p-2 "+(design===d?"border-amber-300 bg-amber-400/10":"border-white/10")+" "+(!ownedTier?"opacity-50":"")}><div className="h-16 rounded-lg" style={{background:d==="Gold White"?"radial-gradient(circle at 70% 35%,#fff7b0 0 8%,transparent 9%),linear-gradient(145deg,#fff,#f5c84b,#fff,#d9a900)":d==="Gold Black"?"linear-gradient(145deg,#050505 0 28%,#f5c84b 29% 40%,#050505 41% 68%,#fff0a0 69% 74%,#050505 75%)":"radial-gradient(circle at 78% 28%,#22d3ee 0 3%,transparent 4%),radial-gradient(circle at 22% 70%,#c026d3 0 4%,transparent 5%),linear-gradient(145deg,#d9a900,#fff2a6,#f5c84b,#064e3b,#7c3aed,#f5c84b)"}}/><p className="mt-1 text-[7px] font-black">{d}</p></button>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Player name" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] outline-none"/><input value={number} onChange={e=>setNumber(e.target.value.slice(0,2))} placeholder="Number" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] outline-none"/></div><p className="mt-2 text-[8px] text-muted-foreground">Legendary includes Gold/White, Gold/Black and Gold Gradient. Name + number appear on the back.</p></Card>}

    {tier==="event"&&<Card className="mt-3 border-cyan-300/20 bg-[#111416] p-3"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Special Event Designs</p>{ownedTier?<span className="text-[8px] font-black text-emerald-300"><Check className="mr-1 inline h-3 w-3"/>OWNED</span>:<Button size="sm" onClick={()=>buyPremiumKit("event")} className="rounded-lg text-[9px]"><Lock className="mr-1 h-3 w-3"/>GET EVENT KIT</Button>}</div><div className="grid grid-cols-3 gap-2">{EVENTS.map(([d,bg])=><button key={d} disabled={!ownedTier} onClick={()=>setDesign(d)} className={"rounded-xl border p-1.5 "+(design===d?"border-cyan-300 bg-cyan-400/10":"border-white/10 bg-black/20")+" "+(!ownedTier?"opacity-50":"")}><div className="h-12 rounded-lg" style={{background:bg}}/><p className="mt-1 truncate text-[7px] font-black">{d}</p></button>)}</div><div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2"><Palette className="h-4 w-4 text-cyan-300"/><p className="text-[8px] text-muted-foreground">Special Event Kits use numbers only. Custom Draw lets you create your own event artwork.</p></div>{design==="Custom Draw"&&<div className="mt-3"><div className="mb-2 flex items-center gap-2">{COLORS.slice(0,8).map(c=><button key={c.name} onClick={()=>setDrawColor(c.value)} className={"h-6 w-6 rounded-full border-2 "+(drawColor===c.value?"border-white":"border-white/10")} style={{background:c.value}}/> )}</div><canvas ref={canvasRef} width={240} height={300} onPointerDown={e=>{setDrawing(true);drawAt(e)}} onPointerMove={drawAt} onPointerUp={()=>setDrawing(false)} onPointerLeave={()=>setDrawing(false)} className="mx-auto h-64 w-52 touch-none rounded-2xl border border-cyan-300/20 bg-[#111416]"/></div>}</Card>}

    <Button onClick={saveKit} disabled={!ownedTier} className="mt-3 w-full rounded-2xl py-6 font-black"><Sparkles className="mr-2 h-4 w-4"/>SAVE & EQUIP KIT</Button>
  </div>
}
