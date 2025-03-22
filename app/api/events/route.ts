import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { notifyEventFornecedores } from "@/lib/event-notification"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: Request) {
  console.log("[API] POST /api/events - Starting event creation")
  try {
    const { title, description, date, fornecedores, ...payload } = await request.json()
    console.log(`[API] Creating event: "${title}" with ${fornecedores?.length || 0} fornecedores`)

    // Se houver um campo fornecedor_id no payload, remova-o
    if (payload.fornecedor_id !== undefined) {
      delete payload.fornecedor_id
    }

    // Criar o evento
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({
        title,
        description,
        date,
      })
      .select()

    if (eventError) {
      console.error("[API] Error creating event:", eventError)
      throw eventError
    }

    const eventId = eventData[0].id
    console.log(`[API] Event created successfully with ID: ${eventId}`)

    // Adicionar fornecedores ao evento
    if (fornecedores && fornecedores.length > 0) {
      console.log(`[API] Adding ${fornecedores.length} fornecedores to event ${eventId}`)
      const fornecedoresData = fornecedores.map((fornecedorId: string) => ({
        event_id: eventId,
        fornecedor_id: fornecedorId, // Corrigido: user_id -> fornecedor_id
      }))

      const { error: fornecedoresError } = await supabase.from("event_fornecedores").insert(fornecedoresData)

      if (fornecedoresError) {
        console.error("[API] Error adding fornecedores to event:", fornecedoresError)
        throw fornecedoresError
      }

      // Enviar notificações WhatsApp para os fornecedores
      console.log(`[API] Sending WhatsApp notifications to fornecedores for event ${eventId}`)
      const notificationResult = await notifyEventFornecedores(eventId, title)
      console.log(`[API] Notification result:`, notificationResult)
    } else {
      console.log(`[API] No fornecedores to add for event ${eventId}`)
    }

    return NextResponse.json({ success: true, eventId })
  } catch (error) {
    console.error("[API] Error in event creation process:", error)
    return NextResponse.json({ error: "Erro ao criar evento" }, { status: 500 })
  }
}

