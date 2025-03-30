"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ProfileCheck } from "@/components/ProfileCheck" // Importar o ProfileCheck

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // // Efeito simples para redirecionar se não estiver logado
  // useEffect(() => {
  //   // Só verificamos após o carregamento inicial para evitar flashes
  //   if (!loading && !user) {
  //     router.push("/login")
  //   }
  // }, [user, loading, router])

  // // Mostrar loading enquanto verifica autenticação
  // if (loading) {
  //   return <LoadingSpinner message="Verificando autenticação..." />
  // }

  // // // Se não estiver logado, não renderiza nada (o redirecionamento acontecerá pelo useEffect)
  // if (!user) {
  //   router.push("/login")
  // }

  // Verificar se precisamos forçar o recarregamento da página
  useEffect(() => {
    const shouldReload = localStorage.getItem('forceReload')
    
    if (shouldReload === 'true') {
      // Limpar o flag para evitar loops de recarregamento
      localStorage.removeItem('forceReload')
      
      // Usar setTimeout para garantir que o localStorage seja limpo antes do reload
      setTimeout(() => {
        console.log("Forçando recarregamento completo da página para evitar problemas de estado")
        window.location.reload()
      }, 100)
    }
  }, [pathname])

  // Se estiver logado, renderiza o layout normalmente
  return (
    <div className="flex h-screen bg-[#111111]">
      {/* Adicionar o ProfileCheck para verificar se o usuário precisa completar o perfil */}
      <ProfileCheck />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6 bg-[#111111]">{children}</main>
        <MobileNav />
      </div>
    </div>
  )
}

