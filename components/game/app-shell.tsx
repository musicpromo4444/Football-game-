"use client"

import { useEffect, useState } from "react"
import { Gavel, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { readAuctionDisplay } from "@/lib/auction-display"
import type { TabId } from "@/components/game/data"
import { BottomNav } from "@/components/game/bottom-nav"
import { Play } from "@/components/game/screens/play"
import { LeagueHub } from "@/components/game/screens/league-hub"
import { PrivateLeagues } from "@/components/game/screens/private-leagues"
import { SquadManager } from "@/components/game/screens/squad-manager"
import { Settings } from "@/components/game/screens/settings"
import { DailyLoginModal } from "@/components/game/daily-login-modal"

export function AppShell() {
  const [tab, setTab] = useState<TabId>("play")
  const [auctionOpen, setAuctionOpen] = useState(false)
  const [auctionDisplay, setAuctionDisplay] = useState(readAuctionDisplay())
  useEffect(() => { const refresh = () => setAuctionDisplay(readAuctionDisplay()); window.addEventListener("storage", refresh); return () => window.removeEventListener("storage", refresh) }, [])

  return (
    <div className="app-bg min-h-screen">
      <DailyLoginModal />
      {auctionDisplay.enabled && <div className="fixed bottom-20 right-4 z-50"><button type="button" onClick={() => setAuctionOpen(v => !v)} className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-card/95 text-2xl shadow-xl">{auctionDisplay.icon || <Gavel className="h-6 w-6" />}</button>{auctionOpen && <div className="absolute bottom-16 right-0 w-72 rounded-2xl border border-primary/30 bg-card/98 p-4 shadow-2xl"><div className="flex items-center justify-between"><div><p className="font-display text-lg font-black text-primary">{auctionDisplay.title}</p><p className="text-[10px] text-muted-foreground">{auctionDisplay.writeUp}</p></div><button type="button" onClick={() => setAuctionOpen(false)}><X className="h-4 w-4" /></button></div><Button className="mt-3 w-full rounded-xl" onClick={() => { setAuctionOpen(false); setTab("squad"); window.localStorage.setItem("pitchside-open-market", "1") }}>Open Auction</Button></div>}</div>}
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <main className="flex-1 overflow-y-auto no-scrollbar">
          {tab === "private" && <PrivateLeagues />}
          {tab === "league" && <LeagueHub />}
          {tab === "play" && <Play onNavigate={setTab} />}
          {tab === "squad" && <SquadManager />}
          {tab === "settings" && <Settings />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
