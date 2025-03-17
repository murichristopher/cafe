"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"

export function SupabaseWarning() {
  if (isSupabaseConfigured()) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Erro de configuração</AlertTitle>
      <AlertDescription>
        O Supabase não está configurado corretamente. Verifique se as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e
        NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas corretamente.
      </AlertDescription>
    </Alert>
  )
}

