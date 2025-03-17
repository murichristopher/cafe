"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SimpleImageUpload } from "@/components/simple-image-upload"
import { Progress } from "@/components/ui/progress"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateEventImages } from "@/lib/image-helper"

interface EventImagesManagerProps {
  eventId: string
  currentImages: {
    chegada: string | null
    inicio: string | null
    final: string | null
  }
  onImagesUpdated: () => void
  readOnly?: boolean
}

export function EventImagesManager({
  eventId,
  currentImages,
  onImagesUpdated,
  readOnly = false,
}: EventImagesManagerProps) {
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

      const success = await updateEventImages(eventId, selectedImages)

      clearInterval(progressInterval)
      setProgress(100)

      if (success) {
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
      } else {
        throw new Error("Não foi possível salvar as imagens")
      }
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
        <SimpleImageUpload
          label="Chegada ao Local"
          description="Foto do momento de chegada ao local do evento"
          currentImageUrl={currentImages.chegada}
          onImageSelected={(file) => handleImageSelected("chegada", file)}
          disabled={readOnly || isUploading}
        />

        <SimpleImageUpload
          label="Início do Café"
          description="Foto do início do café da manhã"
          currentImageUrl={currentImages.inicio}
          onImageSelected={(file) => handleImageSelected("inicio", file)}
          disabled={readOnly || isUploading}
        />

        <SimpleImageUpload
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

