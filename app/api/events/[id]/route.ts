import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        id, 
        title, 
        description, 
        date,
        event_fornecedores(user_id)
      `)
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar evento:", error)
    return NextResponse.json({ error: "Erro ao buscar evento" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { title, description, date, fornecedores } = await request.json()

    // Atualizar o evento
    const { error: eventError } = await supabase
      .from("events")
      .update({
        title,
        description,
        date,
      })
      .eq("id", params.id)

    if (eventError) throw eventError

    // Remover todos os fornecedores existentes
    const { error: deleteError } = await supabase.from("event_fornecedores").delete().eq("event_id", params.id)

    if (deleteError) throw deleteError

    // Adicionar fornecedores selecionados
    if (fornecedores && fornecedores.length > 0) {
      const fornecedoresData = fornecedores.map((fornecedorId: string) => ({
        event_id: params.id,
        user_id: fornecedorId,
      }))

      const { error: insertError } = await supabase.from("event_fornecedores").insert(fornecedoresData)

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar evento:", error)
    return NextResponse.json({ error: "Erro ao atualizar evento" }, { status: 500 })
  }
}

