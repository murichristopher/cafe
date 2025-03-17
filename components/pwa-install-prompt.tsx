"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

interface PWAInstallPromptProps {
  deferredPrompt: any
  showInstallPrompt: () => void
}

export function PWAInstallPrompt({ deferredPrompt, showInstallPrompt }: PWAInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Verificar se o app já está instalado
    const isAppInstalled = window.matchMedia("(display-mode: standalone)").matches

    if (isAppInstalled) {
      return // Não mostrar o prompt se já estiver instalado
    }

    // Mostrar o prompt se tivermos um evento de instalação
    if (deferredPrompt) {
      setShowPrompt(true)
    }
  }, [deferredPrompt])

  const handleInstallClick = () => {
    showInstallPrompt()
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  // Verificar se estamos no iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-white p-4 shadow-lg md:left-auto md:right-4 md:w-80">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium">Instalar aplicativo</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isIOS()
              ? "Adicione à tela inicial para acesso rápido e uso offline."
              : "Instale o Café da Manhã para acesso rápido e uso offline."}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDismiss} className="text-xs">
              Agora não
            </Button>
            <Button size="sm" onClick={handleInstallClick} className="bg-amber-500 text-xs hover:bg-amber-600">
              <Download className="mr-1 h-3 w-3" />
              {isIOS() ? "Como instalar" : "Instalar"}
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>
    </div>
  )
}

