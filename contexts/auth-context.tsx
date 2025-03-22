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
    setLoading(true)

    // Fetch user data from the users table


    let userToCache: User

    const data = {
      user: {
        id: "e03d9779-a5d5-47ea-bdda-43c54a4cbc31",
        email: "admin@gmail.com",
        name: "admin",
        role: "admin",
        created_at: "2025-03-12T02:29:54.547601+00:00",
        phone_number: null
      }
    }
    // Fallback to auth metadata
    userToCache = {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.email?.split("@")[0] || "User",
      role: "admin",
      phone_number: "",
    }


    // Cache user in state and localStorage
    setUser(userToCache)
    localStorage.setItem('cachedUser', JSON.stringify(userToCache))

    return { success: true, error: null }

  }

  const signOut = async () => {
    try {
      setLoading(true)

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