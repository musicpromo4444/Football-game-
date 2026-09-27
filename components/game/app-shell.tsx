"use client"

import { useEffect, useState } from "react"
import { Gavel, X, UserCircle, Pencil, Settings as SettingsIcon, Volume2, Bell, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { readAuctionDisplay } from "@/lib/auction-display"
import type { TabId } from "@/components/game/data"
import { BottomNav } from "@/components/game/bottom-nav"
import { Play } from "@/components/game/screens/play"
import { LeagueHub } from "@/components/game/screens/league-hub"
import { PrivateLeagues } from "@/components/game/screens/private-leagues"
import { SquadManager } from "@/components/game/screens/squad-manager"
import { Settings } from "@/components/game/screens/settings"
import { Shop } from "@/components/game/screens/shop"
import { DailyLoginModal } from "@/components/game/daily-login-modal"
import { getCountry, readProfile } from "@/lib/locale"
import { squad } from "@/components/game/data"

export function AppShell() {
  const [tab, setTab] = useState<TabId>("play")
  const [auctionOpen, setAuctionOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [captainEditOpen, setCaptainEditOpen] = useState(false)
  const [captainName, setCaptainName] = useState(squad[5]?.name || "Captain")
  const captain = squad[5]
  const [auctionDisplay, setAuctionDisplay] = useState(readAuctionDisplay())
  const profile = readProfile()
  const country = getCountry(profile?.countryCode)
  useEffect(() => { const refresh = () => setAuctionDisplay(readAuctionDisplay()); window.addEventListener("storage", refresh); return () => window.removeEventListener("storage", refresh) }, [])

  return (
    <div className="app-bg min-h-screen">
      <DailyLoginModal />
      {auctionDisplay.enabled && <div className="fixed bottom-20 right-4 z-50"><button type="button" onClick={() => setAuctionOpen(v => !v)} className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-card/95 text-2xl shadow-xl">{auctionDisplay.icon || <Gavel className="h-6 w-6" />}</button>{auctionOpen && <div className="absolute bottom-16 right-0 w-72 rounded-2xl border border-primary/30 bg-card/98 p-4 shadow-2xl"><div className="flex items-center justify-between"><div><p className="font-display text-lg font-black text-primary">{auctionDisplay.title}</p><p className="text-[10px] text-muted-foreground">{auctionDisplay.writeUp}</p></div><button type="button" onClick={() => setAuctionOpen(false)}><X className="h-4 w-4" /></button></div><Button className="mt-3 w-full rounded-xl" onClick={() => { setAuctionOpen(false); setTab("squad"); window.localStorage.setItem("pitchside-open-market", "1") }}>Open Auction</Button></div>}</div>}
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <div className="relative flex items-center justify-between px-4 pb-2 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{country.flag}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{country.currency}</span>
          </div>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-card/90 shadow-lg"
            aria-label="Open profile"
          >
            <UserCircle className="h-6 w-6 text-primary" />
          </button>
        </div>
        {profileOpen && (
          <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm" onClick={() => setProfileOpen(false)}>
            <div className="mx-auto flex min-h-full max-w-md items-start justify-end px-4 pt-16" onClick={(e) => e.stopPropagation()}>
              <div className="w-full rounded-3xl border border-primary/20 bg-card p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black">Profile</p>
                    <p className="text-[10px] text-muted-foreground">{profile?.name || "Manager"} · {country.flag}</p>
                  </div>
                  <button type="button" onClick={() => setProfileOpen(false)} className="rounded-full p-2 text-muted-foreground"><X className="h-5 w-5" /></button>
                </div>

                <button type="button" onClick={() => setCaptainEditOpen(true)} className="w-full rounded-2xl border border-primary/35 bg-background/70 p-4 text-left">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary">Your Captain</p>
                      <p className="mt-1 font-display text-xl font-black">{captainName}</p>
                    </div>
                    <Pencil className="h-4 w-4 text-primary" />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-xl bg-secondary p-2 text-center"><p className="text-[8px] text-muted-foreground">POS</p><p className="text-xs font-bold">{captain?.pos}</p></div>
                    <div className="rounded-xl bg-secondary p-2 text-center"><p className="text-[8px] text-muted-foreground">OVR</p><p className="text-xs font-bold">{captain?.rating}</p></div>
                    <div className="rounded-xl bg-secondary p-2 text-center"><p className="text-[8px] text-muted-foreground">ROLE</p><p className="truncate text-[10px] font-bold">{captain?.style}</p></div>
                    <div className="rounded-xl bg-secondary p-2 text-center"><p className="text-[8px] text-muted-foreground">STA</p><p className="text-xs font-bold">{captain?.stamina}</p></div>
                  </div>
                  <p className="mt-3 text-center text-[10px] font-bold text-primary">Tap to edit captain</p>
                </button>

                {captainEditOpen && (
                  <div className="mt-3 rounded-2xl border border-primary/20 bg-background p-4">
                    <p className="mb-3 font-bold">Edit Captain</p>
                    <label className="mb-1 block text-[10px] text-muted-foreground">Captain name</label>
                    <input value={captainName} onChange={(e) => setCaptainName(e.target.value)} className="mb-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setCaptainEditOpen(false)} className="rounded-xl border border-border py-2 text-xs font-bold">Done</button>
                      <button type="button" onClick={() => setCaptainEditOpen(false)} className="rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground">Save Captain</button>
                    </div>
                  </div>
                )}

                <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-background/50">
                  <button type="button" onClick={() => { setProfileOpen(false); setCaptainEditOpen(false); setTab("settings") }} className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                    <span className="flex-1"><span className="block text-sm font-bold">Settings</span><span className="block text-[10px] text-muted-foreground">Sound, commentary, haptics, notifications & account</span></span>
                    <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="grid grid-cols-3 divide-x divide-border">
                    <div className="flex flex-col items-center gap-1 py-3"><Volume2 className="h-4 w-4 text-primary" /><span className="text-[9px] text-muted-foreground">Sound</span></div>
                    <div className="flex flex-col items-center gap-1 py-3"><Bell className="h-4 w-4 text-primary" /><span className="text-[9px] text-muted-foreground">Alerts</span></div>
                    <div className="flex flex-col items-center gap-1 py-3"><ShieldCheck className="h-4 w-4 text-primary" /><span className="text-[9px] text-muted-foreground">Account</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          {tab === "private" && <PrivateLeagues />}
          {tab === "league" && <LeagueHub />}
          {tab === "play" && <Play onNavigate={setTab} />}
          {tab === "squad" && <SquadManager />}
          {tab === "shop" && <Shop />}
          {tab === "settings" && <Settings />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}
