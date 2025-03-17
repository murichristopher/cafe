"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { User } from "@/types"
import { FornecedorManagement } from "@/components/fornecedor-management"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function FornecedoresPage() {
  const { user } = useAuth()
  const [fornecedores, setFornecedores] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFornecedores = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("users").select("*").eq("role", "fornecedor").order("name")

      if (error) {
        throw error
      }

      setFornecedores(data || [])
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      fetchFornecedores()
    }
  }, [user])

  if (user?.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fornecedores</h1>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <FornecedorManagement fornecedores={fornecedores} onUpdate={fetchFornecedores} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

