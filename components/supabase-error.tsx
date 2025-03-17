"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { checkSupabaseConnectivity, isSupabaseConfigured } from "@/lib/supabase"

interface SupabaseErrorProps {
  children: React.ReactNode
}

export function SupabaseError({ children }: SupabaseErrorProps) {
  const [isConfigured, setIsConfigured] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [isChecking, setIsChecking] = useState(true)

  const checkConnection = async () => {
    setIsChecking(true)

    // Verificar se o Supabase está configurado
    const configured = isSupabaseConfigured()
    setIsConfigured(configured)

    if (configured) {
      // Verificar a conectividade
      const connected = await checkSupabaseConnectivity()
      setIsConnected(connected)
    }

    setIsChecking(false)
  }

  useEffect(() => {
    checkConnection()
  }, [])

  // Se estiver verificando, mostrar uma mensagem de carregamento
  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verificando conexão com o banco de dados...</p>
        </div>
      </div>
    )
  }

  // Se não estiver configurado ou conectado, mostrar uma mensagem de erro
  if (!isConfigured || !isConnected) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle>Erro de Conexão</CardTitle>
          </div>
          <CardDescription>Não foi possível conectar ao banco de dados Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isConfigured ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Configuração Incorreta</AlertTitle>
              <AlertDescription>
                As variáveis de ambiente do Supabase não estão configuradas corretamente. Verifique se
                NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Erro de Conectividade</AlertTitle>
              <AlertDescription>
                Não foi possível estabelecer conexão com o Supabase. Verifique sua conexão de internet e se o serviço
                Supabase está disponível.
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground mt-4">Instruções para configurar o Supabase:</p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>
              Crie um arquivo <code>.env.local</code> na raiz do projeto
            </li>
            <li>Adicione as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>Reinicie o servidor Next.js</li>
          </ol>
        </CardContent>
        <CardFooter>
          <Button onClick={checkConnection} className="w-full bg-amber-500 hover:bg-amber-600" disabled={isChecking}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            Verificar Novamente
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Se estiver tudo ok, renderizar os filhos
  return <>{children}</>
}

