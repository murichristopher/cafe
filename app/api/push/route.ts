import webpush from 'web-push';
import { NextResponse, NextRequest } from 'next/server';

// Configurar VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.org';

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
);

console.log('[PUSH API] Inicializada com VAPID public key:', vapidPublicKey.substring(0, 10) + '...');

export async function POST(request: NextRequest) {
  try {
    console.log('[PUSH API] Recebida solicitação de envio de notificação push');
    
    const body = await request.json();
    const { subscription, title, message, data } = body;
    
    // Validar dados
    if (!subscription || !title || !message) {
      console.error('[PUSH API] Dados incompletos:', { subscription: !!subscription, title: !!title, message: !!message });
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Verificar se subscription é válida
    if (!subscription.endpoint || !subscription.keys) {
      console.error('[PUSH API] Formato de subscription inválido:', subscription);
      return NextResponse.json(
        { success: false, error: 'Formato de subscription inválido' },
        { status: 400 }
      );
    }
    
    console.log(`[PUSH API] Enviando notificação push: "${title}" para endpoint: ${subscription.endpoint.substring(0, 30)}...`);
    
    // Enviar notificação push
    const payload = JSON.stringify({
      title,
      message,
      data: data || {}
    });
    
    try {
      await webpush.sendNotification(subscription, payload);
      console.log('[PUSH API] Notificação push enviada com sucesso');
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[PUSH API] Erro ao enviar notificação push via web-push:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Falha ao enviar notificação',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[PUSH API] Erro ao processar solicitação de notificação push:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Falha ao processar solicitação',
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}