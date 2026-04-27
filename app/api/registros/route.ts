import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Busca todos os eventos com contagem de registros
    const { data: eventos, error: eventosError } = await supabase
      .from("events")
      .select("id, title, date, location, status")
      .order("date", { ascending: false })

    if (eventosError) throw eventosError

    // Busca contagens de registros por evento
    const { data: contagens, error: contagensError } = await supabase
      .from("event_registros")
      .select("event_id")

    if (contagensError) throw contagensError

    // Agrupa contagens
    const contagemMap: Record<string, number> = {}
    for (const r of contagens || []) {
      contagemMap[r.event_id] = (contagemMap[r.event_id] || 0) + 1
    }

    const resultado = (eventos || [])
      .map((ev) => ({
        ...ev,
        total_registros: contagemMap[ev.id] || 0,
      }))
      .filter((ev) => ev.total_registros > 0) // só eventos com respostas
      .sort((a, b) => b.total_registros - a.total_registros)

    return NextResponse.json({ eventos: resultado })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
