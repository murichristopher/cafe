import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data: fichas, error } = await supabase
      .from("fichas_tecnicas")
      .select(`
        *,
        ficha_ingredientes (
          *,
          produto:produtos (id, nome, unidade_medida, custo_unitario)
        )
      `)
      .order("nome")

    if (error) throw error

    return NextResponse.json({ fichas })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nome, descricao, rendimento, unidade_rendimento, ingredientes } = body

    const { data: ficha, error: fichaError } = await supabase
      .from("fichas_tecnicas")
      .insert({ nome, descricao, rendimento, unidade_rendimento })
      .select()
      .single()

    if (fichaError) throw fichaError

    if (ingredientes && ingredientes.length > 0) {
      const ingredientesData = ingredientes.map((ing: any) => ({
        ficha_id: ficha.id,
        produto_id: ing.produto_id,
        quantidade: ing.quantidade,
        unidade_medida: ing.unidade_medida,
      }))

      const { error: ingError } = await supabase
        .from("ficha_ingredientes")
        .insert(ingredientesData)

      if (ingError) throw ingError
    }

    return NextResponse.json({ ficha }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
