"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Coffee } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ConfirmResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Verificar se há uma sessão válida para redefinição de senha
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Recuperar o token do URL (hash)
      const hash = window.location.hash
      const accessToken = hash && hash.includes("access_token") ? 
        new URLSearchParams(hash.substring(1)).get("access_token") : null
      
      if (!session && !accessToken) {
        setError("Sessão inválida ou expirada. Por favor, solicite um novo link de redefinição de senha.")
      }
    }
    
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação
    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    
    try {
      // Atualizar a senha
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) {
        console.error("Erro ao redefinir senha:", error)
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro ao redefinir a senha",
          variant: "destructive",
        })
      } else {
        setPasswordUpdated(true)
        toast({
          title: "Senha redefinida",
          description: "Sua senha foi alterada com sucesso",
        })
        
        // Limpar os campos
        setPassword("")
        setConfirmPassword("")
        
        // Aguardar 3 segundos antes de redirecionar
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (error: any) {
      console.error("Erro inesperado:", error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Coffee className="h-10 w-10 text-yellow-400" />
          </div>
          <CardTitle className="text-2xl text-center">Redefinir Senha</CardTitle>
          <CardDescription className="text-center text-gray-400">
            {passwordUpdated 
              ? "Sua senha foi redefinida com sucesso" 
              : "Digite e confirme sua nova senha"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error ? (
            <div className="text-center space-y-4">
              <div className="text-red-500 font-medium">{error}</div>
              <Button 
                asChild
                className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                <Link href="/reset-password">
                  Solicitar novo link
                </Link>
              </Button>
            </div>
          ) : passwordUpdated ? (
            <div className="text-center space-y-4">
              <div className="text-green-500 font-medium">Senha atualizada com sucesso!</div>
              <p className="text-sm text-gray-400">
                Você será redirecionado para a página de login em alguns segundos...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Digite sua nova senha"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Confirme sua nova senha"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo senha...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        
        {!error && !passwordUpdated && (
          <CardFooter className="border-t border-zinc-800 pt-4 flex justify-center">
            <Link 
              href="/login" 
              className="text-sm text-gray-400 hover:text-yellow-400 transition-colors"
            >
              Voltar para login
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
} 