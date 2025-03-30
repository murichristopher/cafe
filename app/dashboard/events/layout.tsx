"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
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

  return (
    <>{children}</>
  )
} 