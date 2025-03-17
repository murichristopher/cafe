"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function ProfileCheck() {
  const { user, loading, needsPhoneNumber } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Adicionar console.log para debug
    console.log("ProfileCheck:", { user, loading, needsPhoneNumber })

    if (!loading && user && needsPhoneNumber) {
      console.log("Redirecionando para /complete-profile")
      router.push("/complete-profile")
    }
  }, [user, loading, needsPhoneNumber, router])

  return null
}

