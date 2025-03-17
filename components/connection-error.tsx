"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription } from "@/components/ui/card"

interface ConnectionErrorProps {
  message?: string
  onRetry?: () => void
}

export function ConnectionError({
  message = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
  onRetry,
}: ConnectionErrorProps) {
  return (
    <Card className="bg-[#1a1a1a] border-zinc-800">
      <CardContent className="flex flex-col items-center justify-center p-8">
        <AlertTriangle className="h-12 w-12 text-yellow-400" />
        <CardDescription className="mt-4 text-center text-gray-300">{message}</CardDescription>
        {onRetry && (
          <Button className="mt-6 bg-yellow-400 text-black hover:bg-yellow-500" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

