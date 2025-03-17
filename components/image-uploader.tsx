"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageUploaderProps {
  eventId: string
  onSuccess?: () => void
}

export function ImageUploader({ eventId, onSuccess }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      // Upload para o bucket 'imagens'
      const fileName = `${eventId}/${Date.now()}-${file.name}`
      const { data, error: uploadError } = await supabase.storage.from("imagens").upload(fileName, file)

      if (uploadError) throw uploadError

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("imagens").getPublicUrl(fileName)

      // Atualizar o evento com a URL da imagem
      const { error: updateError } = await supabase.from("events").update({ imagem_final: publicUrl }).eq("id", eventId)

      if (updateError) throw updateError

      toast({
        title: "Sucesso!",
        description: "Imagem enviada com sucesso.",
      })

      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <label htmlFor="image-upload">
        <Button variant="outline" className="w-full cursor-pointer" disabled={isUploading} asChild>
          <span>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Imagem
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  )
}

