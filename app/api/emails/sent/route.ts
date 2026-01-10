import { NextRequest, NextResponse } from "next/server"
import { listSentEmails } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    const result = await listSentEmails()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      emails: result.emails || [],
    })
  } catch (error) {
    console.error("[API] Erro ao listar emails enviados:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao listar emails enviados",
      },
      { status: 500 }
    )
  }
}

