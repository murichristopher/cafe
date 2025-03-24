"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Função simples para verificar se o usuário está autenticado
export function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        // Verificar se temos dados em cache
        if (typeof window !== "undefined") {
          const cachedUser = localStorage.getItem("cafe_user")
          if (cachedUser) {
            setUser(JSON.parse(cachedUser))
            setLoading(false)
            return
          }
        }

        // Se não temos dados em cache, verificar com o Supabase
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Armazenar no localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("cafe_user", JSON.stringify(user))
          }
          setUser(user)
        }
      } catch (error) {
        console.error("Erro ao obter usuário:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Configurar listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Atualizar cache
        if (typeof window !== "undefined") {
          localStorage.setItem("cafe_user", JSON.stringify(session.user))
        }
        setUser(session.user)
      } else {
        // Limpar cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("cafe_user")
        }
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (data.user) {
      // Armazenar no localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("cafe_user", JSON.stringify(data.user))
      }
    }

    return { data, error }
  }

  const logout = async () => {
    await supabase.auth.signOut()

    // Limpar cache
    if (typeof window !== "undefined") {
      localStorage.removeItem("cafe_user")
    }

    router.push("/login")
  }

  return { user, loading, login, logout }
}

