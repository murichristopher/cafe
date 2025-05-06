import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/lib/notification-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'eb2672a9-4e3f-450b-833e-12d2e2cf0767'; // ID do filtrro
    
    console.log(`[NOTIFICAÇÃO DIAGNÓSTICO] Iniciando diagnóstico completo para o usuário ${userId}`);
    
    // 1. Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, role, push_subscription')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      console.error(`[NOTIFICAÇÃO DIAGNÓSTICO] Usuário não encontrado: ${userError?.message}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }
    
    // 2. Verificar se a tabela notifications existe
    const { error: tableCheckError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
      
    const tabelaExists = !tableCheckError;
    
    if (!tabelaExists) {
      console.error(`[NOTIFICAÇÃO DIAGNÓSTICO] Tabela notifications não existe ou não está acessível: ${tableCheckError?.message}`);
    }
    
    // 3. Verificar as notificações existentes do usuário
    const { data: existingNotifications, error: listError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    const notificacoesExistentes = !listError ? existingNotifications.length : -1;
    
    // 4. Testar criação direta na tabela
    let criacaoDiretaResult: any = null;
    
    try {
      const { data: insertResult, error: insertError } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title: 'Teste Diagnóstico (Direto)',
          message: `Notificação de teste criada diretamente na tabela em ${new Date().toLocaleString('pt-BR')}`,
          type: 'system',
          read: false
        }])
        .select();
        
      criacaoDiretaResult = {
        success: !insertError,
        error: insertError?.message,
        notificationId: insertResult?.[0]?.id
      };
    } catch (error) {
      criacaoDiretaResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
    
    // 5. Testar criação via serviço
    let servicoResult: any = null;
    
    try {
      const result = await createNotification(
        userId,
        'Teste Diagnóstico (Serviço)',
        `Notificação de teste criada via serviço em ${new Date().toLocaleString('pt-BR')}`,
        'system'
      );
      
      servicoResult = result;
    } catch (error) {
      servicoResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
    
    // 6. Verificar notificações após testes
    const { data: finalNotifications, error: finalListError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    const notificacoesFinais = !finalListError ? finalNotifications.length : -1;
    const aumento = notificacoesFinais - notificacoesExistentes;
    
    // Verificar permissões RLS
    let rlsPermissaoLeitura = true;
    let rlsPermissaoEscrita = true;
    let rlsErrorMessage = null;
    
    try {
      // Criar um cliente com as credenciais do usuário (simulação)
      // Isso não funciona realmente aqui, é apenas para diagnóstico
      const { error: rlsTestError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
        
      if (rlsTestError) {
        rlsPermissaoLeitura = false;
        rlsErrorMessage = rlsTestError.message;
      }
    } catch (error) {
      rlsPermissaoLeitura = false;
      rlsErrorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    }
    
    console.log(`[NOTIFICAÇÃO DIAGNÓSTICO] Diagnóstico completo para ${user.name} (${userId})`);
    console.log(`[NOTIFICAÇÃO DIAGNÓSTICO] Notificações antes: ${notificacoesExistentes}, depois: ${notificacoesFinais}`);
    
    return NextResponse.json({
      success: true,
      diagnostico: {
        usuario: {
          id: user.id,
          nome: user.name,
          perfil: user.role,
          temPushSubscription: !!user.push_subscription
        },
        bancoTabelas: {
          tabelaNotificationsExiste: tabelaExists,
          erro: tableCheckError?.message
        },
        notificacoes: {
          totalInicial: notificacoesExistentes,
          totalFinal: notificacoesFinais,
          aumentou: aumento > 0,
          aumento
        },
        testes: {
          criacaoDireta: criacaoDiretaResult,
          viaServico: servicoResult
        },
        seguranca: {
          rlsPermissaoLeitura,
          rlsPermissaoEscrita,
          rlsErrorMessage
        },
        ultimasNotificacoes: finalNotifications?.slice(0, 5).map(n => ({
          id: n.id,
          titulo: n.title,
          mensagem: n.message,
          criada: n.created_at,
          lida: n.read
        }))
      }
    });
    
  } catch (error) {
    console.error('[NOTIFICAÇÃO DIAGNÓSTICO] Erro inesperado:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 