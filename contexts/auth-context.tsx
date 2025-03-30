"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@/types"

type NaiveAuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: any }>
  signOut: () => Promise<void>
  signUp: (
    email: string,
    password: string,
    name: string,
    role: "admin" | "fornecedor",
    phoneNumber?: string,
  ) => Promise<{ success: boolean; error: any }>
  refreshAuth: () => Promise<void>
}

// Chaves para localStorage
const USER_CACHE_KEY = 'cafe_user_cache'
const SESSION_TIMESTAMP_KEY = 'cafe_session_timestamp'
const CACHE_EXPIRY_TIME = 12 * 60 * 60 * 1000 // 12 horas

// Export the context
export const NaiveAuthContext = createContext<NaiveAuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false)
  
  // Função para salvar usuário no cache
  const cacheUser = useCallback((userData: User | null) => {
    if (!userData) {
      localStorage.removeItem(USER_CACHE_KEY)
      localStorage.removeItem(SESSION_TIMESTAMP_KEY)
      return
    }
    
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData))
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString())
  }, [])
  
  // Função para obter usuário do cache
  const getCachedUser = useCallback(() => {
    try {
      const cachedUserJson = localStorage.getItem(USER_CACHE_KEY)
      if (!cachedUserJson) return null
      
      const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY)
      if (!timestamp) return null
      
      // Verificar se o cache expirou
      const elapsed = Date.now() - Number(timestamp)
      if (elapsed > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(USER_CACHE_KEY)
        localStorage.removeItem(SESSION_TIMESTAMP_KEY)
        return null
      }
      
      return JSON.parse(cachedUserJson) as User
    } catch (e) {
      console.error("Erro ao recuperar cache do usuário:", e)
      return null
    }
  }, [])

  // Função para atualizar os dados do usuário
  const updateUserData = useCallback(async (useCache = false) => {
    // Se devemos usar cache e temos um usuário em cache, usamos ele primeiro
    if (useCache) {
      const cachedUser = getCachedUser()
      if (cachedUser) {
        setUser(cachedUser)
        setLoading(false)
        
        // Verificar se o usuário é fornecedor e não tem telefone
        const needsPhone =
          cachedUser.role === "fornecedor" && (!cachedUser.phone_number || cachedUser.phone_number.length < 10)
        setNeedsPhoneNumber(needsPhone)
        
        // Retornamos true para indicar que usamos o cache
        return true
      }
    }
    
    try {
      // Tentativa com timeout para evitar espera infinita
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao recuperar sessão")), 5000)
      })
      
      // Usa race para limitar o tempo de espera
      const { data: { session } } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any
      
      if (!session) {
        setUser(null)
        setLoading(false)
        setNeedsPhoneNumber(false)
        cacheUser(null)
        return false
      }

      const { data: authUser } = await supabase.auth.getUser()

      if (!authUser?.user) {
        setUser(null)
        setLoading(false)
        setNeedsPhoneNumber(false)
        cacheUser(null)
        return false
      }

      // Buscar dados do usuário da tabela users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.user.id)
        .single()

      if (userError || !userData) {
        console.log("Fallback to auth metadata because user data not found in database")
        // Fallback to auth metadata if user data not found in database
        const fallbackUser: User = {
          id: authUser.user.id,
          email: authUser.user.email || "",
          name: authUser.user.user_metadata?.name || authUser.user.email?.split("@")[0] || "Usuário",
          role: authUser.user.user_metadata?.role || "fornecedor",
          phone_number: authUser.user.user_metadata?.phone_number || "",
        }
        setUser(fallbackUser)
        cacheUser(fallbackUser)

        // Verificar se o usuário é fornecedor e não tem telefone
        const needsPhone =
          fallbackUser.role === "fornecedor" && (!fallbackUser.phone_number || fallbackUser.phone_number.length < 10)

        console.log("Setting needsPhoneNumber:", needsPhone, "for user:", fallbackUser)
        setNeedsPhoneNumber(needsPhone)
      } else {
        // Use data from the users table
        setUser(userData as User)
        cacheUser(userData as User)

        // Verificar se o usuário é fornecedor e não tem telefone
        const needsPhone =
          userData.role === "fornecedor" && (!userData.phone_number || userData.phone_number.length < 10)

        console.log("Setting needsPhoneNumber:", needsPhone, "for user:", userData)
        setNeedsPhoneNumber(needsPhone)
      }
      return true
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error)
      
      // Em caso de erro, tentamos usar o cache como fallback
      const cachedUser = getCachedUser()
      if (cachedUser) {
        console.log("Usando cache do usuário como fallback após erro")
        setUser(cachedUser)
        
        const needsPhone =
          cachedUser.role === "fornecedor" && (!cachedUser.phone_number || cachedUser.phone_number.length < 10)
        setNeedsPhoneNumber(needsPhone)
        
        return true
      }
      
      setUser(null)
      setNeedsPhoneNumber(false)
      cacheUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }, [cacheUser, getCachedUser])

  const refreshAuth = useCallback(async () => {
    // Primeiro verificamos se já temos um usuário em cache
    // Se tivermos, usamos ele para evitar o loading state
    const useCache = true
    const usedCache = await updateUserData(useCache)
    
    if (!usedCache) {
      setLoading(true)
    }
    
    try {
      // Tentamos atualizar a sessão em segundo plano
      await supabase.auth.refreshSession()
      
      // Atualizamos os dados do usuário sem usar cache
      await updateUserData(false)
      
      console.log("Sessão atualizada com sucesso")
    } catch (error) {
      console.error("Erro ao atualizar sessão:", error)
      
      // Se falhar a atualização mas temos um usuário em cache, continuamos com ele
      if (user) {
        console.log("Mantendo usuário do cache após falha na atualização")
      } else {
        // Tentamos usar cache como última opção
        await updateUserData(true)
      }
    } finally {
      setLoading(false)
    }
  }, [updateUserData, user])

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      // Primeira tentativa: usar o cache
      const usedCache = await updateUserData(true)
      
      // Se não houver cache, só então fazemos a chamada ao Supabase
      if (!usedCache) {
        try {
          await updateUserData(false)
        } catch (error) {
          console.error("Erro ao verificar autenticação:", error)
          setUser(null)
          setNeedsPhoneNumber(false)
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Configurar listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        cacheUser(null)
        setUser(null)
        setNeedsPhoneNumber(false)
      } else if (event === 'SIGNED_IN') {
        await updateUserData(false)
      }
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [updateUserData, cacheUser])

  // Handler para verificar se temos que atualizar ao retornar à aba
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user) {
        // Não atualiza na hora, aguarda a primeira interação
        localStorage.setItem('should_refresh_on_interaction', 'true')
      }
    }
    
    // Este handler só faz algo se tivermos um usuário
    if (typeof window !== 'undefined' && user) {
      document.addEventListener('visibilitychange', handleVisibility)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility)
      }
    }
  }, [user])
  
  // Handler para atualizar ao interagir com a página (clique ou tecla)
  useEffect(() => {
    const handleInteraction = () => {
      // O refreshAuth só será chamado uma vez por sessão
      if (localStorage.getItem('should_refresh_on_interaction') === 'true') {
        localStorage.removeItem('should_refresh_on_interaction')
        
        // Atrasa o refresh para evitar interferir com a interação do usuário
        setTimeout(() => {
          refreshAuth()
        }, 500)
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleInteraction, { once: true })
      window.addEventListener('keydown', handleInteraction, { once: true })
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', handleInteraction)
        window.removeEventListener('keydown', handleInteraction)
      }
    }
  }, [refreshAuth])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)

      // Use Supabase authentication for all users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Erro de login:", error)
        return { success: false, error }
      }

      // Atualizar dados do usuário
      await updateUserData(false)

      return {
        success: true,
        error: null,
        needsPhoneNumber,
      }
    } catch (error) {
      console.error("Erro inesperado no login:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear cached user
      cacheUser(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: "admin" | "fornecedor",
    phoneNumber?: string,
  ) => {
    try {
      setLoading(true)

      // Register user in Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            phone_number: phoneNumber || "",
          },
        },
      })

      if (error) {
        console.error("Registration error:", error)
        return { success: false, error }
      }

      // Insert into users table
      if (data.user) {
        try {
          await supabase.from("users").insert([
            {
              id: data.user.id,
              email,
              name,
              role,
              phone_number: phoneNumber || "",
            },
          ])
        } catch (insertErr) {
          console.error("Error inserting user:", insertErr)
          return { success: false, error: insertErr }
        }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Unexpected registration error:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  return (
    <NaiveAuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        signUp,
        refreshAuth
      }}
    >
      {children}
    </NaiveAuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(NaiveAuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}