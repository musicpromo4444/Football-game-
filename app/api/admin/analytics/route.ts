import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function authorized(req: Request) {
  const expected = process.env.PITCHSIDE_ADMIN_TOKEN
  return Boolean(expected && req.headers.get("x-pitchside-admin-token") === expected)
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Server Supabase configuration is missing")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const supabase = adminClient()
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const iso = start.toISOString()
    const [{ count: matchesToday }, { count: completedMatchesToday }, { count: participantsToday }, { count: impressionsToday }, { count: playableToday }, { data: todayEvents }, { data: tournaments }] = await Promise.all([
      supabase.from("matches").select("*", { count: "exact", head: true }).gte("created_at", iso),
      supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "completed").gte("created_at", iso),
      supabase.from("pitchside_tournament_entries").select("*", { count: "exact", head: true }).gte("created_at", iso),
      supabase.from("pitchside_analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "pre_match_sponsor_impression").gte("created_at", iso),
      supabase.from("pitchside_analytics_events").select("*", { count: "exact", head: true }).eq("event_type", "playable_ad_started").gte("created_at", iso),
      supabase.from("pitchside_analytics_events").select("user_id,event_type,tournament_id").gte("created_at", iso),
      supabase.from("pitchside_tournaments").select("id,name,status,starts_at,ends_at,max_players"),
    ])
    const { data: tournamentRows } = await supabase.from("pitchside_tournament_entries").select("tournament_id")
    const uniquePlayers = new Set((todayEvents || []).map((x) => x.user_id).filter(Boolean)).size
    const counts: Record<string, number> = {}
    for (const row of tournamentRows || []) counts[row.tournament_id] = (counts[row.tournament_id] || 0) + 1
    return NextResponse.json({
      today: { matches: matchesToday || 0, completedMatches: completedMatchesToday || 0, uniquePlayers, tournamentEntries: participantsToday || 0, sponsorImpressions: impressionsToday || 0, playableAds: playableToday || 0 },
      tournaments: (tournaments || []).map((t) => ({ ...t, participants: counts[t.id] || 0 })),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analytics failed" }, { status: 500 })
  }
}
