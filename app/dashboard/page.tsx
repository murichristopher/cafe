"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users,
  Download,
  TrendingUp,
  CheckCircle,
  BarChart4,
  PieChart,
  User,
  Mail,
  Phone,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { EventWithFornecedor, User as UserType } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, isAfter, isBefore, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { eventsToCSV, downloadCSV } from "@/lib/csv-export"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

type FornecedorStats = {
  id: string
  name: string
  eventCount: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventWithFornecedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [stats, setStats] = useState({
    totalEvents: 0,
    thisMonthEvents: 0,
    completionRate: 0,
    statusStats: {
      pendente: 0,
      aguardando_aprovacao: 0,
      concluido: 0,
    },
    fornecedorStats: [] as FornecedorStats[],
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800"
      case "aguardando_aprovacao":
        return "bg-blue-100 text-blue-800"
      case "concluido":
        return "bg-green-100 text-green-800"
      case "cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente"
      case "aguardando_aprovacao":
        return "Aguardando Aprovação"
      case "concluido":
        return "Concluído"
      case "cancelado":
        return "Cancelado"
      default:
        return "Desconhecido"
    }
  }

  // Modificar a função fetchEvents para filtrar eventos por fornecedor
  const fetchEvents = async () => {
    setIsLoading(true)

    try {
      let query = supabase.from("events").select("*, fornecedor:fornecedor_id(id, name, email)")

      if (user?.role === "fornecedor") {
        // Se for fornecedor, filtrar apenas os eventos dele
        query = query.eq("fornecedor_id", user.id)
      }

      const { data: eventsData, error: eventsError } = await query.order("date", { ascending: true })

      if (eventsError) {
        console.error("Erro ao buscar eventos:", eventsError)
        setEvents([])
        return
      }

      // Buscar todos os fornecedores para estatísticas (apenas para admin)
      if (user?.role === "admin") {
        const { data: fornecedores, error: fornecedoresError } = await supabase
          .from("users")
          .select("id, name")
          .eq("role", "fornecedor")

        if (fornecedoresError) {
          console.error("Erro ao buscar fornecedores:", fornecedoresError)
          return
        }

        const events = eventsData as EventWithFornecedor[]
        setEvents(events)
        calculateStats(events, fornecedores as UserType[])
      } else {
        // Para fornecedores, calcular estatísticas apenas dos seus eventos
        const events = eventsData as EventWithFornecedor[]
        setEvents(events)
        calculateStats(events, []) // Passar array vazio para fornecedores
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar a função calculateStats para adaptar-se ao tipo de usuário
  const calculateStats = (eventsData: EventWithFornecedor[], fornecedores: UserType[]) => {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)

    const thisMonth = eventsData.filter((e) => {
      const eventDate = new Date(e.date)
      return isAfter(eventDate, thisMonthStart) && isBefore(eventDate, thisMonthEnd)
    }).length

    // Status stats
    const pendente = eventsData.filter((e) => e.status === "pendente").length
    const aguardandoAprovacao = eventsData.filter((e) => e.status === "aguardando_aprovacao").length
    const concluido = eventsData.filter((e) => e.status === "concluido").length

    // Taxa de conclusão (eventos concluídos / total de eventos não cancelados)
    const nonCancelledEvents = eventsData.filter((e) => e.status !== "cancelado").length
    const completionRate = nonCancelledEvents > 0 ? Math.round((concluido / nonCancelledEvents) * 100) : 0

    // Estatísticas por fornecedor (apenas para admin)
    let fornecedorStats = []

    if (user?.role === "admin") {
      fornecedorStats = fornecedores
        .map((fornecedor) => ({
          id: fornecedor.id,
          name: fornecedor.name,
          eventCount: eventsData.filter((event) => event.fornecedor_id === fornecedor.id).length,
        }))
        .sort((a, b) => b.eventCount - a.eventCount) // Ordenar por quantidade de eventos
    }

    setStats({
      totalEvents: eventsData.length,
      thisMonthEvents: thisMonth,
      completionRate,
      statusStats: {
        pendente,
        aguardando_aprovacao: aguardandoAprovacao,
        concluido,
      },
      fornecedorStats,
    })
  }

  useEffect(() => {
    if (user) {
      fetchEvents()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const handleExportCSV = () => {
    if (events.length === 0) {
      toast({
        title: "Nenhum evento para exportar",
        description: "Não há eventos disponíveis para exportação.",
        variant: "destructive",
      })
      return
    }

    try {
      const csvContent = eventsToCSV(events)
      const today = format(new Date(), "dd-MM-yyyy", { locale: ptBR })
      const filename = `eventos-eleve-cafe-${today}.csv`
      downloadCSV(csvContent, filename)

      toast({
        title: "Exportação concluída",
        description: "Os dados dos eventos foram exportados com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar CSV:", error)
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Modificar o JSX para mostrar conteúdo diferente para fornecedores
  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          {user?.role === "admin" && (
            <>
              <Button
                variant="outline"
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                onClick={handleExportCSV}
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
              <Button
                className="hidden sm:flex bg-yellow-400 text-black hover:bg-yellow-500"
                onClick={() => router.push("/dashboard/events")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Cards principais */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-[#1a1a1a] dark:bg-[#1a1a1a] border-zinc-800 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  {user?.role === "admin" ? "Total de Eventos" : "Seus Eventos"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
                  <Calendar className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] dark:bg-[#1a1a1a] border-zinc-800 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Eventos Este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">{stats.thisMonthEvents}</div>
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] dark:bg-[#1a1a1a] border-zinc-800 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Taxa de Conclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-white">{stats.completionRate}%</div>
                  <CheckCircle className="h-8 w-8 text-purple-400" />
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Gráficos - mostrar apenas para admin */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Status dos eventos */}
            <Card className="bg-[#1a1a1a] dark:bg-[#1a1a1a] border-zinc-800 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart4 className="mr-2 h-5 w-5 text-yellow-400" />
                  Status dos Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Pendentes</span>
                      <span className="text-gray-300">{stats.statusStats.pendente}</span>
                    </div>
                    <Progress
                      value={(stats.statusStats.pendente / stats.totalEvents) * 100 || 0}
                      className="h-2 bg-zinc-800"
                    >
                      <div className="h-full bg-yellow-500" />
                    </Progress>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Aguardando Aprovação</span>
                      <span className="text-gray-300">{stats.statusStats.aguardando_aprovacao}</span>
                    </div>
                    <Progress
                      value={(stats.statusStats.aguardando_aprovacao / stats.totalEvents) * 100 || 0}
                      className="h-2 bg-zinc-800"
                    >
                      <div className="h-full bg-blue-500" />
                    </Progress>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Concluídos</span>
                      <span className="text-gray-300">{stats.statusStats.concluido}</span>
                    </div>
                    <Progress
                      value={(stats.statusStats.concluido / stats.totalEvents) * 100 || 0}
                      className="h-2 bg-zinc-800"
                    >
                      <div className="h-full bg-green-500" />
                    </Progress>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eventos por fornecedor - apenas para admin */}
            {user?.role === "admin" && (
              <Card className="bg-[#1a1a1a] dark:bg-[#1a1a1a] border-zinc-800 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5 text-yellow-400" />
                    Eventos por Fornecedor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.fornecedorStats.map((fornecedor) => (
                      <div key={fornecedor.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{fornecedor.name}</span>
                          <span className="text-gray-300">{fornecedor.eventCount}</span>
                        </div>
                        <Progress
                          value={(fornecedor.eventCount / stats.totalEvents) * 100 || 0}
                          className="h-2 bg-zinc-800"
                        >
                          <div className="h-full bg-yellow-500" />
                        </Progress>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Para fornecedores, mostrar um card com informações específicas */}
            {user?.role === "fornecedor" && (
              <Card className="bg-[#1a1a1a] dark:bg-[#1a1a1a] border-zinc-800 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-yellow-400" />
                    Suas Informações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-300">
                      <Mail className="mr-2 h-4 w-4 text-yellow-500" />
                      Email: {user.email}
                    </div>
                    {user.phone_number && (
                      <div className="flex items-center text-sm text-gray-300">
                        <Phone className="mr-2 h-4 w-4 text-yellow-500" />
                        Telefone: {user.phone_number}
                      </div>
                    )}
                    <div className="mt-4 p-3 bg-yellow-900/20 rounded-md">
                      <p className="text-sm text-yellow-300">
                        Lembre-se de enviar as fotos dos eventos para aprovação. Eventos com todas as fotos enviadas
                        podem ser submetidos para revisão.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Próximos eventos */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {user?.role === "admin" ? "Próximos Eventos" : "Seus Próximos Eventos"}
            </h2>
            {events.length === 0 ? (
              <Card className="bg-[#1a1a1a] dark:bg-[#1a1a1a] border-zinc-800 shadow-md">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <Calendar className="h-12 w-12 text-gray-400" />
                  <CardDescription className="mt-4 text-center text-gray-400">
                    Nenhum evento encontrado. {user?.role === "admin" && "Crie um novo evento para começar."}
                  </CardDescription>
                  {user?.role === "admin" && (
                    <Button className="mt-4 btn-eleve" onClick={() => router.push("/dashboard/events")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Evento
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events
                  .filter((event) => new Date(event.date) > new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 3)
                  .map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link href={`/dashboard/events/${event.id}`}>
                        <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg bg-[#1a1a1a] dark:bg-[#1a1a1a] border-zinc-800">
                          {event.event_image && (
                            <div className="relative w-full h-40 overflow-hidden">
                              <img
                                src={event.event_image || "/placeholder.svg"}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge className={getStatusColor(event.status)}>{getStatusText(event.status)}</Badge>
                            </div>
                            <CardTitle className="text-lg mt-2 text-white">{event.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center text-sm text-gray-400">
                              <Calendar className="mr-2 h-4 w-4 text-yellow-500" />
                              {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                            <div className="flex items-center text-sm text-gray-400">
                              <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                              {format(new Date(event.date), "HH:mm", { locale: ptBR })}
                            </div>
                            <div className="flex items-center text-sm text-gray-400">
                              <MapPin className="mr-2 h-4 w-4 text-yellow-500" />
                              {event.location}
                            </div>
                            {event.pax !== null && event.pax !== undefined && (
                              <div className="flex items-center text-sm text-gray-400">
                                <Users className="mr-2 h-4 w-4 text-yellow-500" />
                                {event.pax} {event.pax === 1 ? "pessoa" : "pessoas"}
                              </div>
                            )}
                            {user?.role === "admin" && event.fornecedor && (
                              <div className="flex items-center text-sm text-gray-400">
                                <Users className="mr-2 h-4 w-4 text-yellow-500" />
                                Fornecedor: {event.fornecedor.name}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      {user?.role === "admin" && (
        <motion.div
          className="fixed bottom-20 md:bottom-6 right-6 z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Button
            className="h-14 w-14 rounded-full btn-eleve shadow-lg"
            size="icon"
            onClick={() => router.push("/dashboard/events")}
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Adicionar evento</span>
          </Button>
        </motion.div>
      )}
    </div>
  )
}

