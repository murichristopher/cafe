import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("[API] Erro ao buscar email:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Email não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      email: data,
    })
  } catch (error) {
    console.error("[API] Erro ao buscar email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar email",
      },
      { status: 500 }
    )
  }
}

