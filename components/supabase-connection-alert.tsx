"use client"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, WifiOff } from "lucide-react"
import { useSupabaseStatus } from "@/hooks/use-supabase-status"

export function SupabaseConnectionAlert() {
  const { isConnected, isLoading, retryConnection } = useSupabaseStatus()

  if (isConnected) {
    return null
  }

  return (
    <Alert className="bg-red-50 border-red-200 mb-4">
      <WifiOff className="h-4 w-4 text-red-500" />
      <AlertTitle className="text-red-700">Problema de conexão</AlertTitle>
      <AlertDescription className="text-red-600">
        <p className="mb-2">
          Detectamos um problema de conexão com nosso banco de dados. Isso pode afetar o carregamento e
          salvamento de dados.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="bg-white border-red-300 hover:bg-red-50"
          onClick={retryConnection}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Verificando...
            </>
          ) : (
            "Tentar reconectar"
          )}
        </Button>
      </AlertDescription>
    </Alert>
  )
} 