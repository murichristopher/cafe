"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { refreshSession } from "@/lib/supabase"

// Chaves para o localStorage
const AUTH_CACHE_KEY = "cafe_auth_cache"
const AUTH_TIMESTAMP_KEY = "cafe_auth_timestamp"
// Tempo de expiração do cache em milissegundos (8 horas)
const CACHE_EXPIRY_TIME = 8 * 60 * 60 * 1000

export function useAuth() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastActive, setLastActive] = useState<number>(Date.now())

  // Função para verificar se o cache está válido
  const isCacheValid = () => {
    const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY)
    if (!timestamp) return false

    const elapsed = Date.now() - Number.parseInt(timestamp)
    return elapsed < CACHE_EXPIRY_TIME
  }

  // Função para salvar o usuário no cache
  const cacheUser = (userData: any) => {
    if (!userData) {
      localStorage.removeItem(AUTH_CACHE_KEY)
      localStorage.removeItem(AUTH_TIMESTAMP_KEY)
      return
    }

    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(userData))
    localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString())
  }

  // Função para obter o usuário do cache
  const getCachedUser = () => {
    if (!isCacheValid()) {
      localStorage.removeItem(AUTH_CACHE_KEY)
      localStorage.removeItem(AUTH_TIMESTAMP_KEY)
      return null
    }

    const cachedUser = localStorage.getItem(AUTH_CACHE_KEY)
    return cachedUser ? JSON.parse(cachedUser) : null
  }

  // Função para fazer login
  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Salva o usuário no cache
      cacheUser(data.user)
      setUser(data.user)
      setLastActive(Date.now())
      router.refresh()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Função para fazer logout
  const logout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      // Limpa o cache
      cacheUser(null)
      setUser(null)
      router.refresh()
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para verificar e atualizar sessão
  const checkAndUpdateSession = async () => {
    setLoading(true)
    try {
      // Primeiro, tenta renovar a sessão
      const sessionRefreshed = await refreshSession()
      
      if (!sessionRefreshed) {
        // Se não conseguiu renovar, tenta obter a sessão atual
        const { data } = await supabase.auth.getSession()
        
        if (!data.session) {
          // Se não houver sessão válida, limpa o estado
          cacheUser(null)
          setUser(null)
          setLoading(false)
          return false
        }
      }
      
      // Busca os dados atualizados do usuário
      const { data: userData } = await supabase.auth.getUser()
      
      if (userData?.user) {
        cacheUser(userData.user)
        setUser(userData.user)
        setLastActive(Date.now())
        return true
      }
      
      return false
    } catch (error) {
      console.error("Erro ao verificar sessão:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Verifica o estado de autenticação ao carregar o componente
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)

      // Primeiro, verifica se há um usuário no cache
      const cachedUser = getCachedUser()
      if (cachedUser) {
        setUser(cachedUser)
        setLastActive(Date.now())
        setLoading(false)
        return
      }

      // Se não houver cache válido, verifica com o Supabase
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        // Atualiza o cache com o usuário atual
        cacheUser(data.session.user)
        setUser(data.session.user)
        setLastActive(Date.now())
      }

      setLoading(false)
    }

    // Handler para quando o usuário retorna à aba
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log("Aba visível novamente, verificando sessão...")
        
        // Verifica se passaram mais de 2 minutos desde a última atividade
        const inactiveTime = Date.now() - lastActive
        if (inactiveTime > 120000) { // 2 minutos
          console.log("Usuário inativo por mais de 2 minutos, renovando sessão...")
          await checkAndUpdateSession()
        } else {
          setLastActive(Date.now())
        }
      }
    }

    // Configura um listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        cacheUser(session.user)
        setUser(session.user)
        setLastActive(Date.now())
      } else if (event === "SIGNED_OUT") {
        cacheUser(null)
        setUser(null)
      }
    })

    // Adiciona o listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange)

    checkAuth()

    // Limpa os listeners ao desmontar o componente
    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase, router, lastActive])

  return { user, loading, login, logout, checkAndUpdateSession }
}

