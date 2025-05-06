"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, LogOut, Menu, User, RefreshCw, Check, CheckCheck, Calendar, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notification-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarContent } from "@/components/sidebar"
import Image from "next/image"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"

export function Navbar() {
  const { signOut, user } = useAuth()
  const notificationsContext = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  // Estados locais para notificações (implementação direta)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pulseAnimation, setPulseAnimation] = useState(false)

  // Buscar notificações diretamente do banco
  const fetchNotificationsDirectly = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      console.log("Buscando notificações diretamente...")
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Erro ao buscar notificações diretas:", error)
        return
      }

      console.log(`Encontradas ${data.length} notificações diretas`)
      setNotifications(data || [])
      
      const newUnreadCount = data?.filter(n => !n.read).length || 0
      
      // Se chegou uma nova notificação não lida, ativar animação
      if (newUnreadCount > unreadCount) {
        setPulseAnimation(true)
        setTimeout(() => setPulseAnimation(false), 3000)
      }
      
      setUnreadCount(newUnreadCount)
    } catch (error) {
      console.error("Erro ao buscar notificações diretas:", error)
    } finally {
      setLoading(false)
    }
  }

  // Efeito para buscar notificações periodicamente
  useEffect(() => {
    if (!user) return

    // Buscar notificações imediatamente
    fetchNotificationsDirectly()

    // Configurar intervalo para buscar notificações a cada 10 segundos
    const interval = setInterval(fetchNotificationsDirectly, 10000)

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
          console.log("Mudança na notificação detectada:", payload)
          fetchNotificationsDirectly()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [user])

  // Atualizar a função handleSignOut para garantir que ela funcione corretamente
  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirecionar para a página inicial após logout
      router.push("/")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  // Marcar uma notificação como lida
  const markAsRead = async (id) => {
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

  const handleNotificationClick = async (id, eventId) => {
    await markAsRead(id)
    if (eventId) {
      router.push(`/dashboard/events/${eventId}`)
    }
  }

  const formatCreatedAt = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true,
        locale: ptBR 
      })
    } catch (e) {
      return "data desconhecida"
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_assignment':
        return <Calendar className="h-5 w-5 text-yellow-400" />
      case 'reminder':
        return <Clock className="h-5 w-5 text-blue-400" />
      case 'update':
        return <RefreshCw className="h-5 w-5 text-green-400" />
      default:
        return <Bell className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <header className="border-b border-zinc-800 bg-[#111111] text-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:text-yellow-400">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-zinc-900">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-nklcjetorMW8G4rLEz3oeIycg3uHlQ.png"
              alt="Eleve Café & Cia"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-lg font-semibold hidden md:inline-block">{user?.name || "Eleve Café & Cia"}</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchNotificationsDirectly}
            className="hover:text-yellow-400"
          >
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Atualizar notificações</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={unreadCount > 0 ? "default" : "ghost"} 
                size="icon" 
                className={`relative ${unreadCount > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'hover:text-yellow-400'} ${pulseAnimation ? 'animate-pulse' : ''}`}
              >
                <Bell className="h-5 w-5" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-2">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="h-8 text-xs"
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  // Esqueleto de carregamento
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`flex cursor-pointer items-start gap-4 p-4 ${
                        notification.read ? 'opacity-70' : 'bg-zinc-800/50'
                      } hover:bg-zinc-800`}
                      onClick={() => handleNotificationClick(notification.id, notification.event_id)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCreatedAt(notification.created_at)}
                          {!notification.read && (
                            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
                          )}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 flex-none rounded-full hover:bg-zinc-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Marcar como lida</span>
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:text-yellow-400">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

