"use client"

import { useState } from "react"
import { Globe2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/game/ui-bits"
import { COUNTRIES, saveProfile } from "@/lib/locale"

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState("")
  const [countryCode, setCountryCode] = useState("NG")

  const submit = () => {
    if (!name.trim()) return
    saveProfile({ name: name.trim(), countryCode })
    onComplete()
  }

  return (
    <main className="app-bg flex min-h-screen items-center justify-center px-5">
      <Card glow="emerald" className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-3xl">⚽</div>
          <h1 className="font-display text-3xl font-black">Welcome to PitchSide</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create your manager profile to enter the club.</p>
        </div>

        <label className="mb-4 block text-xs font-bold text-muted-foreground">
          Manager name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1.5 w-full rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm text-foreground outline-none focus:border-primary" />
        </label>

        <label className="block text-xs font-bold text-muted-foreground">
          Country
          <div className="relative mt-1.5">
            <Globe2 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-primary" />
            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-full appearance-none rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary">
              {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.name} · {country.currency}</option>)}
            </select>
          </div>
        </label>

        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary" />
          Your country controls the flag shown on your profile and the currency used for real-money shop prices.
        </div>

        <Button disabled={!name.trim()} onClick={submit} className="mt-5 w-full rounded-xl py-6 font-display text-base font-black">Enter PitchSide</Button>
      </Card>
    </main>
  )
}
