"use client"

import { useState } from "react"
import { AppShell } from "@/components/game/app-shell"
import { Onboarding } from "@/components/game/onboarding"
import { readProfile } from "@/lib/locale"

export default function Home() {
  const [profile, setProfile] = useState(() => readProfile())
  return profile ? <AppShell /> : <Onboarding onComplete={() => setProfile(readProfile())} />
}
