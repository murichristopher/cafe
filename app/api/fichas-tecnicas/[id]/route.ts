import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { data: ficha, error } = await supabase
      .from("fichas_tecnicas")
      .select(`
        *,
        ficha_ingredientes (
          *,
          produto:produtos (id, nome, unidade_medida, custo_unitario)
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json({ ficha })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json()
    const { nome, descricao, rendimento, unidade_rendimento, ingredientes } = body

    const { data: ficha, error: fichaError } = await supabase
      .from("fichas_tecnicas")
      .update({ nome, descricao, rendimento, unidade_rendimento })
      .eq("id", id)
      .select()
      .single()

    if (fichaError) throw fichaError

    if (ingredientes !== undefined) {
      await supabase.from("ficha_ingredientes").delete().eq("ficha_id", id)

      if (ingredientes.length > 0) {
        const ingredientesData = ingredientes.map((ing: any) => ({
          ficha_id: id,
          produto_id: ing.produto_id,
          quantidade: ing.quantidade,
          unidade_medida: ing.unidade_medida,
        }))

        const { error: ingError } = await supabase
          .from("ficha_ingredientes")
          .insert(ingredientesData)

        if (ingError) throw ingError
      }
    }

    return NextResponse.json({ ficha })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { error } = await supabase.from("fichas_tecnicas").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
