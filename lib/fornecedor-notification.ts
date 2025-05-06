import { sendWhatsAppMessage } from "./whatsapp-service"
import { supabase } from "./supabase"
import { notifyFornecedorAdded } from "./notification-service"
import { formatPhoneNumber } from "./phone-utils"
import type { Event } from "@/types"

/**
 * Notifica fornecedores sobre alterações em suas associações a eventos
 */
export async function notifyFornecedorChanges(
  eventId: string,
  eventTitle: string,
  newFornecedores: string[],
  previousFornecedores: string[],
  eventDate?: string,
  eventLocation?: string,
  baseUrl?: string
): Promise<{ success: boolean; message: string; details?: any[] }> {
  try {
    // Identifica quais fornecedores foram adicionados (estão em newFornecedores mas não em previousFornecedores)
    const addedFornecedores = newFornecedores.filter(
      (fornecedorId) => !previousFornecedores.includes(fornecedorId)
    )

    if (addedFornecedores.length === 0) {
      console.log(`[FORNECEDOR NOTIFICATION] Nenhum novo fornecedor adicionado para o evento ${eventId}`)
      return {
        success: true,
        message: "Nenhum novo fornecedor para notificar",
      }
    }

    console.log(`[FORNECEDOR NOTIFICATION] Notificando ${addedFornecedores.length} novos fornecedores para o evento ${eventId}`)

    // Buscar detalhes do evento para enviar notificações
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError) {
      console.error(`[FORNECEDOR NOTIFICATION] Erro ao buscar detalhes do evento ${eventId}:`, eventError)
      return { success: false, message: `Erro ao buscar detalhes do evento: ${eventError.message}` }
    }

    const event: Event = {
      id: eventId,
      title: eventTitle,
      date: eventData.date,
      location: eventData.location || "",
      // Outros campos do evento necessários
    }

    // Busca detalhes dos fornecedores adicionados
    const { data: fornecedores, error: fornecedoresError } = await supabase
      .from("users")
      .select("id, name, phone_number")
      .in("id", addedFornecedores)

    if (fornecedoresError) {
      console.error(`[FORNECEDOR NOTIFICATION] Erro ao buscar detalhes dos fornecedores:`, fornecedoresError)
      return { success: false, message: `Erro ao buscar detalhes dos fornecedores: ${fornecedoresError.message}` }
    }

    // Lista para armazenar resultados das notificações
    const notificationResults = []

    // Envia notificações para cada fornecedor adicionado
    for (const fornecedor of fornecedores) {
      // Envia notificação no app
      try {
        await notifyFornecedorAdded(fornecedor.id, event)
        console.log(`[FORNECEDOR NOTIFICATION] Notificação in-app enviada para ${fornecedor.name}`)
      } catch (error) {
        console.error(`[FORNECEDOR NOTIFICATION] Erro ao enviar notificação in-app para ${fornecedor.name}:`, error)
      }

      // Envia mensagem no WhatsApp (mantém a funcionalidade existente)
      if (fornecedor.phone_number) {
        const formattedPhone = formatPhoneNumber(fornecedor.phone_number)
        
        if (!formattedPhone) {
          console.warn(`[FORNECEDOR NOTIFICATION] Número inválido para ${fornecedor.name}: ${fornecedor.phone_number}`)
          notificationResults.push({
            fornecedorId: fornecedor.id,
            name: fornecedor.name,
            success: false,
            message: "Número de telefone inválido",
          })
          continue
        }
        
        const message = `Olá ${fornecedor.name}, você foi adicionado ao evento ${eventTitle}.
Data: ${eventDate || "Não especificada"}
Local: ${eventLocation || "Não especificado"}
Acesse o sistema para mais detalhes: ${baseUrl || ""}/dashboard/events/${eventId}`

        try {
          const result = await sendWhatsAppMessage(formattedPhone, message)
          notificationResults.push({
            fornecedorId: fornecedor.id,
            name: fornecedor.name,
            success: result.success,
            message: result.message,
          })
        } catch (error) {
          console.error(`[FORNECEDOR NOTIFICATION] Erro ao enviar mensagem WhatsApp para ${fornecedor.name}:`, error)
          notificationResults.push({
            fornecedorId: fornecedor.id,
            name: fornecedor.name,
            success: false,
            message: error instanceof Error ? error.message : "Erro desconhecido",
          })
        }
      } else {
        notificationResults.push({
          fornecedorId: fornecedor.id,
          name: fornecedor.name,
          success: false,
          message: "Fornecedor não possui número de telefone",
        })
      }
    }

    const successCount = notificationResults.filter((r) => r.success).length

    return {
      success: true,
      message: `${successCount} de ${notificationResults.length} fornecedores notificados com sucesso`,
      details: notificationResults,
    }
  } catch (error) {
    console.error("[FORNECEDOR NOTIFICATION] Erro ao notificar fornecedores:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao notificar fornecedores",
    }
  }
}

