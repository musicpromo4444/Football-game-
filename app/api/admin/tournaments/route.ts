import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function authorized(req: Request) {
  const expected = process.env.PITCHSIDE_ADMIN_TOKEN
  const supplied = req.headers.get("x-pitchside-admin-token")
  return Boolean(expected && supplied && supplied === expected)
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Server Supabase configuration is missing")
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const t = body?.tournament
    if (!t?.name || !t?.start || !t?.end) return NextResponse.json({ error: "Name, start and end are required" }, { status: 400 })
    const supabase = db()
    const { data: tournament, error } = await supabase.from("pitchside_tournaments").insert({
      name: t.name.trim(), description: t.description || "", tournament_type: t.type,
      status: "published", starts_at: new Date(t.start).toISOString(), ends_at: new Date(t.end).toISOString(),
      entry_type: t.entryType.toLowerCase(), entry_amount: Math.max(0, Number(t.entryAmount) || 0),
      max_players: Math.max(2, Number(t.maxPlayers) || 16), required_games: Math.max(1, Number(t.games) || 1),
      required_wins: Math.max(1, Number(t.wins) || 1), draw_allowed: Boolean(t.drawAllowed),
      loss_eliminates: Boolean(t.lossEliminates), rules: { admin_configured: true }
    }).select("id").single()
    if (error) throw error
    const prizes = Array.isArray(body?.prizes) ? body.prizes.filter((p:any)=>p?.enabled) : []
    if (prizes.length) {
      const { error: prizeError } = await supabase.from("pitchside_tournament_prizes").insert(prizes.map((p:any)=>({
        tournament_id: tournament.id, place:p.place, reward_type:p.rewardType, item_id:p.itemId || null,
        quantity:Math.max(0,Number(p.quantity)||0), custom_value:p.customValue ? {value:p.customValue} : {}
      })))
      if (prizeError) throw prizeError
    }
    return NextResponse.json({ ok:true, tournamentId:tournament.id })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not publish tournament" }, { status: 500 })
  }
}
