import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Verificar configurações VAPID
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    // Verificar instalação do web-push
    let webPushInstalled = false;
    try {
      require('web-push');
      webPushInstalled = true;
    } catch (error) {
      console.error('Erro ao verificar web-push:', error);
    }

    // Verificar usuários com push_subscription
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, role')
      .not('push_subscription', 'is', null);

    if (usersError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao buscar usuários com push subscription', 
          details: usersError.message 
        }, 
        { status: 500 }
      );
    }

    // Retornar diagnóstico
    return NextResponse.json({
      success: true,
      config: {
        vapidPublicKeyConfigured: !!vapidPublicKey,
        vapidPrivateKeyConfigured: !!vapidPrivateKey,
        vapidSubjectConfigured: !!vapidSubject,
        webPushInstalled
      },
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        role: user.role,
        hasPushSubscription: true
      })),
      userCount: users.length
    });
  } catch (error) {
    console.error('Erro no diagnóstico de push notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao realizar diagnóstico',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }, 
      { status: 500 }
    );
  }
} 