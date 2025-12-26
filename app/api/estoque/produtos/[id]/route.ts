import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ produto: data })
  } catch (error: any) {
    console.error("Erro ao buscar produto:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nome, descricao, unidade_medida, estoque_minimo } = body

    const updateData: any = {}
    if (nome !== undefined) updateData.nome = nome
    if (descricao !== undefined) updateData.descricao = descricao
    if (unidade_medida !== undefined) updateData.unidade_medida = unidade_medida
    if (estoque_minimo !== undefined) updateData.estoque_minimo = estoque_minimo

    const { data, error } = await supabase
      .from("produtos")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ produto: data })
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Excluir todas as movimentações associadas primeiro
    const { error: movError } = await supabase
      .from("estoque_movimentacoes")
      .delete()
      .eq("produto_id", params.id)

    if (movError) {
      console.error("Erro ao excluir movimentações:", movError)
      // Continuar mesmo se houver erro, pois pode ser que não existam movimentações
    }

    // Excluir o produto (as movimentações já foram excluídas ou serão excluídas em cascata)
    const { error } = await supabase.from("produtos").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

