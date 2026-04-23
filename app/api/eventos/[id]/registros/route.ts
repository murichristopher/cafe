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
      .from("event_registros")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ registros: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json()
    const { nome, telefone, foto_url } = body

    if (!nome?.trim() || !telefone?.trim()) {
      return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 })
    }

    // Verificar se o evento existe
    const { data: evento, error: eventoError } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", id)
      .single()

    if (eventoError || !evento) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("event_registros")
      .insert({
        event_id: id,
        nome: nome.trim(),
        telefone: telefone.trim(),
        foto_url: foto_url || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ registro: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
