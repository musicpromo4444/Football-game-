"use client"

import { useState } from "react"
import { AppShell } from "@/components/game/app-shell"
import { Onboarding } from "@/components/game/onboarding"
import { readProfile } from "@/lib/locale"

export default function Home() {
  const [registered, setRegistered] = useState(() => Boolean(readProfile()))

  if (!registered) return <Onboarding onComplete={() => setRegistered(true)} />
  return <AppShell />
}
