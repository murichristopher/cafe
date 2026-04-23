import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, date, location, event_image, status")
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json({ evento: data })
  } catch (error: any) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
  }
}
