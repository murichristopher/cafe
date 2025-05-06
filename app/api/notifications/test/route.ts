import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Extrair o ID do fornecedor da URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'eb2672a9-4e3f-450b-833e-12d2e2cf0767'; // ID padrão do fornecedor se não for especificado
    
    console.log(`[NOTIFICATION TEST] Criando notificação de teste para o usuário ${userId}`);
    
    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      console.error(`[NOTIFICATION TEST] Erro ao buscar usuário: ${userError?.message}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }
    
    console.log(`[NOTIFICATION TEST] Usuário encontrado: ${user.name}`);
    
    // Criar uma notificação de teste
    const notificationData = {
      user_id: userId,
      title: 'Notificação de Teste',
      message: `Esta é uma notificação de teste criada em ${new Date().toLocaleString('pt-BR')}`,
      type: 'system',
      read: false,
    };
    
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select();
      
    if (notificationError) {
      console.error(`[NOTIFICATION TEST] Erro ao criar notificação: ${notificationError.message}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar notificação',
        details: notificationError.message
      }, { status: 500 });
    }
    
    console.log(`[NOTIFICATION TEST] Notificação criada com sucesso: ${notification[0].id}`);
    
    // Verificar as notificações existentes do usuário
    const { data: userNotifications, error: listError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (listError) {
      console.error(`[NOTIFICATION TEST] Erro ao listar notificações: ${listError.message}`);
    } else {
      console.log(`[NOTIFICATION TEST] Usuário tem ${userNotifications.length} notificações`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notificação criada com sucesso',
      notification: notification[0],
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      existingNotifications: userNotifications?.length || 0
    });
    
  } catch (error) {
    console.error('[NOTIFICATION TEST] Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 