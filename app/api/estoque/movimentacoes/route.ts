import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const produtoId = searchParams.get("produto_id")

    let query = supabase
      .from("estoque_movimentacoes")
      .select(`
        *,
        produto:produtos(*),
        responsavel:users(id, name, email)
      `)
      .order("data_movimentacao", { ascending: false })

    if (produtoId) {
      query = query.eq("produto_id", produtoId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ movimentacoes: data || [] })
  } catch (error: any) {
    console.error("Erro ao buscar movimentações:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { produto_id, tipo, quantidade, data_movimentacao, responsavel_id, observacoes } = body

    if (!produto_id || !tipo || !quantidade) {
      return NextResponse.json(
        { error: "Produto, tipo e quantidade são obrigatórios" },
        { status: 400 }
      )
    }

    if (tipo !== "entrada" && tipo !== "saida") {
      return NextResponse.json(
        { error: "Tipo deve ser 'entrada' ou 'saida'" },
        { status: 400 }
      )
    }

    if (quantidade <= 0) {
      return NextResponse.json(
        { error: "Quantidade deve ser maior que zero" },
        { status: 400 }
      )
    }

    // Verificar estoque disponível para saída
    if (tipo === "saida") {
      const { data: produto, error: prodError } = await supabase
        .from("produtos")
        .select("estoque_atual")
        .eq("id", produto_id)
        .single()

      if (prodError) throw prodError

      if (!produto || produto.estoque_atual < quantidade) {
        return NextResponse.json(
          { error: "Estoque insuficiente para esta saída" },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from("estoque_movimentacoes")
      .insert([
        {
          produto_id,
          tipo,
          quantidade,
          data_movimentacao: data_movimentacao || new Date().toISOString(),
          responsavel_id: responsavel_id || null,
          observacoes: observacoes || null,
        },
      ])
      .select(`
        *,
        produto:produtos(*),
        responsavel:users(id, name, email)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ movimentacao: data }, { status: 201 })
  } catch (error: any) {
    console.error("Erro ao criar movimentação:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

