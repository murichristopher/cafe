"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
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
}

// Export the context
export const NaiveAuthContext = createContext<NaiveAuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false)

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

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('cachedUser')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserFromStorage()
  }, [])

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

  const signOut = async () => {
    try {
      setLoading(true)

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear cached user
      localStorage.removeItem('cachedUser')
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
      }}
    >
      {children}
    </NaiveAuthContext.Provider>
  )
}

// Export the hook
export function useAuth() {
  const context = useContext(NaiveAuthContext)

  if (context === undefined) {
    throw new Error("useNaive must be used within a NaiveAuthProvider")
  }

  return context
}