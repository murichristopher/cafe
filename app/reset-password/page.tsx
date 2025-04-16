"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Coffee } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)
    
    try {
      // Enviar email de redefinição de senha
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      })
      
      if (error) {
        console.error("Erro ao enviar email de redefinição:", error)
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao enviar o email de redefinição de senha",
          variant: "destructive",
        })
      } else {
        setEmailSent(true)
        toast({
          title: "Email enviado",
          description: "Verifique sua caixa de entrada para redefinir sua senha",
        })
      }
    } catch (error) {
      console.error("Erro inesperado:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
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
          <CardTitle className="text-2xl text-center">Recuperação de Senha</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Digite seu email para receber um link de redefinição de senha
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="text-green-500 font-medium">Email enviado com sucesso!</div>
              <p className="text-sm text-gray-400">
                Enviamos um link para {email}. Por favor, verifique sua caixa de entrada 
                e clique no link para redefinir sua senha.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
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
                    Enviando...
                  </>
                ) : (
                  "Enviar link de redefinição"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="border-t border-zinc-800 pt-4 flex justify-center">
          <Link 
            href="/login" 
            className="text-sm text-gray-400 hover:text-yellow-400 transition-colors"
          >
            Voltar para login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 