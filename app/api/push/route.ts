import webpush from 'web-push';
import { NextResponse, NextRequest } from 'next/server';

// Configurar VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.org',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, title, message, data } = body;
    
    // Validar dados
    if (!subscription || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Enviar notificação push
    const payload = JSON.stringify({
      title,
      message,
      data: data || {}
    });
    
    await webpush.sendNotification(subscription, payload);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar notificação push:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao enviar notificação' },
      { status: 500 }
    );
  }
}