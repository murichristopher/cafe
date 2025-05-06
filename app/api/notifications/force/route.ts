import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Endpoint para forçar a criação de uma notificação
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, message, type, eventId } = body;
    
    if (!userId || !title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Dados incompletos. userId, title e message são obrigatórios.'
      }, { status: 400 });
    }
    
    console.log(`[FORCE NOTIFICATION] Criando notificação forçada para ${userId}`);
    
    // Criar a notificação diretamente no banco
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type: type || 'system',
        read: false,
        event_id: eventId || null
      }])
      .select();
    
    if (error) {
      console.error('[FORCE NOTIFICATION] Erro ao criar notificação:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    console.log(`[FORCE NOTIFICATION] Notificação criada com sucesso: ${data[0].id}`);
    
    return NextResponse.json({
      success: true,
      notification: data[0]
    });
    
  } catch (error) {
    console.error('[FORCE NOTIFICATION] Erro ao processar requisição:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 