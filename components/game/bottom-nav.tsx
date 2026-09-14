"use client"

import { User, Trophy, Gamepad2, Shield, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TabId } from "@/components/game/data"

const items: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "private", label: "Private", icon: User },
  { id: "league", label: "League", icon: Trophy },
  { id: "play", label: "Play", icon: Gamepad2 },
  { id: "squad", label: "Squad", icon: Shield },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId
  onChange: (tab: TabId) => void
}) {
  return (
    <nav className="pointer-events-auto sticky bottom-0 z-20 border-t border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          const isPlay = item.id === "play"

          if (isPlay) {
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className="flex flex-col items-center gap-1"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    "-mt-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 bg-primary text-primary-foreground transition",
                    isActive ? "glow-cyan" : "opacity-90",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-col items-center gap-1 py-1"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
