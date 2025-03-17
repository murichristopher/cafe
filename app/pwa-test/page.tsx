"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PWATestPage() {
  const [isStandalone, setIsStandalone] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [swRegistered, setSwRegistered] = useState(false)
  const [manifestOk, setManifestOk] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    addLog("Página carregada")

    // Verificar se está em modo standalone
    const standalone = window.matchMedia("(display-mode: standalone)").matches
    setIsStandalone(standalone)
    addLog(`Modo standalone: ${standalone ? "Sim" : "Não"}`)

    // Verificar se o service worker está registrado
    if ("serviceWorker" in navigator) {
      addLog("Service Worker é suportado")
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        const registered = registrations.length > 0
        setSwRegistered(registered)
        addLog(`Service Worker registrado: ${registered ? "Sim" : "Não"}`)
      })
    } else {
      addLog("Service Worker NÃO é suportado neste navegador")
    }

    // Verificar se o manifest está acessível
    fetch("/manifest.json")
      .then((response) => {
        const ok = response.ok
        setManifestOk(ok)
        addLog(`Manifest acessível: ${ok ? "Sim" : "Não"}`)
        return response.json()
      })
      .then((data) => {
        addLog(`Manifest carregado: ${JSON.stringify(data, null, 2)}`)
      })
      .catch((err) => {
        addLog(`Erro ao carregar manifest: ${err.message}`)
      })

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      addLog("Evento beforeinstallprompt capturado")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Monitorar evento appinstalled
    window.addEventListener("appinstalled", () => {
      addLog("Aplicativo instalado com sucesso!")
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const handleInstall = () => {
    if (!installPrompt) {
      addLog("Nenhum evento de instalação disponível")

      // Instruções para iOS
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) {
        addLog("Dispositivo iOS detectado, mostrando instruções")
        alert(
          'Para instalar este aplicativo no iOS: toque no ícone de compartilhamento e depois em "Adicionar à Tela de Início"',
        )
      }

      return
    }

    addLog("Mostrando prompt de instalação")
    installPrompt.prompt()

    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        addLog("Usuário aceitou a instalação")
      } else {
        addLog("Usuário recusou a instalação")
      }
      setInstallPrompt(null)
    })
  }

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })

        // Força a atualização do service worker
        if (registration.waiting) {
          registration.waiting.postMessage("SKIP_WAITING")
        }

        // Recarrega a página para ativar o novo service worker
        window.location.reload()

        return true
      } catch (error) {
        console.error("Erro ao registrar service worker:", error)
        return false
      }
    }
    return false
  }

  return (
    <div className="container mx-auto p-4">
      <Link href="/dashboard" className="mb-4 flex items-center text-amber-500 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para o Dashboard
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Teste de PWA</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status do PWA</CardTitle>
            <CardDescription>Informações sobre o status atual do PWA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Modo Standalone:</div>
                <div className={`text-sm ${isStandalone ? "text-green-600" : "text-amber-600"}`}>
                  {isStandalone ? "Sim (Instalado)" : "Não (Navegador)"}
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
                <div className={`text-sm ${installPrompt ? "text-green-600" : "text-amber-600"}`}>
                  {installPrompt ? "Sim" : "Não disponível agora"}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleInstall}
                  disabled={!installPrompt && !/iPad|iPhone|iPod/.test(navigator.userAgent)}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Instalar Aplicativo
                </Button>

                <Button onClick={registerServiceWorker} variant="outline" className="mt-2">
                  Atualizar Service Worker
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log de Eventos</CardTitle>
            <CardDescription>Registro de atividades do PWA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-50">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              {logs.length === 0 && <div>Nenhum log disponível</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

