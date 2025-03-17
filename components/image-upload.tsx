"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ImageUploadProps {
  eventId: string
  imageType: string
  label: string
  description: string
  currentImageUrl: string | null
  onImageSelected: (imageType: string, file: File | null) => void
  readOnly?: boolean
  isPendingUpload?: boolean
}

export function ImageUpload({
  eventId,
  imageType,
  label,
  description,
  currentImageUrl,
  onImageSelected,
  readOnly = false,
  isPendingUpload = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      onImageSelected(imageType, file)
    } else {
      setPreviewUrl(null)
      onImageSelected(imageType, null)
    }
  }

  const handleClearImage = () => {
    setPreviewUrl(null)
    onImageSelected(imageType, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // Reset the file input
    }
  }

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`image-${imageType}`} className="text-sm font-medium">
        {label}
      </Label>
      <p className="text-sm text-gray-400">{description}</p>
      <div className="relative">
        {previewUrl ? (
          <div className="relative aspect-video overflow-hidden rounded-md border border-dashed border-zinc-700 bg-zinc-800">
            <img src={previewUrl || "/placeholder.svg"} alt={label} className="object-cover" />
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/80"
                onClick={handleClearImage}
                disabled={isPendingUpload}
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
            disabled={readOnly || isPendingUpload}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Selecionar Imagem
          </Button>
        )}
        <Input
          type="file"
          id={`image-${imageType}`}
          accept="image/*"
          className="sr-only"
          onChange={handleImageChange}
          disabled={readOnly || isPendingUpload}
          ref={fileInputRef}
        />
      </div>
    </div>
  )
}

