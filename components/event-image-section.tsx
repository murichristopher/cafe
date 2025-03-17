"use client"

import { useState } from "react"
import { ImageUploader } from "./image-uploader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EventImageSectionProps {
  eventId: string
  currentImage: string | null
}

export function EventImageSection({ eventId, currentImage }: EventImageSectionProps) {
  const [imageUrl, setImageUrl] = useState(currentImage)

  const handleImageUploaded = () => {
    // Recarregar a página ou atualizar o estado conforme necessário
    window.location.reload()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagens do Evento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageUrl && (
          <div className="aspect-video overflow-hidden rounded-lg">
            <img src={imageUrl || "/placeholder.svg"} alt="Imagem do evento" className="h-full w-full object-cover" />
          </div>
        )}
        <ImageUploader eventId={eventId} onSuccess={handleImageUploaded} />
      </CardContent>
    </Card>
  )
}

