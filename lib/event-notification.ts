import { sendWhatsAppMessage } from "@/lib/whatsapp-service"
import { supabase } from "@/lib/supabase"
import type { User, Event } from "@/types"
import { formatPhoneNumber } from "@/lib/phone-utils"
import { notifyFornecedorAdded } from "@/lib/notification-service"

// Update the function signature to include all needed event details
export async function notifyEventFornecedores(
  eventId: string,
  eventTitle: string,
  eventDate?: string,
  eventLocation?: string,
  eventStartTime?: string,
  eventEndTime?: string,
  eventPax?: number | string,
  baseUrl?: string,
  providedFornecedores?: User[],
) {
  console.log(`[EVENT NOTIFICATION] Starting notification process for event ${eventId}`)

  try {
    let fornecedores: User[] = []

    // If fornecedor data is provided, use it directly
    if (providedFornecedores && providedFornecedores.length > 0) {
      console.log(`[EVENT NOTIFICATION] Using ${providedFornecedores.length} provided fornecedores`)
      fornecedores = providedFornecedores
    } else {
      // Otherwise, try to query the database (this likely won't work due to RLS)
      console.log(`[EVENT NOTIFICATION] No fornecedores provided, querying database`)

      // First get fornecedor IDs
      const { data: eventFornecedores, error: fornecedoresError } = await supabase
        .from("event_fornecedores")
        .select("fornecedor_id")
        .eq("event_id", eventId)

      if (fornecedoresError) {
        console.error(`[EVENT NOTIFICATION] Error fetching fornecedores for event ${eventId}:`, fornecedoresError)
        return { success: false, message: fornecedoresError.message }
      }

      if (!eventFornecedores || eventFornecedores.length === 0) {
        console.log(`[EVENT NOTIFICATION] No fornecedores found for event ${eventId}`)
        return { success: true, message: "No fornecedores to notify" }
      }

      const fornecedorIds = eventFornecedores.map((ef) => ef.fornecedor_id)
      console.log(`[EVENT NOTIFICATION] Found ${fornecedorIds.length} fornecedor IDs for event ${eventId}`)

      // Try to get user details (likely to fail due to RLS)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, phone_number, email, role")
        .in("id", fornecedorIds)

      if (userError) {
        console.error(`[EVENT NOTIFICATION] Error fetching user details:`, userError)
        return { success: false, message: userError.message }
      }

      fornecedores = (userData as User[]) || []
      console.log(`[EVENT NOTIFICATION] Retrieved ${fornecedores.length} fornecedores from database`)
    }

    if (fornecedores.length === 0) {
      console.log(`[EVENT NOTIFICATION] No fornecedores to notify for event ${eventId}`)
      return { success: true, message: "No fornecedores to notify" }
    }

    console.log(`[EVENT NOTIFICATION] Notifying ${fornecedores.length} fornecedores`)

    // Create the event URL
    const eventUrl = `${baseUrl}/dashboard/events/${eventId}`

    // Criar objeto do evento para as notificações push
    const eventObj: Event = {
      id: eventId,
      title: eventTitle,
      date: eventDate || '',
      location: eventLocation || '',
      description: '',
      admin_id: '',
      status: 'pendente'
    }

    // Send WhatsApp message to each fornecedor
    const results = await Promise.all(
      fornecedores.map(async (fornecedor: User) => {
        // 1. Enviar notificação push para todos os fornecedores, independente do WhatsApp
        try {
          console.log(`[EVENT NOTIFICATION] Sending push notification to ${fornecedor.name} (${fornecedor.id})`)
          await notifyFornecedorAdded(fornecedor.id, eventObj)
          console.log(`[EVENT NOTIFICATION] Push notification sent to ${fornecedor.name}`)
        } catch (pushError) {
          console.error(`[EVENT NOTIFICATION] Error sending push notification to ${fornecedor.name}:`, pushError)
          // Continue com o WhatsApp mesmo se falhar o push
        }

        // 2. Enviar notificação via WhatsApp se tiver número
        if (!fornecedor.phone_number) {
          console.warn(`[EVENT NOTIFICATION] Fornecedor ${fornecedor.id} (${fornecedor.name}) has no phone number`)
          return {
            fornecedorId: fornecedor.id,
            success: true, // Marcamos como sucesso se pelo menos o push foi enviado
            message: "Push notification sent, but no phone number available for WhatsApp",
          }
        }

        const formattedPhone = formatPhoneNumber(fornecedor.phone_number)
        if (!formattedPhone) {
          console.warn(
            `[EVENT NOTIFICATION] Invalid phone number for fornecedor ${fornecedor.id}: ${fornecedor.phone_number}`,
          )
          return {
            fornecedorId: fornecedor.id,
            success: true, // Marcamos como sucesso se pelo menos o push foi enviado
            message: "Push notification sent, but invalid phone number for WhatsApp",
          }
        }

        // Updated message format according to the template
        const message = `Opa ${fornecedor.name}, essa é uma mensagem automática do sistema!

Você foi selecionado para o evento *${eventTitle}*, aqui estão mais informações:

Nome: ${eventTitle}
Data: ${eventDate || ""}
Local: ${eventLocation || ""}
Hora início: ${eventStartTime || ""}
Hora fim: ${eventEndTime || ""}
PAX: ${eventPax || ""}

Para mais informações e para fazer o upload das imagens do evento, acesse:

${eventUrl}`

        console.log(`[EVENT NOTIFICATION] Sending WhatsApp message to ${fornecedor.name} (${formattedPhone})`)

        try {
          const result = await sendWhatsAppMessage(formattedPhone, message)
          console.log(`[EVENT NOTIFICATION] WhatsApp message result for ${fornecedor.name}:`, result)

          return {
            fornecedorId: fornecedor.id,
            success: result.success,
            message: result.message,
          }
        } catch (error) {
          console.error(`[EVENT NOTIFICATION] Error sending WhatsApp message to ${fornecedor.name}:`, error)
          return {
            fornecedorId: fornecedor.id,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }),
    )

    const successCount = results.filter((r) => r.success).length
    console.log(
      `[EVENT NOTIFICATION] Completed notifications for event ${eventId}. Success: ${successCount}/${results.length}`,
    )

    return {
      success: true,
      message: `Successfully notified ${successCount} out of ${results.length} fornecedores`,
      details: results,
    }
  } catch (error) {
    console.error(`[EVENT NOTIFICATION] Unexpected error in notification process:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

