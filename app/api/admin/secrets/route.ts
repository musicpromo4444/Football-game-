import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const SECRET_NAMES = [
  "pitchside.payment.provider",
  "pitchside.payment.public_key",
  "pitchside.payment.secret_key",
  "pitchside.payment.webhook_secret",
  "pitchside.ads.provider",
  "pitchside.ads.publisher_id",
  "pitchside.ads.app_id",
  "pitchside.ads.api_key",
  "pitchside.ads.api_secret",
]

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Server Supabase configuration is missing")
  return createClient(url, key, { auth: { persistSession: false } })
}

function authorized(req: Request) {
  const expected = process.env.PITCHSIDE_ADMIN_TOKEN
  const supplied = req.headers.get("x-pitchside-admin-token")
  return Boolean(expected && supplied && supplied === expected)
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const supabase = adminClient()
    const { data, error } = await supabase.rpc("pitchside_secret_status", { p_names: SECRET_NAMES })
    if (error) throw error
    return NextResponse.json({ configured: data ?? [] })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Configuration error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const entries = Array.isArray(body?.secrets) ? body.secrets : []
    const allowed = new Set(SECRET_NAMES)
    const supabase = adminClient()

    for (const entry of entries) {
      if (!entry || !allowed.has(entry.name) || typeof entry.value !== "string" || !entry.value.trim()) continue
      const { error } = await supabase.rpc("pitchside_set_secret", {
        p_name: entry.name,
        p_value: entry.value.trim(),
      })
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save secrets" }, { status: 500 })
  }
}
