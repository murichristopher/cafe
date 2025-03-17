"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

interface DescriptionImageUploadProps {
  eventId?: string // Make eventId optional
  onImageUploaded: (imageUrl: string) => void
  disabled?: boolean
}

export function DescriptionImageUpload({ eventId, onImageUploaded, disabled = false }: DescriptionImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleClearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedImage(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadImage = async () => {
    if (!selectedImage) {
      toast({
        title: "Selecione uma imagem",
        description: "Por favor, selecione uma imagem para enviar.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Generate a folder path - use eventId if available, or a temporary ID
      const folderPath = eventId ? `eventos/${eventId}` : `eventos/temp_${uuidv4()}`
      const fileExt = selectedImage.name.split(".").pop()
      const fileName = `description_${uuidv4()}.${fileExt}`
      const filePath = `${folderPath}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("imagens").upload(filePath, selectedImage, {
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("imagens").getPublicUrl(filePath)
      const imageUrl = data.publicUrl

      toast({
        title: "Imagem enviada com sucesso",
        description: "A imagem foi enviada e adicionada à descrição.",
      })

      onImageUploaded(imageUrl)
      handleClearImage()
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message || "Ocorreu um erro ao enviar a imagem.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="description-image-upload" className="text-sm font-medium">
          Adicionar Imagem à Descrição
        </label>
      </div>
      <p className="text-xs text-gray-400">Selecione uma imagem para adicionar à descrição do evento.</p>

      {previewUrl ? (
        <div className="relative aspect-video overflow-hidden rounded-md border border-dashed border-zinc-700 bg-zinc-800">
          <img
            src={previewUrl || "/placeholder.svg"}
            alt="Imagem de visualização"
            className="h-full w-full object-cover"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/80"
            onClick={handleClearImage}
            disabled={isUploading || disabled}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remover imagem</span>
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full aspect-video rounded-md border-dashed border-zinc-700 text-muted-foreground hover:bg-zinc-800"
          onClick={handleButtonClick}
          disabled={isUploading || disabled}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Selecionar Imagem
        </Button>
      )}

      <input
        type="file"
        id="description-image-upload"
        accept="image/*"
        className="sr-only"
        onChange={handleImageChange}
        disabled={isUploading || disabled}
        ref={fileInputRef}
      />

      {selectedImage && (
        <Button
          onClick={handleUploadImage}
          disabled={isUploading || disabled}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Adicionar à Descrição"
          )}
        </Button>
      )}
    </div>
  )
}

