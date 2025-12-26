import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Buscar a movimentação antes de excluir para reverter o estoque
    const { data: movimentacao, error: fetchError } = await supabase
      .from("estoque_movimentacoes")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError) throw fetchError

    if (!movimentacao) {
      return NextResponse.json({ error: "Movimentação não encontrada" }, { status: 404 })
    }

    // Reverter o estoque manualmente antes de excluir
    if (movimentacao.tipo === "entrada") {
      // Se era entrada, subtrair do estoque
      await supabase.rpc("decrementar_estoque", {
        produto_id: movimentacao.produto_id,
        quantidade: movimentacao.quantidade,
      })
    } else if (movimentacao.tipo === "saida") {
      // Se era saída, adicionar ao estoque
      await supabase.rpc("incrementar_estoque", {
        produto_id: movimentacao.produto_id,
        quantidade: movimentacao.quantidade,
      })
    }

    // Alternativa: atualizar diretamente
    const { data: produto } = await supabase
      .from("produtos")
      .select("estoque_atual")
      .eq("id", movimentacao.produto_id)
      .single()

    if (produto) {
      let novoEstoque = produto.estoque_atual
      if (movimentacao.tipo === "entrada") {
        novoEstoque -= movimentacao.quantidade
      } else {
        novoEstoque += movimentacao.quantidade
      }

      await supabase
        .from("produtos")
        .update({ estoque_atual: novoEstoque })
        .eq("id", movimentacao.produto_id)
    }

    // Excluir a movimentação
    const { error } = await supabase.from("estoque_movimentacoes").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao excluir movimentação:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

