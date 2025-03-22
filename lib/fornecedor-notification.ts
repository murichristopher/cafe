import { sendWhatsAppMessage } from "@/lib/whatsapp-service"
import { supabase } from "@/lib/supabase"
import type { User } from "@/types"
import { formatPhoneNumber } from "@/lib/phone-utils"

// Função para notificar sobre alterações nos fornecedores de um evento
export async function notifyFornecedorChanges(
  eventId: string,
  eventTitle: string,
  newFornecedores: string[],
  previousFornecedores: string[],
  eventDate?: string,
  eventLocation?: string,
  baseUrl?: string,
) {
  console.log(`[FORNECEDOR NOTIFICATION] Iniciando notificação de alterações para evento ${eventId}`)

  try {
    // Identificar fornecedores adicionados (estão em newFornecedores mas não em previousFornecedores)
    const addedFornecedorIds = newFornecedores.filter((id) => !previousFornecedores.includes(id))

    if (addedFornecedorIds.length === 0) {
      console.log(`[FORNECEDOR NOTIFICATION] Nenhum novo fornecedor adicionado ao evento ${eventId}`)
      return { success: true, message: "Nenhum novo fornecedor para notificar" }
    }

    console.log(
      `[FORNECEDOR NOTIFICATION] ${addedFornecedorIds.length} novos fornecedores adicionados ao evento ${eventId}`,
    )

    // Buscar detalhes de todos os fornecedores atuais para incluir na mensagem
    const { data: allFornecedores, error: fornecedoresError } = await supabase
      .from("users")
      .select("id, name, phone_number, email")
      .in("id", newFornecedores)

    if (fornecedoresError) {
      console.error(`[FORNECEDOR NOTIFICATION] Erro ao buscar detalhes dos fornecedores:`, fornecedoresError)
      return { success: false, message: fornecedoresError.message }
    }

    // Buscar detalhes apenas dos novos fornecedores para enviar notificações
    const { data: newFornecedoresData, error: newFornecedoresError } = await supabase
      .from("users")
      .select("id, name, phone_number, email")
      .in("id", addedFornecedorIds)

    if (newFornecedoresError) {
      console.error(`[FORNECEDOR NOTIFICATION] Erro ao buscar detalhes dos novos fornecedores:`, newFornecedoresError)
      return { success: false, message: newFornecedoresError.message }
    }

    const fornecedores = (allFornecedores as User[]) || []
    const newFornecedoresList = (newFornecedoresData as User[]) || []

    if (newFornecedoresList.length === 0) {
      console.log(`[FORNECEDOR NOTIFICATION] Não foi possível encontrar detalhes dos novos fornecedores`)
      return { success: false, message: "Detalhes dos fornecedores não encontrados" }
    }

    // Criar a lista de todos os fornecedores para incluir na mensagem
    const fornecedoresList = fornecedores.map((f) => `- ${f.name}`).join("\n")

    // Criar a URL do evento
    const eventUrl = `${baseUrl}/dashboard/events/${eventId}`

    // Enviar mensagem para cada novo fornecedor
    const results = await Promise.all(
      newFornecedoresList.map(async (fornecedor) => {
        if (!fornecedor.phone_number) {
          console.warn(
            `[FORNECEDOR NOTIFICATION] Fornecedor ${fornecedor.id} (${fornecedor.name}) não tem número de telefone`,
          )
          return {
            fornecedorId: fornecedor.id,
            success: false,
            message: "Número de telefone não disponível",
          }
        }

        const formattedPhone = formatPhoneNumber(fornecedor.phone_number)
        if (!formattedPhone) {
          console.warn(
            `[FORNECEDOR NOTIFICATION] Número de telefone inválido para fornecedor ${fornecedor.id}: ${fornecedor.phone_number}`,
          )
          return {
            fornecedorId: fornecedor.id,
            success: false,
            message: "Número de telefone inválido",
          }
        }

        // Mensagem informando sobre a adição ao evento
        const message = `Olá ${fornecedor.name}, essa é uma mensagem automática do sistema!

Você foi adicionado(a) ao evento *${eventTitle}*!

Informações do evento:
Nome: ${eventTitle}
Data: ${eventDate || "A confirmar"}
Local: ${eventLocation || "A confirmar"}

Fornecedores participantes:
${fornecedoresList}

Para mais informações e para fazer o upload das imagens do evento, acesse:
${eventUrl}`

        console.log(`[FORNECEDOR NOTIFICATION] Enviando mensagem WhatsApp para ${fornecedor.name} (${formattedPhone})`)

        try {
          const result = await sendWhatsAppMessage(formattedPhone, message)
          console.log(`[FORNECEDOR NOTIFICATION] Resultado do envio para ${fornecedor.name}:`, result)

          return {
            fornecedorId: fornecedor.id,
            success: result.success,
            message: result.message,
          }
        } catch (error) {
          console.error(`[FORNECEDOR NOTIFICATION] Erro ao enviar mensagem WhatsApp para ${fornecedor.name}:`, error)
          return {
            fornecedorId: fornecedor.id,
            success: false,
            message: error instanceof Error ? error.message : "Erro desconhecido",
          }
        }
      }),
    )

    const successCount = results.filter((r) => r.success).length
    console.log(
      `[FORNECEDOR NOTIFICATION] Notificações concluídas para evento ${eventId}. Sucesso: ${successCount}/${results.length}`,
    )

    return {
      success: true,
      message: `Notificados ${successCount} de ${results.length} novos fornecedores`,
      details: results,
    }
  } catch (error) {
    console.error(`[FORNECEDOR NOTIFICATION] Erro inesperado no processo de notificação:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

