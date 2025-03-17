import { supabase } from "@/lib/supabase"
import { sendWhatsAppMessage } from "@/lib/whatsapp-service"
import type { User } from "@/types"
import { formatPhoneNumber } from "@/lib/phone-utils"

// Get the base URL from environment variable
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || "https://cafe-da-manha.vercel.app"
}

// Format time from date
const formatTimeFromDate = (dateString: string | null): string => {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  } catch (error) {
    console.error("Error formatting time from date:", error)
    return ""
  }
}

/**
 * Sends a reminder notification to fornecedores about an event happening tomorrow
 */
export async function sendReminderNotification(
  eventId: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  startTime: string,
  endTime: string,
  pax: string,
  baseUrl: string,
  fornecedores: User[],
): Promise<{
  success: boolean
  message: string
  details?: Array<{ userId: string; success: boolean; error?: string }>
}> {
  try {
    if (!fornecedores || fornecedores.length === 0) {
      return { success: false, message: "No fornecedores provided" }
    }

    const eventUrl = `${baseUrl}/dashboard/events/${eventId}`
    const details: Array<{ userId: string; success: boolean; error?: string }> = []

    for (const fornecedor of fornecedores) {
      try {
        if (!fornecedor.phone_number) {
          console.log(`[REMINDER] Fornecedor ${fornecedor.id} (${fornecedor.name}) has no phone number`)
          details.push({
            userId: fornecedor.id,
            success: false,
            error: "No phone number available",
          })
          continue
        }

        // Custom reminder message for events happening tomorrow
        const message = `Olá ${fornecedor.name}, o evento ${eventTitle} irá acontecer amanhã, veja mais detalhes:

Nome: ${eventTitle}
Data: ${eventDate}
Local: ${eventLocation}
Hora início: ${startTime}
Hora fim: ${endTime}
PAX: ${pax}

Para mais informações e para fazer o upload das imagens do evento, acesse:

${eventUrl}

___`

    const formattedPhone = formatPhoneNumber(fornecedor.phone_number)
    if (!formattedPhone) {
      console.error(`[API] Invalid phone number format: ${fornecedor.phone_number}`)
      return NextResponse.json({ error: "Formato de número de telefone inválido" }, { status: 400 })
    }

    console.log(`[API] Testing WhatsApp with formatted number: ${formattedPhone}`)


        // Use the existing WhatsApp service to send the message
        console.log(`[REMINDER] Sending reminder to ${fornecedor.name} (${formattedPhone})`)
        const result = await sendWhatsAppMessage(formattedPhone, message)

        details.push({
          userId: fornecedor.id,
          success: result.success,
          error: result.success ? undefined : result.message,
        })

        if (result.success) {
          console.log(`[REMINDER] Successfully sent reminder to ${fornecedor.name}`)
        } else {
          console.error(`[REMINDER] Failed to send reminder to ${fornecedor.name}: ${result.message}`)
        }
      } catch (error) {
        console.error(`[REMINDER] Error sending reminder to ${fornecedor.name}:`, error)
        details.push({
          userId: fornecedor.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    const successCount = details.filter((d) => d.success).length
    return {
      success: successCount > 0,
      message: `Successfully sent ${successCount} of ${fornecedores.length} reminders`,
      details,
    }
  } catch (error) {
    console.error("[REMINDER] Error in sendReminderNotification:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Checks for events happening tomorrow and sends reminder notifications
 * to all associated fornecedores
 */
export async function sendEventReminders(): Promise<{
  success: boolean
  message: string
  eventsProcessed?: number
  notificationsSent?: number
}> {
  console.log("[REMINDER] Starting event reminder check")

  try {
    // Calculate tomorrow's date (in YYYY-MM-DD format)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const tomorrowStr = tomorrow.toISOString().split("T")[0]
    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split("T")[0]

    console.log(`[REMINDER] Checking for events on ${tomorrowStr}`)

    // Find all events happening tomorrow
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .gte("date", tomorrowStr)
      .lt("date", dayAfterTomorrowStr)

    if (eventsError) {
      console.error("[REMINDER] Error fetching tomorrow's events:", eventsError)
      return { success: false, message: `Error fetching events: ${eventsError.message}` }
    }

    if (!events || events.length === 0) {
      console.log("[REMINDER] No events found for tomorrow")
      return { success: true, message: "No events scheduled for tomorrow", eventsProcessed: 0 }
    }

    console.log(`[REMINDER] Found ${events.length} events scheduled for tomorrow`)

    // Process each event
    let notificationsSent = 0

    for (const event of events) {
      console.log(`[REMINDER] Processing event: ${event.id} - ${event.title}`)

      // Get fornecedores for this event
      const { data: eventFornecedores, error: fornecedoresError } = await supabase
        .from("event_fornecedores")
        .select("fornecedor_id")
        .eq("event_id", event.id)

      if (fornecedoresError) {
        console.error(`[REMINDER] Error fetching fornecedores for event ${event.id}:`, fornecedoresError)
        continue // Skip to next event
      }

      if (!eventFornecedores || eventFornecedores.length === 0) {
        console.log(`[REMINDER] No fornecedores found for event ${event.id}`)
        continue // Skip to next event
      }

      const fornecedorIds = eventFornecedores.map((ef) => ef.fornecedor_id)

      // Get fornecedor details
      const { data: fornecedores, error: userError } = await supabase
        .from("users")
        .select("id, name, phone_number, email, role")
        .in("id", fornecedorIds)

      if (userError) {
        console.error(`[REMINDER] Error fetching fornecedor details:`, userError)
        continue // Skip to next event
      }

      if (!fornecedores || fornecedores.length === 0) {
        console.log(`[REMINDER] No fornecedor details found for event ${event.id}`)
        continue // Skip to next event
      }

      // Log the fornecedores for debugging
      console.log(
        `[REMINDER] Found ${fornecedores.length} fornecedores for event ${event.id}:`,
        fornecedores.map((f) => `${f.name} (${f.phone_number || "no phone"})`),
      )

      // Format date for the message
      const eventDate = event.date ? new Date(event.date).toLocaleDateString("pt-BR") : ""

      // Extract start time from the date field
      const startTime = formatTimeFromDate(event.date)

      // Extract end time and PAX fields
      const endTime = event.horario_fim || event.end_time || event.hora_fim || ""
      const pax = event.pax || event.num_pax || event.numero_pax || ""

      // Get base URL
      const baseUrl = getBaseUrl()

      // Send reminder notification with the custom reminder message
      const result = await sendReminderNotification(
        event.id,
        event.title,
        eventDate,
        event.location || "",
        startTime,
        endTime,
        pax,
        baseUrl,
        fornecedores as User[],
      )

      if (result.success) {
        notificationsSent += result.details?.filter((d) => d.success).length || 0
        console.log(`[REMINDER] Successfully sent reminders for event ${event.id}`)
      } else {
        console.error(`[REMINDER] Failed to send reminders for event ${event.id}:`, result.message)
      }
    }

    console.log(
      `[REMINDER] Completed reminder process. Processed ${events.length} events, sent ${notificationsSent} notifications`,
    )

    return {
      success: true,
      message: `Successfully processed ${events.length} events and sent ${notificationsSent} notifications`,
      eventsProcessed: events.length,
      notificationsSent,
    }
  } catch (error) {
    console.error("[REMINDER] Unexpected error in reminder process:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

