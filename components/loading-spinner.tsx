"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  message?: string
  timeout?: number
  timeoutMessage?: string
}

export function LoadingSpinner({
  size = "md",
  message = "Carregando...",
  timeout = 10000,
  timeoutMessage = "Está demorando mais que o esperado. Verifique sua conexão.",
}: LoadingSpinnerProps) {
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className={`animate-spin text-yellow-400 ${sizeClass[size]}`} />
      <p className="mt-4 text-gray-300">{message}</p>

      {showTimeout && (
        <div className="mt-4 max-w-md rounded-md bg-amber-900/20 p-3 text-amber-300">
          <p className="text-sm">{timeoutMessage}</p>
          <p className="mt-2 text-xs">Tente recarregar a página ou verificar sua conexão com a internet.</p>
        </div>
      )}
    </div>
  )
}

