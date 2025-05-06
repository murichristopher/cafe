'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Chave pública VAPID para web push (deve ser definida nas variáveis de ambiente)
const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function PushNotificationManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Verificar suporte a notificações push
  useEffect(() => {
    const checkSupport = async () => {
      if (!window.Notification || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Notificações push não são suportadas neste navegador');
        setSupported(false);
        return;
      }

      if (!PUBLIC_VAPID_KEY) {
        console.error('Chave VAPID pública não configurada');
        setErrorMessage('Configuração de notificação incompleta (VAPID)');
        setSupported(false);
        return;
      }

      // Verificar permissão atual
      const currentPermission = Notification.permission;
      console.log(`Permissão atual para notificações: ${currentPermission}`);
      setPermission(currentPermission);
      
      // Verificar se já está inscrito
      try {
        // Primeiro, verificar se há um service worker registrado
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        if (registrations.length === 0) {
          console.log('Nenhum service worker registrado ainda');
          return;
        }
        
        // Usar o service worker existente
        for (const registration of registrations) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            console.log('Subscription encontrada:', subscription.endpoint.substring(0, 30) + '...');
            setIsSubscribed(true);
            return;
          }
        }
        
        console.log('Nenhuma subscription encontrada nos service workers registrados');
      } catch (error) {
        console.error('Erro ao verificar inscrição push:', error);
      }
    }

    checkSupport()
  }, [])

  // Salvar a inscrição push no Supabase
  const saveSubscription = async (subscription: PushSubscription) => {
    if (!user) return false

    try {
      console.log('Salvando subscription no banco de dados para o usuário:', user.id);
      console.log('Dados da subscription:', JSON.stringify(subscription));
      
      const { error } = await supabase
        .from('users')
        .update({
          push_subscription: subscription
        })
        .eq('id', user.id)

      if (error) {
        console.error('Erro ao salvar inscrição push:', error)
        return false
      }
      
      console.log('Subscription salva com sucesso');
      return true
    } catch (error) {
      console.error('Erro ao salvar inscrição push:', error)
      return false
    }
  }

  // Cancelar a inscrição de notificações push
  const unsubscribeFromPush = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('Iniciando processo de cancelamento de notificações push');
      
      // Obter o service worker e cancelar a inscrição
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        throw new Error('Nenhum service worker registrado');
      }
      
      let unsubscribeSuccessful = false;
      
      for (const registration of registrations) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          unsubscribeSuccessful = true;
          console.log('Unsubscribe realizado com sucesso');
          break;
        }
      }
      
      if (!unsubscribeSuccessful) {
        console.log('Nenhuma subscription encontrada para cancelar');
      }
      
      // Atualizar o banco de dados de qualquer forma
      console.log('Atualizando dados do usuário para remover subscription');
      const { error } = await supabase
        .from('users')
        .update({
          push_subscription: null
        })
        .eq('id', user.id)
        
      if (error) {
        console.error('Erro ao atualizar banco de dados:', error);
        throw new Error('Erro ao atualizar banco de dados');
      }
      
      setIsSubscribed(false)
      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais notificações push deste site.'
      })
      console.log('Processo de cancelamento concluído com sucesso');
    } catch (error) {
      console.error('Erro ao cancelar inscrição push:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível desativar as notificações push.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Solicitar permissão e se inscrever para notificações push
  const subscribeToPush = async () => {
    if (!user || !supported) return

    try {
      setLoading(true)
      setErrorMessage(null);
      console.log('Iniciando processo de registro de notificações push');
      
      // Verificar se já existe um service worker registrado
      let serviceWorkerRegistration = null;
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length > 0) {
        console.log(`Encontrados ${registrations.length} service workers registrados`);
        serviceWorkerRegistration = registrations[0];
      } else {
        console.log('Nenhum service worker encontrado, registrando novo...');
        
        try {
          // Registrar service worker
          serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service worker registrado com sucesso');
          
          // Aguardar até que o service worker esteja ativo
          if (serviceWorkerRegistration.installing) {
            console.log('Service worker está sendo instalado, aguardando ativação...');
            
            // Adicionar um timeout para evitar espera infinita
            const swActive = await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Timeout ao aguardar ativação do service worker'));
              }, 10000); // 10 segundos de timeout
              
              serviceWorkerRegistration.installing.addEventListener('statechange', (e) => {
                if ((e.target as any).state === 'activated') {
                  clearTimeout(timeout);
                  resolve(true);
                }
              });
            });
            
            console.log('Service worker ativado:', swActive);
          }
        } catch (error) {
          console.error('Erro ao registrar service worker:', error);
          throw new Error(`Falha ao registrar service worker: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }
      
      if (!serviceWorkerRegistration) {
        throw new Error('Não foi possível obter um service worker');
      }
      
      // Solicitar permissão, se ainda não concedida
      if (Notification.permission !== 'granted') {
        console.log('Solicitando permissão para notificações...');
        const permissionResult = await Notification.requestPermission();
        console.log(`Resultado da solicitação de permissão: ${permissionResult}`);
        setPermission(permissionResult);
        
        if (permissionResult !== 'granted') {
          throw new Error('Permissão para notificações não foi concedida');
        }
      }
      
      // Verificar se já existe uma subscription
      const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription();
      
      if (existingSubscription) {
        console.log('Encontrada subscription existente');
        // Já existe uma inscrição, verificar se está salva no banco
        const saved = await saveSubscription(existingSubscription);
        if (saved) {
          setIsSubscribed(true);
          toast({
            title: 'Notificações ativadas',
            description: 'Você receberá notificações push quando for escalado para eventos.'
          });
          return;
        } else {
          console.log('Falha ao salvar subscription existente, tentando criar nova...');
        }
      }
      
      console.log('Criando nova subscription...');
      console.log('Usando chave VAPID:', PUBLIC_VAPID_KEY.substring(0, 10) + '...');
      
      try {
        // Converter a chave VAPID para o formato correto
        const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
        
        // Criar nova inscrição
        const subscription = await serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
        
        console.log('Subscription criada com sucesso:', subscription.endpoint.substring(0, 30) + '...');
        
        // Salvar no banco de dados
        const saved = await saveSubscription(subscription);
        
        if (saved) {
          setIsSubscribed(true);
          toast({
            title: 'Notificações ativadas',
            description: 'Você receberá notificações push quando for escalado para eventos.'
          });
          console.log('Processo de registro concluído com sucesso');
        } else {
          throw new Error('Falha ao salvar a inscrição no banco de dados');
        }
      } catch (subscriptionError) {
        console.error('Erro ao criar subscription:', subscriptionError);
        throw new Error(`Falha ao criar subscription: ${subscriptionError instanceof Error ? subscriptionError.message : 'Erro desconhecido'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao se inscrever para notificações push:', error);
      setErrorMessage(errorMsg);
      toast({
        title: 'Erro',
        description: `Não foi possível ativar as notificações: ${errorMsg}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  // Se não houver usuário logado ou notificações não forem suportadas, não mostrar nada
  if (!user) return null;

  if (!supported) {
    return (
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 mb-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Bell className="h-10 w-10 text-yellow-400" />
          <h3 className="text-lg font-medium">Notificações de Eventos</h3>
          <p className="text-sm text-red-400">
            {errorMessage || "Seu navegador não suporta notificações push."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 mb-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Bell className="h-10 w-10 text-yellow-400" />
        <h3 className="text-lg font-medium">Notificações de Eventos</h3>
        
        {isSubscribed ? (
          <>
            <p className="text-sm text-gray-400">
              Você está recebendo notificações quando for escalado para eventos.
            </p>
            <Button
              variant="outline"
              onClick={unsubscribeFromPush}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processando..." : "Desativar Notificações"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-400">
              Receba notificações no seu dispositivo quando for escalado para eventos.
            </p>
            {errorMessage && (
              <p className="text-xs text-red-400 mt-0">
                Erro: {errorMessage}
              </p>
            )}
            <Button
              onClick={subscribeToPush}
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              {loading ? "Processando..." : "Ativar Notificações"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// Utilitário para converter a chave VAPID de base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  } catch (error) {
    console.error('Erro ao converter chave VAPID:', error);
    throw new Error('Chave VAPID inválida');
  }
} 