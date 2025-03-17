"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirecionar para o dashboard se já estiver logado
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (loading) {
    return <LoadingSpinner message="Carregando..." />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-4">
      <h1 className="mb-6 text-4xl font-bold text-white">Eleve Café & Cia</h1>
      <p className="mb-8 text-center text-xl text-gray-300">Sistema de Gestão de Eventos</p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">Entrar</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">
            Criar Conta
          </Button>
        </Link>
      </div>
    </div>
  )
}

