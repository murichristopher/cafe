"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Calendar,
  Clock,
  MapPin,
  Trash,
  Users,
  Receipt,
  CreditCard,
  CheckCircle,
  AlertCircle,
  CheckSquare,
  ArrowLeft,
  Loader2,
  Pencil,
  DollarSign,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Event, EventWithFornecedores, User } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { EventImagesManagerV2 } from "@/components/event-images-manager-v2"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = use(Promise.resolve(params))
  const eventId = unwrappedParams.id

  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [event, setEvent] = useState<EventWithFornecedores | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("detalhes")
  const [error, setError] = useState<string | null>(null)
  const [fornecedores, setFornecedores] = useState<User[]>([])

  // Verificar autenticação
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
  }, [user, router])

  const fetchEvent = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Buscar o evento
      const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single()

      if (error) {
        console.error("Error fetching event:", error)
        setError("Não foi possível carregar os detalhes do evento.")
        return
      }

      // Buscar os fornecedores associados ao evento
      const { data: eventFornecedores, error: fornecedoresError } = await supabase
        .from("event_fornecedores")
        .select("fornecedor_id")
        .eq("event_id", eventId)

      if (fornecedoresError) {
        console.error("Erro ao buscar fornecedores do evento:", fornecedoresError)
      }

      // Se temos fornecedores associados, buscar seus detalhes
      let fornecedoresList: User[] = []
      if (eventFornecedores && eventFornecedores.length > 0) {
        const fornecedorIds = eventFornecedores.map((ef) => ef.fornecedor_id)

        const { data: fornecedoresData, error: fornecedoresDataError } = await supabase
          .from("users")
          .select("*")
          .in("id", fornecedorIds)

        if (fornecedoresDataError) {
          console.error("Erro ao buscar detalhes dos fornecedores:", fornecedoresDataError)
        } else {
          fornecedoresList = fornecedoresData as User[]
        }
      }

      // Se não temos fornecedores na tabela de relacionamento mas temos um fornecedor_id, usar esse
      if (fornecedoresList.length === 0 && data.fornecedor_id) {
        const { data: fornecedorData, error: fornecedorError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.fornecedor_id)
          .single()

        if (!fornecedorError && fornecedorData) {
          fornecedoresList = [fornecedorData]
        }
      }

      setFornecedores(fornecedoresList)
      setEvent({ ...data, fornecedores: fornecedoresList } as EventWithFornecedores)
    } catch (error) {
      console.error("Error fetching event:", error)
      setError("Ocorreu um erro ao carregar os detalhes do evento.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  useEffect(() => {
    if (isLoading || !event || !user) return

    // Admin pode ver tudo
    if (user.role === "admin") {
      return
    }

    // Se for fornecedor, verificar se está no evento
    if (user.role === "fornecedor") {
      const isAssociated = event.fornecedores?.some((f) => f.id === user.id)

      if (!isAssociated) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para visualizar os detalhes deste evento.",
          variant: "destructive",
        })
        router.push("/dashboard/events")
      }
    }
  }, [event, user, isLoading, router, toast])

  const deleteEvent = async () => {
    if (!event) return

    console.log("Iniciando exclusão do evento:", event.id)
    setIsDeleting(true)

    try {
      // Primeiro, excluir os relacionamentos na tabela event_fornecedores
      const { error: relationshipError } = await supabase.from("event_fornecedores").delete().eq("event_id", event.id)

      if (relationshipError) {
        console.error("Erro ao excluir relacionamentos:", relationshipError)
        // Continuar mesmo com erro, para tentar excluir o evento
      }

      // Agora excluir o evento
      const { error } = await supabase.from("events").delete().eq("id", event.id)

      if (error) {
        throw error
      }

      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso.",
      })

      // Redirecionar para a lista de eventos
      router.push("/dashboard/events")
    } catch (error) {
      console.error("Erro ao excluir evento:", error)
      toast({
        title: "Erro ao excluir evento",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEventUpdated = () => {
    fetchEvent()
  }

  const handleSubmitForReview = async () => {
    if (!event) return

    // Verificar se todas as imagens foram enviadas
    if (!event.imagem_chegada || !event.imagem_inicio || !event.imagem_final) {
      toast({
        title: "Ação não permitida",
        description: "É necessário enviar todas as 3 fotos antes de enviar para revisão.",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingStatus(true)

    try {
      const { error } = await supabase.from("events").update({ status: "aguardando_aprovacao" }).eq("id", event.id)

      if (error) {
        throw error
      }

      toast({
        title: "Evento enviado para revisão",
        description: "O evento foi enviado para revisão do administrador.",
      })

      // Atualizar o estado local
      setEvent({
        ...event,
        status: "aguardando_aprovacao",
      })
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro ao enviar para revisão",
        description: error.message || "Não foi possível atualizar o status do evento",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleApproveEvent = async () => {
    if (!event) return

    setIsUpdatingStatus(true)

    try {
      const { error } = await supabase.from("events").update({ status: "concluido" }).eq("id", event.id)

      if (error) {
        throw error
      }

      toast({
        title: "Evento concluído",
        description: "O evento foi aprovado e marcado como concluído com sucesso.",
      })

      // Atualizar o estado local
      setEvent({
        ...event,
        status: "concluido",
      })
    } catch (error: any) {
      console.error("Erro ao aprovar evento:", error)
      toast({
        title: "Erro ao aprovar evento",
        description: error.message || "Não foi possível aprovar o evento",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "confirmado":
        return "bg-green-100 text-green-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      case "aguardando_aprovacao":
        return "bg-blue-100 text-blue-800"
      case "concluido":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusText = (status: Event["status"]) => {
    switch (status) {
      case "confirmado":
        return "Confirmado"
      case "cancelado":
        return "Cancelado"
      case "aguardando_aprovacao":
        return "Aguardando Revisão"
      case "concluido":
        return "Concluído"
      default:
        return "Pendente"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <CardDescription className="mt-4 text-center">{error || "Evento não encontrado."}</CardDescription>
          <Link href="/dashboard/events">
            <Button className="mt-4">Voltar para Eventos</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Verificar se o usuário é um dos fornecedores designados para este evento
  const isFornecedor =
    user?.role === "fornecedor" && (event.fornecedor_id === user.id || fornecedores.some((f) => f.id === user.id))

  const isAdmin = user?.role === "admin"

  // Verificar se há pelo menos uma imagem para mostrar a aba de imagens para administradores
  const hasImages = event.imagem_chegada || event.imagem_inicio || event.imagem_final

  // Verificar se todas as imagens foram enviadas
  const allImagesUploaded = event.imagem_chegada && event.imagem_inicio && event.imagem_final

  // Mostrar abas se for fornecedor ou se for admin e houver imagens
  const showTabs = isFornecedor || (isAdmin && hasImages)

  // Atualizar o JSX para remover as referências ao modal de edição
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href="/dashboard/events" className="flex items-center text-yellow-400 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para eventos
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-zinc-800 shadow-lg bg-[#1a1a1a] dark:bg-[#1a1a1a]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(event.status)}>{getStatusText(event.status)}</Badge>
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
                      className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.")) {
                          deleteEvent()
                        }
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <CardTitle className="text-2xl text-white">{event.title}</CardTitle>

            {/* Exibir a imagem principal do evento se existir */}
            {event.event_image && (
              <div className="mt-4 overflow-hidden rounded-lg border border-zinc-700">
                <img
                  src={event.event_image || "/placeholder.svg"}
                  alt={event.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </CardHeader>

          {showTabs ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
              <TabsList className="grid w-full grid-cols-2 bg-[#111111] dark:bg-[#111111]">
                <TabsTrigger
                  value="detalhes"
                  className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                >
                  Detalhes
                </TabsTrigger>
                <TabsTrigger
                  value="imagens"
                  className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                >
                  Imagens
                </TabsTrigger>
              </TabsList>
              <TabsContent value="detalhes">
                <EventDetails event={event} fornecedores={fornecedores} isFornecedor={isFornecedor} />

                {/* Botões de ação baseados no status e papel do usuário */}
                <div className="mt-6 flex flex-col gap-4">
                  {/* Fornecedor pode enviar para revisão se todas as imagens foram enviadas */}
                  {isFornecedor && (event.status === "pendente" || event.status === "confirmado") && (
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={!allImagesUploaded || isUpdatingStatus}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUpdatingStatus ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Enviar para Revisão
                        </>
                      )}
                    </Button>
                  )}

                  {/* Admin pode aprovar o evento */}
                  {isAdmin && event.status === "aguardando_aprovacao" && (
                    <Button
                      onClick={handleApproveEvent}
                      disabled={isUpdatingStatus}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUpdatingStatus ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Aprovar e Concluir Evento
                        </>
                      )}
                    </Button>
                  )}

                  {/* Mensagem para fornecedor quando faltam imagens */}
                  {isFornecedor &&
                    (event.status === "pendente" || event.status === "confirmado") &&
                    !allImagesUploaded && (
                      <div className="flex items-center gap-2 rounded-md bg-amber-900/20 dark:bg-amber-900/20 p-3 text-amber-300 dark:text-amber-300">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">
                          Envie todas as 3 fotos na aba "Imagens" para poder enviar o evento para revisão.
                        </p>
                      </div>
                    )}
                </div>
              </TabsContent>
              <TabsContent value="imagens" className="py-4">
                {isFornecedor ? (
                  <EventImagesManagerV2
                    eventId={event.id}
                    currentImages={{
                      chegada: event.imagem_chegada,
                      inicio: event.imagem_inicio,
                      final: event.imagem_final,
                    }}
                    onImagesUpdated={fetchEvent}
                  />
                ) : (
                  <ViewEventImages event={event} />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <CardContent className="space-y-6">
              <EventDetails event={event} fornecedores={fornecedores} isFornecedor={isFornecedor} />

              {/* Botão de aprovação para admin quando o evento está aguardando aprovação */}
              {isAdmin && event.status === "aguardando_aprovacao" && (
                <Button
                  onClick={handleApproveEvent}
                  disabled={isUpdatingStatus}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Aprovar e Concluir Evento
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          )}

          <CardFooter className="flex justify-end gap-4">
            <Link href="/dashboard/events">
              <Button variant="outline" className="border-zinc-700 dark:border-zinc-700 text-white">
                Voltar
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

// Componente para visualizar as imagens do evento (para administradores)
function ViewEventImages({ event }: { event: EventWithFornecedores }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Imagens do Evento</h3>
        <p className="text-sm text-gray-400">Imagens enviadas pelo fornecedor para documentação do evento.</p>
      </div>

      <div className="space-y-6">
        {event.imagem_chegada && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Chegada ao Local</h4>
            <div className="aspect-video overflow-hidden rounded-md border border-zinc-700">
              <img
                src={event.imagem_chegada || "/placeholder.svg"}
                alt="Imagem de chegada"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {event.imagem_inicio && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Início do Café</h4>
            <div className="aspect-video overflow-hidden rounded-md border border-zinc-700">
              <img
                src={event.imagem_inicio || "/placeholder.svg"}
                alt="Imagem de início"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {event.imagem_final && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Final do Café</h4>
            <div className="aspect-video overflow-hidden rounded-md border border-zinc-700">
              <img
                src={event.imagem_final || "/placeholder.svg"}
                alt="Imagem final"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {!event.imagem_chegada && !event.imagem_inicio && !event.imagem_final && (
          <div className="flex items-center justify-center p-8 text-gray-400">Nenhuma imagem foi enviada</div>
        )}
      </div>
    </div>
  )
}

// Componente separado para os detalhes do evento
function EventDetails({
  event,
  fornecedores,
  isFornecedor,
}: { event: EventWithFornecedores; fornecedores: User[]; isFornecedor: boolean }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center text-muted-foreground">
          <Calendar className="mr-2 h-5 w-5 text-yellow-500" />
          {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>

        {event.data_termino && (
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-5 w-5 text-yellow-500" />
            Data de Término: {format(new Date(event.data_termino), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        )}

        <div className="flex items-center text-muted-foreground">
          <Clock className="mr-2 h-5 w-5 text-yellow-500" />
          {format(new Date(event.date), "HH:mm", { locale: ptBR })}
          {event.horario_fim && <span className="ml-1">até {event.horario_fim}</span>}
        </div>
        <div className="flex items-center text-muted-foreground">
          <MapPin className="mr-2 h-5 w-5 text-yellow-500" />
          {event.location}
        </div>
        {event.pax !== null && event.pax !== undefined && (
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-2 h-5 w-5 text-yellow-500" />
            Número de Pessoas: {event.pax}
          </div>
        )}

        {event.valor !== null && event.valor !== undefined && (
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="mr-2 h-5 w-5 text-yellow-500" />
            Valor: R$ {event.valor.toFixed(2)}
          </div>
        )}

        {event.valor_de_custo !== null && event.valor_de_custo !== undefined && (
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="mr-2 h-5 w-5 text-yellow-500" />
            Valor de Custo: R$ {event.valor_de_custo.toFixed(2)}
          </div>
        )}

        {/* Fornecedores */}
        {fornecedores.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-5 w-5 text-yellow-500" />
              Fornecedores:
            </div>
            <div className="flex flex-wrap gap-2 ml-7">
              <TooltipProvider>
                {fornecedores.map((fornecedor) => (
                  <Tooltip key={fornecedor.id}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 bg-zinc-800 rounded-md px-2 py-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-zinc-700 text-xs">
                            {fornecedor.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{fornecedor.name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{fornecedor.email}</p>
                      {fornecedor.phone_number && <p>{fornecedor.phone_number}</p>}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* Campos financeiros - visíveis apenas para administradores */}
        {!isFornecedor && (
          <>
            {event.nota_fiscal && (
              <div className="flex items-center text-muted-foreground">
                <Receipt className="mr-2 h-5 w-5 text-yellow-500" />
                Nota Fiscal: {event.nota_fiscal}
              </div>
            )}

            {event.pagamento && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-5 w-5 text-yellow-500" />
                Pagamento:
                <Badge
                  className={
                    event.pagamento === "realizado"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : event.pagamento === "cancelado"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                  }
                >
                  {event.pagamento === "realizado"
                    ? "Realizado"
                    : event.pagamento === "cancelado"
                      ? "Cancelado"
                      : "Pendente"}
                </Badge>
              </div>
            )}

            {event.dia_pagamento && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="mr-2 h-5 w-5 text-yellow-500" />
                Data de Pagamento: {format(new Date(event.dia_pagamento), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            )}
          </>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold">Descrição</h3>
        <div className="prose prose-invert max-w-none">
          {event.description.split("\n").map((paragraph, index) =>
            paragraph.trim() ? (
              <p key={index} className="mb-2">
                {paragraph}
              </p>
            ) : (
              <br key={index} />
            ),
          )}
        </div>
      </div>
    </div>
  )
}

