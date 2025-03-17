"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, AlertCircle, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "fornecedor">("admin")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { signUp, user } = useAuth()
  const router = useRouter()

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isLoading) return

    setIsLoading(true)

    try {
      const { success, error } = await signUp(email, password, name, role)

      if (!success) {
        setError(error?.message || "Ocorreu um erro ao criar a conta. Tente novamente.")
        toast({
          title: "Erro ao criar conta",
          description: error?.message || "Ocorreu um erro ao criar a conta. Tente novamente.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Conta criada com sucesso",
          description:
            role === "fornecedor"
              ? "Você já pode fazer login no sistema. Você precisará adicionar seu telefone após o login."
              : "Você já pode fazer login no sistema.",
        })
        // Redirecionar para o login após registro bem-sucedido
        router.push("/login")
      }
    } catch (error: any) {
      setError(error?.message || "Ocorreu um erro inesperado. Tente novamente.")
      toast({
        title: "Erro ao criar conta",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
            <CardTitle className="text-2xl text-center">Criar Conta</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Preencha os dados abaixo para criar sua conta
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
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as "admin" | "fornecedor")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin">Administrador</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fornecedor" id="fornecedor" />
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                  </div>
                </RadioGroup>
              </div>
              {role === "fornecedor" && (
                <Alert className="bg-blue-900/20 border-blue-800 text-blue-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Fornecedores precisarão adicionar um número de telefone após o login.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-400">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-yellow-400 hover:underline">
                Faça login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

