import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome", { ascending: true })

    if (error) throw error

    return NextResponse.json({ produtos: data || [] })
  } catch (error: any) {
    console.error("Erro ao buscar produtos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, descricao, unidade_medida, estoque_minimo } = body

    if (!nome || !unidade_medida) {
      return NextResponse.json(
        { error: "Nome e unidade de medida são obrigatórios" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("produtos")
      .insert([
        {
          nome,
          descricao: descricao || null,
          unidade_medida,
          estoque_atual: 0,
          estoque_minimo: estoque_minimo || 0,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ produto: data }, { status: 201 })
  } catch (error: any) {
    console.error("Erro ao criar produto:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

