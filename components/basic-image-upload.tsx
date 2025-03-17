"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BasicImageUploadProps {
  label: string
  description?: string
  onImageSelected: (file: File | null) => void
  disabled?: boolean
  currentImageUrl?: string | null
}

export function BasicImageUpload({
  label,
  description,
  onImageSelected,
  disabled = false,
  currentImageUrl = null,
}: BasicImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Limpar URLs de objeto ao desmontar o componente
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Criar URL de preview local
    const objectUrl = URL.createObjectURL(file)

    // Se já tínhamos uma URL de preview blob, revogá-la
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }

    // Atualizar preview
    setPreviewUrl(objectUrl)

    // Notificar componente pai
    onImageSelected(file)
  }

  const handleClearImage = () => {
    // Limpar URL de preview
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(null)
    onImageSelected(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-medium">{label}</h3>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>

      <div className="relative">
        {previewUrl ? (
          <div className="relative aspect-video overflow-hidden rounded-md border border-dashed border-zinc-700 bg-zinc-800">
            <img src={previewUrl || "/placeholder.svg"} alt={label} className="h-full w-full object-cover" />
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/80"
                onClick={handleClearImage}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remover imagem</span>
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full aspect-video rounded-md border-dashed border-zinc-700 text-muted-foreground hover:bg-zinc-800"
            onClick={handleClick}
            disabled={disabled || isLoading}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Selecionar Imagem
          </Button>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled || isLoading}
          ref={fileInputRef}
        />
      </div>
    </div>
  )
}

