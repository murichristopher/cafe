"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "@/lib/supabase"
import { useEffect } from "react"

interface SimpleImageUploadProps {
  label: string
  description?: string
  currentImageUrl: string | null
  onImageSelected?: (file: File | null) => void
  disabled?: boolean
  eventId?: string
  imageType?: "imagem_chegada" | "imagem_inicio" | "imagem_final" // Specify exact column names
  onSuccess?: () => void
}

export function SimpleImageUpload({
  label,
  description,
  currentImageUrl,
  onImageSelected,
  disabled = false,
  eventId,
  imageType,
  onSuccess,
}: SimpleImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Mostrar preview imediatamente após selecionar o arquivo
    const localPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(localPreviewUrl)

    if (!eventId || !imageType) {
      // Se não temos eventId ou imageType, apenas atualizamos o preview e notificamos o componente pai
      if (onImageSelected) onImageSelected(file)
      return
    }

    setIsUploading(true)

    try {
      // 1. Upload para o storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${eventId}/${imageType}_${uuidv4()}.${fileExt}`
      const filePath = `eventos/${fileName}`

      const { error: uploadError } = await supabase.storage.from("imagens").upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("imagens").getPublicUrl(filePath)

      // 3. Atualizar o evento - agora com o nome correto da coluna
      const updateData = {
        [imageType]: publicUrl,
      }

      const { error: updateError } = await supabase.from("events").update(updateData).eq("id", eventId)

      if (updateError) {
        console.error("Erro ao atualizar evento:", updateError)
        throw new Error("Não foi possível atualizar o evento com a nova imagem")
      }

      // Atualizar preview com a URL permanente
      setPreviewUrl(publicUrl)

      // Limpar a URL temporária
      URL.revokeObjectURL(localPreviewUrl)

      toast({
        title: "Sucesso!",
        description: "Imagem enviada com sucesso.",
      })

      if (onSuccess) onSuccess()
      if (onImageSelected) onImageSelected(file)
    } catch (error: any) {
      console.error("Erro ao enviar imagem:", error)
      toast({
        title: "Erro ao enviar imagem",
        description: error.message || "Ocorreu um erro ao enviar a imagem.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClearImage = () => {
    setPreviewUrl(null)
    if (onImageSelected) {
      onImageSelected(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click()
    }
  }

  // Adicione este useEffect após as declarações de estado
  useEffect(() => {
    // Limpar URLs de objeto ao desmontar o componente
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

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
                disabled={isUploading}
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
            disabled={disabled || isUploading}
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
          disabled={disabled || isUploading}
          ref={fileInputRef}
        />
      </div>
    </div>
  )
}

