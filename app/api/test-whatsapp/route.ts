import { NextResponse } from "next/server"
import { testWhatsAppNotification } from "@/lib/test-notification"
import { formatPhoneNumber } from "@/lib/phone-utils"

export async function POST(request: Request) {
  console.log("[API] POST /api/test-whatsapp - Starting WhatsApp test")

  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      console.error("[API] Missing phone number in request")
      return NextResponse.json({ error: "Número de telefone é obrigatório" }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!formattedPhone) {
      console.error(`[API] Invalid phone number format: ${phoneNumber}`)
      return NextResponse.json({ error: "Formato de número de telefone inválido" }, { status: 400 })
    }

    console.log(`[API] Testing WhatsApp with formatted number: ${formattedPhone}`)
    const result = await testWhatsAppNotification(formattedPhone)

    if (!result.success) {
      console.error(`[API] WhatsApp test failed:`, result)
      return NextResponse.json({ error: result.message || "Falha no teste do WhatsApp" }, { status: 500 })
    }

    console.log(`[API] WhatsApp test successful:`, result)
    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error("[API] Error in WhatsApp test endpoint:", error)
    return NextResponse.json({ error: "Erro ao testar integração com WhatsApp" }, { status: 500 })
  }
}

