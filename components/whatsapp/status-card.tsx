"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { checkWhatsAppStatus } from "@/lib/whatsapp-service"

interface WhatsAppStatusCardProps {
  onStatusChange: (connected: boolean) => void
}

export function WhatsAppStatusCard({ onStatusChange }: WhatsAppStatusCardProps) {
  const [status, setStatus] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const { connected } = await checkWhatsAppStatus()
      setStatus(connected)
      onStatusChange(connected)
    } catch (error) {
      console.error("Erro ao verificar status:", error)
      setStatus(false)
      onStatusChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return (
    <Card className="bg-[#1a1a1a] border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Status do WhatsApp</CardTitle>
        <CardDescription>Verifique se o WhatsApp está conectado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-4">
          {status === null ? (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          ) : status ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium text-green-500">Conectado</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg font-medium text-red-500">Desconectado</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={fetchStatus} disabled={isLoading} className="bg-yellow-400 hover:bg-yellow-500 text-black">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Verificando..." : "Verificar Status"}
        </Button>
      </CardFooter>
    </Card>
  )
}

