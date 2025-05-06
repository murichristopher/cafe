import { supabase } from "./supabase"
import type { Notification, User, Event } from "@/types"

/**
 * Cria uma nova notificação no banco de dados
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'event_assignment' | 'reminder' | 'update' | 'system',
  eventId?: string
): Promise<{ success: boolean; notificationId?: string; error?: any }> {
  try {
    // Verificar se o usuário existe
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error(`[NOTIFICATION] Usuário não encontrado para ID: ${userId}`, userError)
      return { success: false, error: "Usuário não encontrado" }
    }

    // Criar notificação no banco
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        event_id: eventId,
        read: false,
      })
      .select()

    if (error) {
      console.error("[NOTIFICATION] Erro ao criar notificação:", error)
      return { success: false, error }
    }

    const notificationId = data && data.length > 0 ? data[0].id : undefined

    return {
      success: true,
      notificationId
    }
  } catch (error) {
    console.error("[NOTIFICATION] Erro inesperado ao criar notificação:", error)
    return { success: false, error }
  }
}

/**
 * Notifica um fornecedor quando ele é adicionado a um evento
 */
export async function notifyFornecedorAdded(
  fornecedorId: string,
  event: Event
): Promise<{ success: boolean; error?: any }> {
  try {
    // Obter detalhes do fornecedor
    const { data: fornecedor, error: fornecedorError } = await supabase
      .from("users")
      .select("*")
      .eq("id", fornecedorId)
      .single()

    if (fornecedorError || !fornecedor) {
      console.error(`[NOTIFICATION] Fornecedor não encontrado para ID: ${fornecedorId}`, fornecedorError)
      return { success: false, error: "Fornecedor não encontrado" }
    }

    // Criar mensagem de notificação
    const title = "Novo evento atribuído"
    const message = `Você foi adicionado ao evento: ${event.title} em ${new Date(event.date).toLocaleDateString('pt-BR')}`

    // Criar notificação no banco
    const notificationResult = await createNotification(
      fornecedorId,
      title,
      message,
      'event_assignment',
      event.id
    )

    // Enviar notificação push se disponível
    if (fornecedor.push_subscription) {
      try {
        await sendPushNotification(
          fornecedor.push_subscription,
          title,
          message,
          { 
            eventId: event.id,
            type: 'event_assignment'
          }
        )
      } catch (pushError) {
        console.error("[NOTIFICATION] Erro ao enviar notificação push:", pushError)
        // Continuar mesmo com erro no push, pois a notificação já foi salva no banco
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[NOTIFICATION] Erro ao notificar fornecedor:", error)
    return { success: false, error }
  }
}

/**
 * Notifica todos os fornecedores de um evento
 */
export async function notifyEventFornecedores(
  eventId: string,
  title: string,
  message: string,
  type: 'reminder' | 'update' | 'system' = 'update'
): Promise<{ success: boolean; details?: any[]; error?: any }> {
  try {
    // Buscar fornecedores associados ao evento
    const { data: fornecedores, error: fornecedoresError } = await supabase
      .from("event_fornecedores")
      .select("fornecedor_id")
      .eq("event_id", eventId)

    if (fornecedoresError) {
      console.error(`[NOTIFICATION] Erro ao buscar fornecedores do evento ${eventId}:`, fornecedoresError)
      return { success: false, error: fornecedoresError }
    }

    // Buscar fornecedor principal do evento
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("fornecedor_id")
      .eq("id", eventId)
      .single()

    if (eventError) {
      console.error(`[NOTIFICATION] Erro ao buscar dados do evento ${eventId}:`, eventError)
      return { success: false, error: eventError }
    }

    // Juntar todos os IDs de fornecedores
    const fornecedorIds = [
      ...fornecedores.map(f => f.fornecedor_id),
      ...(eventData.fornecedor_id ? [eventData.fornecedor_id] : [])
    ]

    // Remover duplicatas
    const uniqueFornecedorIds = [...new Set(fornecedorIds)]

    if (uniqueFornecedorIds.length === 0) {
      console.log(`[NOTIFICATION] Nenhum fornecedor encontrado para o evento ${eventId}`)
      return { success: true, details: [] }
    }

    // Notificar cada fornecedor
    const results = await Promise.all(
      uniqueFornecedorIds.map(async (fornecedorId) => {
        try {
          // Criar notificação no banco
          const notificationResult = await createNotification(
            fornecedorId,
            title,
            message,
            type,
            eventId
          )

          // Buscar detalhes do fornecedor para enviar push
          const { data: fornecedor } = await supabase
            .from("users")
            .select("push_subscription")
            .eq("id", fornecedorId)
            .single()

          // Enviar notificação push se disponível
          if (fornecedor?.push_subscription) {
            try {
              await sendPushNotification(
                fornecedor.push_subscription,
                title,
                message,
                { 
                  eventId,
                  type
                }
              )
            } catch (pushError) {
              console.error(`[NOTIFICATION] Erro ao enviar push para fornecedor ${fornecedorId}:`, pushError)
              // Continuar mesmo com erro no push
            }
          }

          return { 
            fornecedorId, 
            success: true,
            notificationId: notificationResult.notificationId
          }
        } catch (error) {
          console.error(`[NOTIFICATION] Erro ao notificar fornecedor ${fornecedorId}:`, error)
          return { fornecedorId, success: false, error }
        }
      })
    )

    const successful = results.filter(r => r.success).length
    const total = uniqueFornecedorIds.length

    console.log(`[NOTIFICATION] Notificações enviadas: ${successful}/${total}`)
    
    return { 
      success: successful > 0,
      details: results
    }
  } catch (error) {
    console.error("[NOTIFICATION] Erro ao notificar fornecedores:", error)
    return { success: false, error }
  }
}

/**
 * Enviar uma notificação push para um dispositivo
 * Esta função precisa ser implementada com uma biblioteca de web push
 */
async function sendPushNotification(
  subscription: any,
  title: string,
  message: string,
  data?: any
): Promise<void> {
  try {
    console.log(`[PUSH] Enviando notificação push: ${title}`)
    
    // Verificar se a subscription é válida
    if (!subscription || !subscription.endpoint) {
      console.error('[PUSH] Subscription inválida:', subscription)
      throw new Error('Subscription inválida ou incompleta')
    }
    
    // Se estiver rodando no servidor, usar web-push diretamente
    if (typeof window === 'undefined') {
      console.log('[PUSH] Executando no servidor, usando web-push diretamente')
      const webpush = require('web-push')
      
      // Configurar VAPID keys
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.org',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
        process.env.VAPID_PRIVATE_KEY || ''
      )
      
      const payload = JSON.stringify({
        title,
        message,
        data: data || {}
      })
      
      // Enviar notificação diretamente
      await webpush.sendNotification(subscription, payload)
      console.log(`[PUSH] Notificação push enviada com sucesso via web-push: ${title}`)
    } 
    // Se estiver no cliente (browser), usar a API fetch
    else {
      console.log('[PUSH] Executando no cliente, usando fetch para API')
      const response = await fetch('/api/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          title,
          message,
          data,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar notificação push')
      }
      
      console.log(`[PUSH] Notificação push enviada com sucesso via API: ${title}`)
    }
  } catch (error) {
    console.error('[PUSH] Erro ao enviar notificação push:', error)
    throw error
  }
} 