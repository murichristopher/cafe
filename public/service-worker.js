// Service Worker Unificado - Gerencia notificações push e cache offline
const CACHE_NAME = "eleve-cafe-v1";
const OFFLINE_URL = "/offline.html";

// Evento de instalação
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalado com sucesso');
  
  // Fazer cache de arquivos essenciais
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching offline page');
        return cache.add(OFFLINE_URL);
      }),
      self.skipWaiting(), // Ativa o service worker imediatamente
    ])
  );
});

// Evento de ativação
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado com sucesso');
  
  // Limpar caches antigos
  event.waitUntil(
    Promise.all([
      caches.keys().then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[Service Worker] Removendo cache antigo:', key);
              return caches.delete(key);
            }
          })
        );
      }),
      self.clients.claim(), // Toma controle de todos os clientes imediatamente
    ])
  );
});

// Lidar com notificações push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notificação push recebida');
  
  if (!event.data) {
    console.log('[Service Worker] Notificação push sem dados');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Dados da notificação:', data);

    const title = data.title || 'Eleve Café & Cia';
    const options = {
      body: data.message || 'Você tem uma nova notificação',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'Ver detalhes'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Erro ao processar notificação push:', error);
  }
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada', event);
  
  event.notification.close();
  
  const eventId = event.notification.data?.eventId;
  const clickAction = event.action;
  
  // Abrir uma janela específica quando a notificação for clicada
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se já houver uma janela aberta, navegue para a página do evento
      for (const client of clientList) {
        if (eventId && client.url.includes('/dashboard')) {
          let targetUrl = '/dashboard/events';
          
          if (eventId) {
            targetUrl = `/dashboard/events/${eventId}`;
          }
          
          console.log('[Service Worker] Navegando para:', targetUrl);
          return client.navigate(targetUrl);
        }
      }
      
      // Se não houver janela aberta, abra uma nova
      if (eventId) {
        console.log('[Service Worker] Abrindo nova janela para evento:', eventId);
        return clients.openWindow(`/dashboard/events/${eventId}`);
      }
      
      console.log('[Service Worker] Abrindo nova janela para lista de eventos');
      return clients.openWindow('/dashboard/events');
    })
  );
});

// Lidar com requisições de rede
self.addEventListener('fetch', (event) => {
  // Não interceptar requisições para API ou autenticação
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/auth/') ||
      event.request.url.includes('/supabase/')) {
    return;
  }
  
  // Para navegação, usar estratégia de network-first com fallback para offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.log('[Service Worker] Falha de rede, retornando página offline');
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // Para outros recursos, tentar rede primeiro, depois cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        console.log('[Service Worker] Falha de rede para:', event.request.url);
        return caches.match(event.request);
      })
  );
});

// Receber mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensagem recebida:', event.data);
  
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});