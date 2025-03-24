"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@/types"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: any; needsPhoneNumber?: boolean }>
  signUp: (
    email: string,
    password: string,
    name: string,
    role: "admin" | "fornecedor",
    phoneNumber?: string,
  ) => Promise<{ success: boolean; error: any }>
  signOut: () => Promise<void>
  needsPhoneNumber: boolean
  updatePhoneNumberState: (phoneNumber: string) => Promise<void> // Adicione esta linha
}

// Export the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false)

  // Função para buscar e atualizar os dados do usuário
  const updateUserData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setUser(null)
        setLoading(false)
        setNeedsPhoneNumber(false)
        return
      }

      const { data: authUser } = await supabase.auth.getUser()

      if (!authUser?.user) {
        setUser(null)
        setLoading(false)
        setNeedsPhoneNumber(false)
        return
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

        // Verificar se o usuário é fornecedor e não tem telefone
        const needsPhone =
          fallbackUser.role === "fornecedor" && (!fallbackUser.phone_number || fallbackUser.phone_number.length < 10)

        console.log("Setting needsPhoneNumber:", needsPhone, "for user:", fallbackUser)
        setNeedsPhoneNumber(needsPhone)
      } else {
        // Use data from the users table
        setUser(userData as User)

        // Verificar se o usuário é fornecedor e não tem telefone
        const needsPhone =
          userData.role === "fornecedor" && (!userData.phone_number || userData.phone_number.length < 10)

        console.log("Setting needsPhoneNumber:", needsPhone, "for user:", userData)
        setNeedsPhoneNumber(needsPhone)
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error)
      setUser(null)
      setNeedsPhoneNumber(false)
    } finally {
      setLoading(false)
    }
  }

  // Verificar autenticação ao carregar
  useEffect(() => {
    updateUserData()

    // Configurar listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await updateUserData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Função de login simplificada - SEM REDIRECIONAMENTO
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Erro de login:", error)
        return { success: false, error }
      }

      // Atualizar dados do usuário
      await updateUserData()

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

  // Função de registro simplificada - SEM REDIRECIONAMENTO
  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: "admin" | "fornecedor",
    phoneNumber?: string,
  ) => {
    try {
      setLoading(true)

      // Registrar usuário no Auth
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
        console.error("Erro de registro:", error)
        return { success: false, error }
      }

      // Inserir na tabela users
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
          console.error("Erro ao inserir usuário:", insertErr)
        }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error("Erro inesperado no registro:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  // Atualizar a função signOut para garantir que ela limpe corretamente a sessão
  const signOut = async () => {
    try {
      setLoading(true)
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Erro ao fazer logout:", error)
        throw error
      }

      // Limpar o estado do usuário
      setUser(null)
      setNeedsPhoneNumber(false)

      return { success: true, error: null }
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  // Função para atualizar o estado após salvar o número de telefone
  const updatePhoneNumberState = async (phoneNumber: string) => {
    if (user) {
      // Atualizar o estado do usuário com o novo número de telefone
      setUser({
        ...user,
        phone_number: phoneNumber,
      })

      // Atualizar a flag needsPhoneNumber
      setNeedsPhoneNumber(false)

      // Forçar uma atualização completa dos dados do usuário
      await updateUserData()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        needsPhoneNumber,
        updatePhoneNumberState, // Adicione esta linha
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Export the hook
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}

