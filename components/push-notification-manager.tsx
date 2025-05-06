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

  // Verificar suporte a notificações push
  useEffect(() => {
    const checkSupport = async () => {
      if (!window.Notification || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setSupported(false)
        return
      }

      // Verificar permissão atual
      setPermission(Notification.permission)
      
      // Verificar se já está inscrito
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Erro ao verificar inscrição push:', error)
      }
    }

    checkSupport()
  }, [])

  // Salvar a inscrição push no Supabase
  const saveSubscription = async (subscription: PushSubscription) => {
    if (!user) return false

    try {
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
      
      // Obter o service worker e cancelar a inscrição
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
      }
      
      // Atualizar o banco de dados
      const { error } = await supabase
        .from('users')
        .update({
          push_subscription: null
        })
        .eq('id', user.id)
        
      if (error) {
        throw new Error('Erro ao atualizar banco de dados')
      }
      
      setIsSubscribed(false)
      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais notificações push deste site.'
      })
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
      
      // Solicitar permissão, se ainda não concedida
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        setPermission(permission)
        
        if (permission !== 'granted') {
          throw new Error('Permissão de notificação não concedida')
        }
      }
      
      // Registrar o service worker se não estiver registrado
      let serviceWorkerRegistration
      try {
        serviceWorkerRegistration = await navigator.serviceWorker.ready
      } catch (error) {
        // Se o service worker não estiver registrado, registrá-lo
        serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js')
      }
      
      // Criar a inscrição push
      const existingSubscription = await serviceWorkerRegistration.pushManager.getSubscription()
      
      if (existingSubscription) {
        // Já existe uma inscrição, verificar se está salva no banco
        const saved = await saveSubscription(existingSubscription)
        if (saved) {
          setIsSubscribed(true)
          toast({
            title: 'Notificações ativadas',
            description: 'Você receberá notificações push quando for escalado para eventos.'
          })
          return
        }
      }
      
      // Criar nova inscrição
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      })
      
      // Salvar no banco de dados
      const saved = await saveSubscription(subscription)
      
      if (saved) {
        setIsSubscribed(true)
        toast({
          title: 'Notificações ativadas',
          description: 'Você receberá notificações push quando for escalado para eventos.'
        })
      } else {
        throw new Error('Falha ao salvar inscrição')
      }
    } catch (error) {
      console.error('Erro ao se inscrever para notificações push:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar as notificações push.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Se não houver usuário logado ou notificações não forem suportadas, não mostrar nada
  if (!user || !supported) return null

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
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
} 