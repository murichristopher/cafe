import { NextResponse } from "next/server"
import { notifyEventFornecedores } from "@/lib/event-notification"
import { supabase } from "@/lib/supabase"

// Get the base URL from environment variable
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || "https://app.elevecafe.com.br"
}

// Format time from date
const formatTimeFromDate = (dateString: string | null): string => {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) return ""

    // Format time as HH:MM
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  } catch (error) {
    console.error("Error formatting time from date:", error)
    return ""
  }
}

// Format time string to HH:mm
const formatTimeString = (timeString: string | null): string => {
  if (!timeString) return ""
  try {
    const [hours, minutes] = timeString.split(":")
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  } catch (error) {
    console.error("Error formatting time string:", error)
    return ""
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    console.log(`[API] POST /api/events/${eventId}/notify - Starting supplier notification`)

    // Get fornecedor data from request body
    const { fornecedores } = await request.json().catch(() => ({ fornecedores: [] }))

    if (!eventId) {
      console.error("[API] Missing event ID in request")
      return NextResponse.json({ error: "ID do evento é obrigatório" }, { status: 400 })
    }

    // Fetch the event details from the database
    const { data: eventData, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single()

    if (eventError) {
      console.error(`[API] Error fetching event details:`, eventError)
      return NextResponse.json({ error: "Erro ao buscar detalhes do evento" }, { status: 500 })
    }

    // Log the full event data to debug
    console.log(`[API] Event data:`, JSON.stringify(eventData, null, 2))

    const eventTitle = eventData.title

    // Format date for the message (date only)
    const eventDate = eventData.date ? new Date(eventData.date).toLocaleDateString("pt-BR") : ""

    // Extract start time from the date field
    const startTime = formatTimeFromDate(eventData.date)

    // Extract end time and PAX fields - check all possible field names
    const endTime = formatTimeString(eventData.horario_fim) || formatTimeString(eventData.end_time) || formatTimeString(eventData.hora_fim) || ""
    const pax = eventData.pax || eventData.num_pax || eventData.numero_pax || ""

    console.log(`[API] Extracted fields - Start Time: "${startTime}", End Time: "${endTime}", PAX: "${pax}"`)
    console.log(`[API] Notifying suppliers for event: ${eventId} - "${eventTitle}"`)
    console.log(`[API] Using ${fornecedores?.length || 0} provided fornecedores`)

    // Get the base URL for the application
    const baseUrl = getBaseUrl()
    console.log(`[API] Using base URL: ${baseUrl}`)

    // Pass all event details to the notification function
    const result = await notifyEventFornecedores(
      eventId,
      eventTitle,
      eventDate,
      eventData.location || "",
      startTime,
      endTime,
      pax,
      baseUrl,
      fornecedores,
    )

    if (!result.success) {
      console.error(`[API] Notification failed:`, result)
      return NextResponse.json({ error: result.message || "Falha ao notificar fornecedores" }, { status: 500 })
    }

    console.log(`[API] Notification successful:`, result)
    return NextResponse.json({
      success: true,
      message: "Fornecedores notificados com sucesso",
      details: result,
    })
  } catch (error) {
    console.error("[API] Error in notification endpoint:", error)
    return NextResponse.json({ error: "Erro ao notificar fornecedores" }, { status: 500 })
  }
}

