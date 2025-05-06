"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react"
import { useAuth } from "./auth-context"
import { supabase } from "@/lib/supabase"
import { Notification } from "@/types"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  fetchNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Buscar notificações do usuário
  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Erro ao buscar notificações:", error)
        return
      }

      setNotifications(data as Notification[])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    } finally {
      setLoading(false)
    }
  }

  // Iniciar subscrição para mudanças em tempo real
  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Configurar canal em tempo real para receber notificações
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log("Notification change:", payload)
          fetchNotifications() // Recarregar notificações quando houver mudanças
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Marcar uma notificação como lida
  const markAsRead = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) {
        console.error("Erro ao marcar notificação como lida:", error)
        return
      }

      // Atualizar localmente
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  // Marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error) {
        console.error("Erro ao marcar todas as notificações como lidas:", error)
        return
      }

      // Atualizar localmente
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error)
    }
  }

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        loading, 
        markAsRead, 
        markAllAsRead,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications deve ser usado dentro de um NotificationProvider")
  }
  return context
} 