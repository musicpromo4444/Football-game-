import { supabase } from "@/lib/supabase"

export type LeagueId =
  | "academy" | "league-1" | "league-2" | "league-3" | "league-4"
  | "premier" | "champions" | "super" | "legendary" | "elite" | "hall-of-fame"

export type OnlineMatch = {
  match_id: string
  opponent_id: string
  league_id: LeagueId
}

export async function ensureOnlinePlayer(displayName = "PitchSide Player") {
  if (!supabase) throw new Error("PitchSide online service is not configured.")
  let { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    const result = await supabase.auth.signInAnonymously({ options: { data: { display_name: displayName } } })
    if (result.error) throw result.error
    session = result.data.session
  }
  if (!session?.user) throw new Error("Could not create your online player session.")
  const { error } = await supabase.from("players").upsert({
    user_id: session.user.id,
    display_name: displayName,
  }, { onConflict: "user_id" })
  if (error) throw error
  return session.user
}

export async function queueForOnlineMatch(displayName?: string) {
  const user = await ensureOnlinePlayer(displayName)
  const { data, error } = await supabase!.rpc("find_online_match")
  if (error) throw error
  return { user, match: (data?.[0] as OnlineMatch | undefined) ?? null }
}

export async function acceptRematch(offerId: string) {
  if (!supabase) throw new Error("PitchSide online service is not configured.")
  const { data, error } = await supabase.rpc("respond_to_rematch", { p_offer_id: offerId, p_accept: true })
  if (error) throw error
  return data?.[0] ?? null
}

export async function declineRematch(offerId: string) {
  if (!supabase) throw new Error("PitchSide online service is not configured.")
  const { data, error } = await supabase.rpc("respond_to_rematch", { p_offer_id: offerId, p_accept: false })
  if (error) throw error
  return data?.[0] ?? null
}

export async function completeOnlineMatch(matchId: string, home: number, away: number) {
  if (!supabase) throw new Error("PitchSide online service is not configured.")
  const { data, error } = await supabase.rpc("complete_match", {
    p_match_id: matchId,
    p_score_a: home,
    p_score_b: away,
  })
  if (error) throw error
  return data?.[0] ?? null
}
