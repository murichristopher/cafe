"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, QrCode, Maximize2, X } from "lucide-react"
import { getWhatsAppQRCode } from "@/lib/whatsapp-service"

export function WhatsAppQRCodeCard() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const fetchQRCode = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getWhatsAppQRCode()
      if (data) {
        setQrCode(data.qrCode)
      } else {
        setError("Não foi possível obter o QR Code. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao obter QR Code:", error)
      setError("Ocorreu um erro ao obter o QR Code. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQRCode()
  }, [])

  // Componente de QR Code em tela cheia
  const FullscreenQRCode = () => {
    if (!isFullscreen || !qrCode) return null

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "white",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <img
          src={qrCode || "/placeholder.svg"}
          alt="QR Code do WhatsApp em tela cheia"
          style={{
            maxWidth: "90%",
            maxHeight: "90%",
            objectFit: "contain",
          }}
        />
        <Button
          onClick={() => setIsFullscreen(false)}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "transparent",
            border: "none",
          }}
        >
          <X size={32} />
        </Button>
      </div>
    )
  }

  return (
    <>
      <FullscreenQRCode />

      <Card>
        <CardHeader>
          <CardTitle>QR Code para Conexão</CardTitle>
          <CardDescription>Escaneie o QR Code com seu WhatsApp para conectar</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={qrCode || "/placeholder.svg"}
                alt="QR Code do WhatsApp"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              <Button onClick={() => setIsFullscreen(true)} variant="outline">
                <Maximize2 className="mr-2 h-4 w-4" />
                Expandir QR Code
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <QrCode className="h-16 w-16 text-gray-400" />
              <p className="text-gray-400">Nenhum QR Code disponível</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={fetchQRCode} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Gerando QR Code..." : "Gerar Novo QR Code"}
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}

