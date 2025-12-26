"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { EventWithFornecedores } from "@/types"

interface EventCardProps {
  event: EventWithFornecedores
  showActions?: boolean
}

export function EventCard({ event, showActions = true }: EventCardProps) {
  const [isImageError, setIsImageError] = useState(false)

  const statusColors = {
    pendente: "bg-yellow-500 text-black",
    confirmado: "bg-green-500 text-black",
    cancelado: "bg-red-500 text-white",
    aguardando_aprovacao: "bg-blue-500 text-white",
    concluido: "bg-purple-500 text-white",
  }

  const statusText = {
    pendente: "Pendente",
    confirmado: "Confirmado",
    cancelado: "Cancelado",
    aguardando_aprovacao: "Aguardando Aprovação",
    concluido: "Concluído",
  }

  const statusColor = statusColors[event.status as keyof typeof statusColors] || statusColors.pendente
  const statusDisplay = statusText[event.status as keyof typeof statusText] || "Pendente"

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card className="bg-[#222222] border-zinc-700 text-white overflow-hidden">
      {event.event_image && !isImageError ? (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={event.event_image || "/placeholder.svg"}
            alt={event.title}
            className="h-full w-full object-cover"
            onError={() => setIsImageError(true)}
          />
          <div className="absolute top-2 right-2">
            <Badge className={`${statusColor} px-2 py-1`}>{statusDisplay}</Badge>
          </div>
        </div>
      ) : (
        <div className="relative h-12 bg-zinc-800 flex items-center justify-center">
          <Badge className={`${statusColor} px-2 py-1 absolute right-2`}>{statusDisplay}</Badge>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-xl">{event.title}</CardTitle>
        <CardDescription className="text-zinc-400">
          <div className="flex items-center mt-1">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {formatDate(event.date)}
          </div>
          <div className="flex items-center mt-1">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {event.location}
          </div>
          {event.uf && (
            <div className="flex items-center mt-1">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {event.uf}
            </div>
          )}
          {event.cidade && (
            <div className="flex items-center mt-1">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {event.cidade}
            </div>
          )}
          {event.pax && (
            <div className="flex items-center mt-1">
              <UsersIcon className="h-4 w-4 mr-1" />
              {event.pax} pessoas
            </div>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="text-sm text-zinc-300 line-clamp-3 mb-4">{event.description}</div>

        <div className="flex flex-wrap gap-1 mt-2">
          <div className="text-sm text-zinc-400 mr-1">Fornecedores:</div>
          <div className="flex -space-x-2">
            {event.fornecedores && event.fornecedores.length > 0 ? (
              <TooltipProvider>
                {event.fornecedores.slice(0, 5).map((fornecedor, index) => (
                  <Tooltip key={fornecedor.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6 border border-zinc-700">
                        <AvatarImage
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fornecedor.name)}&background=random`}
                        />
                        <AvatarFallback className="text-xs">{getInitials(fornecedor.name)}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{fornecedor.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {event.fornecedores.length > 5 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-6 w-6 border border-zinc-700 bg-zinc-800">
                        <AvatarFallback className="text-xs">+{event.fornecedores.length - 5}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Mais {event.fornecedores.length - 5} fornecedores</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            ) : (
              <span className="text-sm text-zinc-500">Nenhum fornecedor atribuído</span>
            )}
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button
            asChild
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Link href={`/dashboard/events/${event.id}`}>Ver Detalhes</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

