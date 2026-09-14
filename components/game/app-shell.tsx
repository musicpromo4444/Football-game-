"use client"

import { useState } from "react"
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

  return (
    <div className="app-bg min-h-screen">
      <DailyLoginModal />
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
