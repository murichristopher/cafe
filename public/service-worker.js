// Service Worker para gerenciar notificações push
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  return self.clients.claim();
});

// Lidar com notificações push
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Recebida notificação push sem dados');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Notificação push recebida:', data);

    const title = data.title || 'Eleve Café & Cia';
    const options = {
      body: data.message || 'Você tem uma nova notificação',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png',
      vibrate: [100, 50, 100],
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Erro ao processar notificação push:', error);
  }
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada', event);
  
  event.notification.close();
  
  const eventId = event.notification.data?.eventId;
  
  // Abrir uma janela específica quando a notificação for clicada
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se já houver uma janela aberta, navegue para a página do evento
      for (const client of clientList) {
        if (eventId && 'navigate' in client) {
          return client.navigate(`/dashboard/events/${eventId}`);
        }
        return client.navigate('/dashboard/events');
      }
      
      // Se não houver janela aberta, abra uma nova
      if (eventId) {
        return clients.openWindow(`/dashboard/events/${eventId}`);
      }
      return clients.openWindow('/dashboard/events');
    })
  );
});

self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url);
  event.respondWith(fetch(event.request));
});