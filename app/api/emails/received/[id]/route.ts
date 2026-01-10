import { NextRequest, NextResponse } from "next/server"
import { getReceivedEmailById } from "@/lib/email-service"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    const result = await getReceivedEmailById(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      email: result.email,
    })
  } catch (error) {
    console.error("[API] Erro ao buscar email recebido:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar email",
      },
      { status: 500 }
    )
  }
}

