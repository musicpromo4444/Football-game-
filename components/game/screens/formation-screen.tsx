"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, ChevronDown, CircleDot, Crosshair, Flag, Shield, Trophy, Users } from "lucide-react"
import { squad } from "@/components/game/data"
import { KitEditor } from "@/components/game/screens/kit-editor"

type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "4-1-4-1"
type SetPiece = "Free Kick" | "Penalty" | "Corner"

const layouts: Record<Formation, Array<[string, number, number]>> = {
  "4-3-3": [["GK",50,90],["LB",18,70],["CB",38,73],["CB",62,73],["RB",82,70],["CM",30,52],["CM",50,58],["CM",70,52],["LW",18,28],["ST",50,20],["RW",82,28]],
  "4-4-2": [["GK",50,90],["LB",18,70],["CB",38,73],["CB",62,73],["RB",82,70],["LM",18,52],["CM",38,52],["CM",62,52],["RM",82,52],["ST",38,24],["ST",62,24]],
  "3-5-2": [["GK",50,90],["CB",28,72],["CB",50,76],["CB",72,72],["LWB",12,52],["CM",30,55],["CM",50,48],["CM",70,55],["RWB",88,52],["ST",38,23],["ST",62,23]],
  "4-2-3-1": [["GK",50,90],["LB",18,70],["CB",38,73],["CB",62,73],["RB",82,70],["CDM",35,58],["CDM",65,58],["LAM",22,38],["CAM",50,35],["RAM",78,38],["ST",50,18]],
  "4-1-4-1": [["GK",50,90],["LB",18,70],["CB",38,73],["CB",62,73],["RB",82,70],["CDM",50,60],["LM",15,42],["CM",38,44],["CM",62,44],["RM",85,42],["ST",50,20]],
}

const starters = squad.slice(0, 11)
const roleFor = (slot: string, i: number) => {
  if (slot === "GK") return starters.find(p => p.pos === "GK") || starters[i]
  if (["ST","LW","RW","LAM","RAM"].includes(slot)) return starters.find(p => p.pos === "FWD") || starters[i]
  if (["CM","CDM","CAM","LM","RM","LWB","RWB"].includes(slot)) return starters.find(p => p.pos === "MID") || starters[i]
  return starters.find(p => p.pos === "DEF") || starters[i]
}

export function FormationScreen({ onClose, onTraining }: { onClose: () => void; onTraining?: () => void }) {
  const [formation, setFormation] = useState<Formation>(() => { try { return (localStorage.getItem("pitchside-formation") as Formation) || "4-3-3" } catch { return "4-3-3" } })
  const [piece, setPiece] = useState<SetPiece>("Free Kick")
  const [kitsOpen, setKitsOpen] = useState(false)
  const [takers, setTakers] = useState<Record<SetPiece,string>>(() => { try { return JSON.parse(localStorage.getItem("pitchside-set-piece-takers") || "null") || {
    "Free Kick": starters[4]?.id || "p5",
    "Penalty": starters[5]?.id || "p6",
    "Corner": starters[3]?.id || "p4",
  } } catch { return { "Free Kick": starters[4]?.id || "p5", "Penalty": starters[5]?.id || "p6", "Corner": starters[3]?.id || "p4" } } })
  const bench = squad.slice(11, 18)

  const current = useMemo(() => layouts[formation], [formation])
  const saveTeamSetup = () => { localStorage.setItem("pitchside-formation", formation); localStorage.setItem("pitchside-set-piece-takers", JSON.stringify(takers)); window.dispatchEvent(new Event("pitchside-team-setup-updated")); onClose() }

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-[#071713] text-white">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/25 px-4 py-3">
        <button onClick={onClose} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold"><ArrowLeft className="h-5 w-5" /> Team</button>
        <div className="text-center"><p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-300">Matchday XI</p><h1 className="text-lg font-black">Formation</h1></div>
        <button onClick={saveTeamSetup} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-black">SAVE</button>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-black/20 p-2">
        {(["Formation","Training","Kits"] as const).map((x) => (
          <button key={x} onClick={() => x === "Formation" ? undefined : x === "Training" ? onTraining?.() : setKitsOpen(true)} className={x === "Formation" ? "rounded-xl bg-emerald-400 py-2 text-xs font-black text-black" : "rounded-xl py-2 text-xs font-bold text-white/55"}>{x}</button>
        ))}
      </div>

      {kitsOpen ? <div className="absolute inset-0 z-[110] overflow-y-auto bg-[#070909]"><KitEditor onClose={() => setKitsOpen(false)} /></div> : null}

      <div className="flex-1 overflow-y-auto px-3 pb-5">
        <div className="relative mx-auto mt-3 aspect-[0.72] w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-[#1d6b43] shadow-2xl">
          <div className="absolute inset-3 rounded-2xl border-2 border-white/40" />
          <div className="absolute left-1/2 top-1/2 h-px w-[calc(100%-24px)] -translate-x-1/2 bg-white/40" />
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
          {current.map(([slot,x,y], i) => {
            const p = roleFor(slot,i)
            return <div key={slot+i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{left:x+"%",top:y+"%"}}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-black/70 text-[10px] font-black shadow-xl">{p?.number || i+1}</div>
              <div className="mt-1 whitespace-nowrap rounded-md bg-black/65 px-1.5 py-0.5 text-[8px] font-bold">{p?.name || "Player"}</div>
              <div className="text-center text-[7px] font-bold text-white/55">{slot}</div>
            </div>
          })}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {(["4-3-3","4-4-2","3-5-2","4-2-3-1","4-1-4-1"] as Formation[]).map(f =>
            <button key={f} onClick={() => setFormation(f)} className={formation===f ? "shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-black" : "shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold"}>{f}</button>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-3 flex items-center gap-2"><Crosshair className="h-4 w-4 text-emerald-300"/><p className="text-xs font-black uppercase tracking-wider">Set pieces</p></div>
          <div className="grid grid-cols-3 gap-2">
            {(["Free Kick","Penalty","Corner"] as SetPiece[]).map(x =>
              <button key={x} onClick={() => setPiece(x)} className={piece===x ? "rounded-xl bg-emerald-400 p-2 text-[10px] font-black text-black" : "rounded-xl bg-black/20 p-2 text-[10px] font-bold text-white/60"}>{x}</button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            {piece === "Corner" ? <Flag className="h-5 w-5 text-emerald-300"/> : piece === "Penalty" ? <Trophy className="h-5 w-5 text-emerald-300"/> : <CircleDot className="h-5 w-5 text-emerald-300"/>}
            <select value={takers[piece]} onChange={e => setTakers(v => ({...v,[piece]:e.target.value}))} className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold">
              {squad.filter(p => piece === "Penalty" ? p.pos === "FWD" || p.pos === "MID" : p.pos !== "GK").slice(0,10).map(p => <option key={p.id} value={p.id}>{p.name} · {p.style}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wider">Substitutes</p><Users className="h-4 w-4 text-white/50"/></div>
          <div className="flex gap-2 overflow-x-auto">
            {bench.map(p => <div key={p.id} className="min-w-24 rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-sm font-black">{p.number || "—"}</p><p className="mt-1 truncate text-[10px] font-bold">{p.name}</p><p className="text-[8px] text-white/50">{p.pos} · {p.rating}</p></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}
