"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

export default function TestPasswordPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTest = async () => {
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Email e senha são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/auth/test-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Login bem-sucedido com as credenciais fornecidas",
        })
      } else {
        toast({
          title: "Falha",
          description: data.error || "Credenciais inválidas",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setResult({ error: error.message })
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao testar o login",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Testar Credenciais</h1>
      <p className="mb-4 text-gray-400">
        Esta página permite testar se um email e senha são válidos para login no sistema.
        Use-a para verificar se a alteração de senha de um fornecedor funcionou corretamente.
      </p>

      <Card className="bg-[#1a1a1a] border-zinc-800 max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Teste de Credenciais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="fornecedor@exemplo.com"
                className="bg-[#111] border-zinc-700"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="bg-[#111] border-zinc-700"
              />
            </div>
            <Button 
              onClick={handleTest} 
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 mt-2"
            >
              {loading ? "Testando..." : "Testar Login"}
            </Button>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Resultado do Teste:</h3>
              <pre className="bg-[#111] p-4 rounded border border-zinc-700 overflow-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 