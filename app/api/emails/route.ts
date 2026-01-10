import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status")

    // Construir query
    let query = supabase
      .from("emails")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtrar por status se fornecido
    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[API] Erro ao buscar emails:", error)
      
      // Se a tabela não existir, retornar array vazio em vez de erro
      if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
        console.warn("[API] Tabela 'emails' não existe ainda. Execute a migration.")
        return NextResponse.json({
          success: true,
          emails: [],
          pagination: {
            total: 0,
            limit,
            offset,
          },
          warning: "Tabela de emails não encontrada. Execute a migration create_emails_table.sql",
        })
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Buscar total de emails para paginação
    let countQuery = supabase.from("emails").select("*", { count: "exact", head: true })
    if (status) {
      countQuery = countQuery.eq("status", status)
    }
    const { count, error: countError } = await countQuery

    if (countError && countError.code !== "PGRST116") {
      console.error("[API] Erro ao contar emails:", countError)
    }

    return NextResponse.json({
      success: true,
      emails: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error("[API] Erro ao listar emails:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao listar emails",
      },
      { status: 500 }
    )
  }
}

