"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BasicImageUpload } from "./basic-image-upload"
import { Progress } from "@/components/ui/progress"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

interface EventImagesManagerV2Props {
  eventId: string
  currentImages: {
    chegada: string | null
    inicio: string | null
    final: string | null
  }
  onImagesUpdated: () => void
  readOnly?: boolean
}

export function EventImagesManagerV2({
  eventId,
  currentImages,
  onImagesUpdated,
  readOnly = false,
}: EventImagesManagerV2Props) {
  const { toast } = useToast()
  const [selectedImages, setSelectedImages] = useState<{
    chegada: File | null
    inicio: File | null
    final: File | null
  }>({
    chegada: null,
    inicio: null,
    final: null,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleImageSelected = (type: "chegada" | "inicio" | "final", file: File | null) => {
    setSelectedImages((prev) => ({
      ...prev,
      [type]: file,
    }))
  }

  const hasSelectedImages = selectedImages.chegada || selectedImages.inicio || selectedImages.final

  const handleSaveImages = async () => {
    if (!hasSelectedImages) {
      toast({
        title: "Nenhuma imagem selecionada",
        description: "Selecione pelo menos uma imagem para salvar.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setProgress(10)

    try {
      // Simular progresso durante o upload
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 500)

      // Objeto para armazenar as URLs das imagens
      const imageUrls: Record<string, string> = {}

      // Função para fazer upload de uma imagem
      const uploadImage = async (file: File, columnName: string, type: string) => {
        const fileExt = file.name.split(".").pop()
        const fileName = `${eventId}_${type}_${uuidv4()}.${fileExt}`
        const filePath = `eventos/${fileName}`

        const { error } = await supabase.storage.from("imagens").upload(filePath, file, { upsert: true })

        if (error) {
          console.error(`Erro ao fazer upload da imagem ${type}:`, error)
          throw error
        }

        const { data } = supabase.storage.from("imagens").getPublicUrl(filePath)

        imageUrls[columnName] = data.publicUrl
      }

      // Fazer upload das imagens selecionadas
      const uploadPromises = []

      if (selectedImages.chegada) {
        uploadPromises.push(uploadImage(selectedImages.chegada, "imagem_chegada", "chegada"))
      }

      if (selectedImages.inicio) {
        uploadPromises.push(uploadImage(selectedImages.inicio, "imagem_inicio", "inicio"))
      }

      if (selectedImages.final) {
        uploadPromises.push(uploadImage(selectedImages.final, "imagem_final", "final"))
      }

      // Aguardar todos os uploads
      await Promise.all(uploadPromises)

      // Atualizar o evento com as URLs das imagens
      const { error } = await supabase.from("events").update(imageUrls).eq("id", eventId)

      clearInterval(progressInterval)
      setProgress(100)

      if (error) {
        console.error("Erro ao atualizar evento com as imagens:", error)
        throw error
      }

      toast({
        title: "Imagens salvas",
        description: "As imagens foram salvas com sucesso.",
      })

      // Limpar as imagens selecionadas
      setSelectedImages({
        chegada: null,
        inicio: null,
        final: null,
      })

      // Notificar o componente pai
      onImagesUpdated()
    } catch (error: any) {
      toast({
        title: "Erro ao salvar imagens",
        description: error.message || "Ocorreu um erro ao salvar as imagens.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Documentação Fotográfica</h3>
        <p className="text-sm text-gray-400">
          {readOnly
            ? "Visualize as imagens enviadas pelo fornecedor."
            : "Selecione as imagens do evento e clique em Salvar para enviá-las."}
        </p>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Enviando imagens...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="grid gap-6">
        <BasicImageUpload
          label="Chegada ao Local"
          description="Foto do momento de chegada ao local do evento"
          currentImageUrl={currentImages.chegada}
          onImageSelected={(file) => handleImageSelected("chegada", file)}
          disabled={readOnly || isUploading}
        />

        <BasicImageUpload
          label="Início do Café"
          description="Foto do início do café da manhã"
          currentImageUrl={currentImages.inicio}
          onImageSelected={(file) => handleImageSelected("inicio", file)}
          disabled={readOnly || isUploading}
        />

        <BasicImageUpload
          label="Final do Café"
          description="Foto do final do café da manhã"
          currentImageUrl={currentImages.final}
          onImageSelected={(file) => handleImageSelected("final", file)}
          disabled={readOnly || isUploading}
        />
      </div>

      {!readOnly && (
        <Button
          onClick={handleSaveImages}
          disabled={!hasSelectedImages || isUploading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando imagens...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Imagens
            </>
          )}
        </Button>
      )}
    </div>
  )
}

