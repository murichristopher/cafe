import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Endpoint para criar uma notificação de teste com um usuário válido
export async function POST(request: Request) {
  try {
    console.log('[CREATE TEST NOTIFICATION] Iniciando criação de notificação de teste');
    
    // 1. Encontrar um usuário válido no sistema
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('[CREATE TEST NOTIFICATION] Erro ao buscar usuário:', userError);
      return NextResponse.json({
        success: false,
        error: 'Não foi possível encontrar um usuário válido',
        details: userError?.message
      }, { status: 404 });
    }
    
    const testUser = users[0];
    console.log(`[CREATE TEST NOTIFICATION] Usuário encontrado: ${testUser.id}`);
    
    // 2. Buscar um evento válido (opcional, apenas se quiser testar com event_id)
    let eventId = null;
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (events && events.length > 0) {
      eventId = events[0].id;
      console.log(`[CREATE TEST NOTIFICATION] Evento encontrado: ${eventId}`);
    }
    
    // 3. Criar a notificação para o usuário encontrado
    const notificationData = {
      user_id: testUser.id,
      title: 'Notificação de Teste Automática',
      message: `Esta é uma notificação de teste criada automaticamente às ${new Date().toLocaleTimeString()}`,
      type: 'system',
      read: false,
      event_id: eventId
    };
    
    console.log('[CREATE TEST NOTIFICATION] Tentando criar notificação:', notificationData);
    
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select();
    
    if (notifError) {
      console.error('[CREATE TEST NOTIFICATION] Erro ao criar notificação:', notifError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar notificação',
        details: notifError.message,
        code: notifError.code,
        user: testUser.id
      }, { status: 500 });
    }
    
    console.log(`[CREATE TEST NOTIFICATION] Notificação criada com sucesso: ${notification?.[0]?.id}`);
    
    // 4. Retornar informações sobre a notificação criada
    return NextResponse.json({
      success: true,
      notification: notification?.[0] || null,
      user: {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role
      },
      message: 'Notificação de teste criada com sucesso'
    });
    
  } catch (error) {
    console.error('[CREATE TEST NOTIFICATION] Erro inesperado:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao processar solicitação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 