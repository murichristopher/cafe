"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function ProfileCheck() {
  const { user, loading, needsPhoneNumber } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && needsPhoneNumber) {
      router.push("/complete-profile")
    }
  }, [user, loading, needsPhoneNumber, router])

  return null
}

