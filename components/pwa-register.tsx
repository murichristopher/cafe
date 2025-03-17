"use client"

import { useEffect } from "react"
import { PWAInstallPrompt } from "./pwa-install-prompt"

export function PWARegister() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          })
          console.log("Service Worker registrado com sucesso:", registration)
        }
      } catch (error) {
        console.error("Erro ao registrar Service Worker:", error)
      }
    }

    // Registrar o service worker quando a página carregar
    window.addEventListener("load", registerServiceWorker)

    return () => {
      window.removeEventListener("load", registerServiceWorker)
    }
  }, [])

  return <PWAInstallPrompt />
}

