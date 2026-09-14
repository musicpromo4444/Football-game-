import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pt-6 pb-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-balance">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  )
}

export function Card({
  children,
  className,
  glow,
}: {
  children: ReactNode
  className?: string
  glow?: "cyan" | "emerald"
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/70 backdrop-blur-sm",
        glow === "cyan" && "glow-cyan",
        glow === "emerald" && "glow-emerald",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StatBar({
  value,
  accent = "cyan",
  className,
}: {
  value: number
  accent?: "cyan" | "emerald" | "amber" | "red"
  className?: string
}) {
  const color =
    value < 40
      ? "bg-destructive"
      : accent === "emerald"
        ? "bg-accent"
        : accent === "amber"
          ? "bg-chart-4"
          : "bg-primary"
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function Pill({
  children,
  accent,
  className,
}: {
  children: ReactNode
  accent?: "cyan" | "emerald" | "muted"
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        accent === "cyan" && "bg-primary/15 text-primary",
        accent === "emerald" && "bg-accent/15 text-accent",
        (!accent || accent === "muted") && "bg-secondary text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  )
}

const formColor: Record<string, string> = {
  W: "bg-accent/20 text-accent",
  D: "bg-secondary text-muted-foreground",
  L: "bg-destructive/20 text-destructive",
}

export function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold",
            formColor[r],
          )}
        >
          {r}
        </span>
      ))}
    </div>
  )
}
