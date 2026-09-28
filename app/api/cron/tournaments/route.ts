import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  const expected = process.env.CRON_SECRET || process.env.PITCHSIDE_ADMIN_TOKEN
  if (!expected || auth !== `Bearer ${expected}`) return NextResponse.json({error:"Unauthorized"},{status:401})
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url||!key) return NextResponse.json({error:"Server Supabase configuration is missing"},{status:500})
  const db=createClient(url,key,{auth:{persistSession:false}})
  const {data,error}=await db.rpc("pitchside_finalize_due_tournaments")
  if(error) return NextResponse.json({error:error.message},{status:500})
  return NextResponse.json({ok:true,finalized:Number(data||0)})
}
