"use client"

import { AppShell } from "@/components/game/app-shell"

export default function Home() {
  // Temporary testing mode: authentication/onboarding is intentionally bypassed.
  // Restore the login/onboarding gate as the final release step.
  return <AppShell />
}
