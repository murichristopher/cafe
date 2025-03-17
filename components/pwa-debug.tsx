"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function PWADebug() {
  const [isStandalone, setIsStandalone] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [swRegistered, setSwRegistered] = useState(false)
  const [manifestOk, setManifestOk] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    // Verificar se está em modo standalone
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)

    // Verificar se o service worker está registrado
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        setSwRegistered(registrations.length > 0)
      })
    }

    // Verificar se o manifest está acessível
    fetch("/manifest.json")
      .then((response) => {
        setManifestOk(response.ok)
        return response.json()
      })
      .then((data) => {
        setDebugInfo((prev) => prev + "\nManifest: " + JSON.stringify(data, null, 2))
      })
      .catch((err) => {
        setDebugInfo((prev) => prev + "\nErro ao carregar manifest: " + err.message)
      })

    // Monitorar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setIsInstallable(true)
      setDebugInfo((prev) => prev + "\nEvento beforeinstallprompt detectado")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Monitorar evento appinstalled
    window.addEventListener("appinstalled", (event) => {
      setDebugInfo((prev) => prev + "\nAplicativo instalado com sucesso!")
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const forceInstallPrompt = () => {
    setDebugInfo((prev) => prev + "\nTentando forçar prompt de instalação...")

    // Disparar evento personalizado para simular beforeinstallprompt
    const event = new CustomEvent("beforeinstallprompt")
    window.dispatchEvent(event)
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Diagnóstico PWA</CardTitle>
        <CardDescription>Informações para depuração do PWA</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Modo Standalone:</div>
            <div className={`text-sm ${isStandalone ? "text-green-600" : "text-red-600"}`}>
              {isStandalone ? "Sim" : "Não"}
            </div>

            <div className="text-sm font-medium">Service Worker:</div>
            <div className={`text-sm ${swRegistered ? "text-green-600" : "text-red-600"}`}>
              {swRegistered ? "Registrado" : "Não registrado"}
            </div>

            <div className="text-sm font-medium">Manifest:</div>
            <div className={`text-sm ${manifestOk ? "text-green-600" : "text-red-600"}`}>
              {manifestOk ? "OK" : "Erro"}
            </div>

            <div className="text-sm font-medium">Instalável:</div>
            <div className={`text-sm ${isInstallable ? "text-green-600" : "text-red-600"}`}>
              {isInstallable ? "Sim" : "Não"}
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={forceInstallPrompt} className="w-full bg-amber-500 hover:bg-amber-600">
              Forçar Prompt de Instalação
            </Button>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium">Log de depuração:</div>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-50">
              {debugInfo || "Nenhuma informação disponível"}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

