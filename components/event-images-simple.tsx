"use client"

import { useState, useEffect } from "react"
import { SimpleImageUpload } from "./simple-image-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface EventImagesSimpleProps {
  eventId: string
}

export function EventImagesSimple({ eventId }: EventImagesSimpleProps) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Carregar dados do evento
  useEffect(() => {
    async function loadEvent() {
      try {
        const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single()

        if (error) throw error
        setEvent(data)
      } catch (error: any) {
        toast({
          title: "Erro ao carregar evento",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId, toast])

  const handleImageUploaded = () => {
    // Recarregar os dados do evento
    supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setEvent(data)
        }
      })
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!event) {
    return <div>Evento não encontrado</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagens do Evento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seção de imagem de chegada */}
        <div className="space-y-4">
          <SimpleImageUpload
            eventId={eventId}
            imageType="imagem_chegada"
            label="Foto de Chegada"
            onSuccess={handleImageUploaded}
          />

          {event.imagem_chegada && (
            <div className="aspect-video overflow-hidden rounded-lg border border-zinc-700">
              <img
                src={event.imagem_chegada || "/placeholder.svg"}
                alt="Imagem de chegada"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Seção de imagem de início */}
        <div className="space-y-4">
          <SimpleImageUpload
            eventId={eventId}
            imageType="imagem_inicio"
            label="Foto de Início"
            onSuccess={handleImageUploaded}
          />

          {event.imagem_inicio && (
            <div className="aspect-video overflow-hidden rounded-lg border border-zinc-700">
              <img
                src={event.imagem_inicio || "/placeholder.svg"}
                alt="Imagem de início"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Seção de imagem final */}
        <div className="space-y-4">
          <SimpleImageUpload
            eventId={eventId}
            imageType="imagem_final"
            label="Foto Final"
            onSuccess={handleImageUploaded}
          />

          {event.imagem_final && (
            <div className="aspect-video overflow-hidden rounded-lg border border-zinc-700">
              <img
                src={event.imagem_final || "/placeholder.svg"}
                alt="Imagem final"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

