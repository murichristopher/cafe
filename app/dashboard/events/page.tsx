"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Download, FileSpreadsheet, Loader2, Trash2, Grid, List, Eye, Edit } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { EventWithFornecedores, User } from "@/types"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/event-card"
import { EventFilters } from "@/components/event-filters"
import { useToast } from "@/hooks/use-toast"
import { exportEventsToCSV } from "@/lib/csv-export"
import { exportEventsToExcel } from "@/lib/excel-export"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function EventsPage() {
  const { user, refreshAuth } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [events, setEvents] = useState<EventWithFornecedores[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<"csv" | "excel" | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    search: "",
    fornecedor: "",
    pagamento: "",
  })

  // Função para tentar carregar eventos com timeout e retries
  const loadEvents = async (retry = 0) => {
    setIsLoading(true)
    setHasError(false)
    
    try {
      // Definir um tempo limite para a operação (8 segundos)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao carregar eventos")), 8000)
      })
      
      // Executar a busca com limite de tempo
      await Promise.race([fetchEvents(), timeoutPromise])
    } catch (error) {
      console.error(`Erro ao carregar eventos (tentativa ${retry + 1}/3):`, error)
      
      // Se for a primeira tentativa com erro, tentamos renovar a sessão
      if (retry === 0) {
        try {
          console.log("Renovando sessão antes de tentar novamente...")
          await refreshAuth()
          // Tentar novamente após renovar
          return loadEvents(retry + 1)
        } catch (authError) {
          console.error("Erro ao renovar sessão:", authError)
        }
      }
      
      // Se ainda tiver tentativas, aguardar e tentar novamente
      if (retry < 2) {
        const waitTime = Math.pow(2, retry) * 1000
        console.log(`Tentando novamente em ${waitTime}ms...`)
        setTimeout(() => loadEvents(retry + 1), waitTime)
      } else {
        // Mostrar erro se esgotaram as tentativas
        setHasError(true)
        toast({
          title: "Erro ao carregar eventos",
          description: "Não foi possível carregar os eventos após várias tentativas.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      let query = supabase.from("events").select("*")

      // Aplicar filtros
      if (filters.status) {
        query = query.eq("status", filters.status)
      }

      if (filters.pagamento) {
        query = query.eq("pagamento", filters.pagamento)
      }

      if (filters.startDate) {
        query = query.gte("date", filters.startDate)
      }

      if (filters.endDate) {
        // Adicionar um dia ao endDate para incluir eventos do próprio dia
        const endDate = new Date(filters.endDate)
        endDate.setDate(endDate.getDate() + 1)
        query = query.lt("date", endDate.toISOString())
      }

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`,
        )
      }

      // Se o usuário for fornecedor, mostrar apenas eventos associados a ele
      if (user?.role === "fornecedor") {
        // Buscar eventos onde o usuário é um dos fornecedores
        const { data: eventFornecedores, error: fornecedoresError } = await supabase
          .from("event_fornecedores")
          .select("event_id")
          .eq("fornecedor_id", user.id)

        if (fornecedoresError) {
          console.error("Erro ao buscar eventos do fornecedor:", fornecedoresError)
          return
        }

        // Se não houver eventos associados, mostrar lista vazia
        if (!eventFornecedores || eventFornecedores.length === 0) {
          setEvents([])
          setIsLoading(false)
          return
        }

        // Buscar eventos onde o usuário é um dos fornecedores ou o fornecedor principal
        const eventIds = eventFornecedores.map((ef) => ef.event_id)
        query = query.or(`id.in.(${eventIds.join(",")}),fornecedor_id.eq.${user.id}`)
      }

      // Filtrar por fornecedor específico se o filtro estiver ativo
      if (filters.fornecedor && user?.role === "admin") {
        // Buscar eventos onde o fornecedor específico está associado
        const { data: eventFornecedores, error: fornecedoresError } = await supabase
          .from("event_fornecedores")
          .select("event_id")
          .eq("fornecedor_id", filters.fornecedor)

        if (fornecedoresError) {
          console.error("Erro ao buscar eventos do fornecedor:", fornecedoresError)
        } else if (eventFornecedores && eventFornecedores.length > 0) {
          const eventIds = eventFornecedores.map((ef) => ef.event_id)
          query = query.or(`id.in.(${eventIds.join(",")}),fornecedor_id.eq.${filters.fornecedor}`)
        } else {
          // Se não houver eventos associados a este fornecedor, filtrar apenas pelo fornecedor_id
          query = query.eq("fornecedor_id", filters.fornecedor)
        }
      }

      // Ordenar por data
      query = query.order("date", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar eventos:", error)
        toast({
          title: "Erro ao carregar eventos",
          description: "Não foi possível carregar a lista de eventos.",
          variant: "destructive",
        })
        return
      }

      // Para cada evento, buscar os fornecedores associados
      const eventsWithFornecedores = await Promise.all(
        data.map(async (event) => {
          // Buscar os fornecedores associados ao evento
          const { data: eventFornecedores, error: fornecedoresError } = await supabase
            .from("event_fornecedores")
            .select("fornecedor_id")
            .eq("event_id", event.id)

          if (fornecedoresError) {
            console.error("Erro ao buscar fornecedores do evento:", fornecedoresError)
            return { ...event, fornecedores: [] }
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
          if (fornecedoresList.length === 0 && event.fornecedor_id) {
            const { data: fornecedorData, error: fornecedorError } = await supabase
              .from("users")
              .select("*")
              .eq("id", event.fornecedor_id)
              .single()

            if (!fornecedorError && fornecedorData) {
              fornecedoresList = [fornecedorData]
            }
          }

          return { ...event, fornecedores: fornecedoresList }
        }),
      )

      setEvents(eventsWithFornecedores as EventWithFornecedores[])
      
      // Salvar no localStorage para cache
      localStorage.setItem('cached_events', JSON.stringify(eventsWithFornecedores))
      localStorage.setItem('cached_events_timestamp', Date.now().toString())
    } catch (error) {
      console.error("Erro ao buscar eventos:", error)
      
      // Tentar usar cache como fallback
      try {
        const cachedEvents = localStorage.getItem('cached_events')
        const timestamp = localStorage.getItem('cached_events_timestamp')
        
        if (cachedEvents && timestamp) {
          const age = Date.now() - Number(timestamp)
          // Usar cache se tiver menos de 1 hora
          if (age < 60 * 60 * 1000) {
            console.log("Usando cache de eventos como fallback")
            setEvents(JSON.parse(cachedEvents))
            return
          }
        }
      } catch (cacheError) {
        console.error("Erro ao usar cache de eventos:", cacheError)
      }
      
      // Se não conseguiu usar o cache, propagar o erro para ser tratado em loadEvents
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Função para recarregar eventos (pode ser chamada por um botão)
  const handleRetry = async () => {
    await loadEvents(0)
  }

  // Effect para carregar eventos ao montar o componente e quando filtros mudarem
  useEffect(() => {
    // Primeiro verificamos se temos dados em cache recente para mostrar
    const cachedEvents = localStorage.getItem('cached_events')
    const timestamp = localStorage.getItem('cached_events_timestamp')
    
    if (cachedEvents && timestamp) {
      const age = Date.now() - Number(timestamp)
      // Se o cache tem menos de 5 minutos, usamos ele primeiro
      if (age < 5 * 60 * 1000) {
        console.log("Usando cache de eventos para carregamento inicial")
        setEvents(JSON.parse(cachedEvents))
        setIsLoading(false)
        
        // Mesmo usando o cache, iniciamos um carregamento em segundo plano
        setTimeout(() => {
          loadEvents(0)
        }, 1000)
        return
      }
    }
    
    // Se não temos cache recente, carregamos normalmente
    loadEvents(0)
  }, [filters])

  // Effect para detectar quando o usuário volta à aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Aguardar um momento e verificar se os dados precisam ser recarregados
        setTimeout(() => {
          const timestamp = localStorage.getItem('cached_events_timestamp')
          if (!timestamp || (Date.now() - Number(timestamp) > 5 * 60 * 1000)) {
            console.log("Recarregando eventos após retornar à aba")
            loadEvents(0)
          }
        }, 1000)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleExport = async (type: "csv" | "excel") => {
    setIsExporting(true)
    setExportType(type)

    try {
      if (type === "csv") {
        await exportEventsToCSV(events)
        toast({
          title: "Exportação concluída",
          description: "Os eventos foram exportados com sucesso para CSV.",
        })
      } else {
        await exportEventsToExcel(events)
        toast({
          title: "Exportação concluída",
          description: "Os eventos foram exportados com sucesso para Excel.",
        })
      }
    } catch (error) {
      console.error(`Erro ao exportar eventos para ${type}:`, error)
      toast({
        title: "Erro na exportação",
        description: `Não foi possível exportar os eventos para ${type === "csv" ? "CSV" : "Excel"}.`,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setExportType(null)
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    setIsDeleting(true)
    try {
      // Primeiro, excluir as relações na tabela event_fornecedores
      const { error: relationsError } = await supabase.from("event_fornecedores").delete().eq("event_id", eventToDelete)

      if (relationsError) {
        console.error("Erro ao excluir relações do evento:", relationsError)
        // Continuar mesmo com erro, para tentar excluir o evento principal
      }

      // Depois, excluir o evento
      const { error } = await supabase.from("events").delete().eq("id", eventToDelete)

      if (error) {
        throw error
      }

      // Atualizar a lista de eventos
      setEvents(events.filter((event) => event.id !== eventToDelete))

      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir evento:", error)
      toast({
        title: "Erro ao excluir evento",
        description: "Não foi possível excluir o evento.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setEventToDelete(null)
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmado":
        return "Confirmado"
      case "cancelado":
        return "Cancelado"
      case "aguardando_aprovacao":
        return "Aguardando Aprovação"
      case "concluido":
        return "Concluído"
      default:
        return "Pendente"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "text-green-600"
      case "cancelado":
        return "text-red-600"
      case "aguardando_aprovacao":
        return "text-amber-600"
      case "concluido":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            {user?.role === "admin" && (
              <>
                <Button
                  onClick={() => router.push("/dashboard/events/new")}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Evento
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-zinc-700 text-white"
                      disabled={isExporting || events.length === 0}
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exportando {exportType === "csv" ? "CSV" : "Excel"}...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Exportar
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("excel")}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <EventFilters filters={filters} setFilters={setFilters} showFornecedorFilter={user?.role === "admin"} />

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-yellow-400 hover:bg-yellow-500 text-black" : ""}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              className={viewMode === "table" ? "bg-yellow-400 hover:bg-yellow-500 text-black" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-lg text-red-500 mb-4">Erro ao carregar eventos</p>
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Tentar novamente
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-lg text-gray-500 mb-4">Nenhum evento encontrado</p>
            {user?.role === "admin" && (
              <Button
                onClick={() => router.push("/dashboard/events/new")}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Novo Evento
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EventCard event={event} showActions={true} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fornecedores</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const eventDate = new Date(event.date)
                  const formattedDate = format(eventDate, "dd/MM/yyyy", { locale: ptBR })
                  const formattedTime = format(eventDate, "HH:mm", { locale: ptBR })

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>
                        {formattedDate} às {formattedTime}
                      </TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        <span className={getStatusColor(event.status)}>{getStatusText(event.status)}</span>
                      </TableCell>
                      <TableCell>
                        {event.fornecedores && event.fornecedores.length > 0
                          ? event.fornecedores.map((f) => f.name).join(", ")
                          : "Nenhum"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(`/dashboard/events/${event.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user?.role === "admin" && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => setEventToDelete(event.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir evento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o evento "{event.title}"? Esta ação não pode ser
                                      desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setEventToDelete(null)}>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteEvent}
                                      className="bg-red-500 hover:bg-red-600"
                                      disabled={isDeleting}
                                    >
                                      {isDeleting ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Excluindo...
                                        </>
                                      ) : (
                                        "Excluir"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

