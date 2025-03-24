"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/auth"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
      </div>
    )
  }

  return user ? <>{children}</> : null
}

