import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';

// Configurar VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contatoaxolutions@gmail.com';

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
);

export async function GET(request: Request) {
  try {
    console.log('[PUSH TEST] Iniciando teste de notificação push');

    // Buscar fornecedores com push_subscription
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, push_subscription, role')
      .eq('role', 'fornecedor')
      .not('push_subscription', 'is', null);

    if (usersError) {
      console.error('[PUSH TEST] Erro ao buscar usuários:', usersError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao buscar usuários', 
          details: usersError.message 
        }, 
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log('[PUSH TEST] Nenhum usuário com push_subscription encontrado');
      return NextResponse.json({ 
        success: false, 
        message: 'Nenhum usuário com push_subscription encontrado' 
      });
    }

    console.log(`[PUSH TEST] Encontrados ${users.length} usuários com push_subscription`);

    const results = [];

    // Tentar enviar uma notificação para cada usuário
    for (const user of users) {
      try {
        console.log(`[PUSH TEST] Testando notificação para ${user.name} (${user.id})`);
        
        const subscription = user.push_subscription;
        
        if (!subscription || !subscription.endpoint || !subscription.keys) {
          console.error(`[PUSH TEST] Subscription inválida para usuário ${user.id}:`, subscription);
          results.push({
            userId: user.id,
            name: user.name,
            success: false,
            error: 'Subscription inválida'
          });
          continue;
        }

        // Payload da notificação
        const payload = JSON.stringify({
          title: 'Teste de Notificação Push',
          message: `Olá ${user.name}, esta é uma notificação de teste!`,
          data: {
            timestamp: new Date().toISOString(),
            testId: 'push-test-1'
          }
        });

        // Enviar notificação
        await webpush.sendNotification(subscription, payload);
        
        console.log(`[PUSH TEST] Notificação enviada com sucesso para ${user.name}`);
        results.push({
          userId: user.id,
          name: user.name,
          success: true
        });
      } catch (error) {
        console.error(`[PUSH TEST] Erro ao enviar notificação para ${user.name}:`, error);
        results.push({
          userId: user.id,
          name: user.name,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return NextResponse.json({
      success: true,
      usersCount: users.length,
      results
    });
  } catch (error) {
    console.error('[PUSH TEST] Erro ao testar notificações push:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao testar notificações push',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }, 
      { status: 500 }
    );
  }
} 