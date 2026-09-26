"use client"

import { createClient } from "@supabase/supabase-js"

// Publishable key is safe for the browser; database access is protected by RLS.
const url = "https://snymstpmekoecpdohyyg.supabase.co"
const key = "sb_publishable_zEmO6Kq5qpg9puG0PuiAtw_ohI1VL2B"

export const supabase = createClient(url, key)
