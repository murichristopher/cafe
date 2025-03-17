"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, AlertCircle, Coffee, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { formatPhoneNumber } from "@/lib/phone-utils"

export default function CompleteProfilePage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user, loading, updatePhoneNumberState } = useAuth()
  const router = useRouter()

  // Verificar se o usuário está logado e redirecionar se necessário
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Usuário não está logado, redirecionar para login
        router.push("/login")
      } else if (user.role !== "fornecedor") {
        // Usuário não é fornecedor, redirecionar para dashboard
        router.push("/dashboard")
      }
    }
  }, [user, loading, router])

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value))
  }

  const updateUserPhoneNumber = async (userId: string, phoneNumber: string) => {
    try {
      console.log("Updating phone number for user:", userId, "to:", phoneNumber)

      // Atualizar na tabela users
      const { error: updateError } = await supabase.from("users").update({ phone_number: phoneNumber }).eq("id", userId)

      if (updateError) {
        console.error("Error updating phone number in users table:", updateError)

        // Tentar usar RPC se a atualização direta falhar
        try {
          const { error: rpcError } = await supabase.rpc("update_user_phone", {
            p_user_id: userId,
            p_phone_number: phoneNumber,
          })

          if (rpcError) {
            console.error("Error calling update_user_phone RPC:", rpcError)
            return false
          }
        } catch (rpcErr) {
          console.error("Failed to call RPC function:", rpcErr)
          return false
        }
      }

      // Atualizar nos metadados do usuário
      const { error: authError } = await supabase.auth.updateUser({
        data: { phone_number: phoneNumber },
      })

      if (authError) {
        console.error("Error updating phone number in auth metadata:", authError)
        return false
      }

      return true
    } catch (error) {
      console.error("Unexpected error updating phone number:", error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Redirecionar imediatamente para o dashboard, independentemente do resultado
    window.location.href = "/dashboard"

    // O código abaixo ainda será executado em segundo plano
    if (isLoading || !user) return

    // Extrair apenas os números do telefone
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, "")

    // Tentar salvar o número de telefone em segundo plano
    updateUserPhoneNumber(user.id, cleanPhoneNumber)
      .then((success) => {
        if (success) {
          // Atualizar o estado no contexto de autenticação
          updatePhoneNumberState(cleanPhoneNumber)
        }
      })
      .catch((error) => {
        console.error("Error updating phone number:", error)
      })
  }

  // Mostrar tela de carregamento enquanto verifica o usuário
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-lg bg-zinc-900 text-white">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <Coffee className="h-10 w-10 text-yellow-400" />
            </div>
            <CardTitle className="text-2xl text-center">Complete seu Perfil</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Precisamos do seu número de telefone para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-800 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    placeholder="(11) 98765-4321"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    required
                    disabled={isLoading}
                    className="bg-zinc-800 border-zinc-700 pl-10"
                  />
                </div>
                <p className="text-xs text-gray-400">Informe um número de celular brasileiro válido com DDD.</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar e Continuar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

