"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, MessageSquare, Calendar, MapPin, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type EventoComRegistros = {
  id: string
  title: string
  date: string
  location: string
  status: string
  total_registros: number
}

type Registro = {
  id: string
  nome: string
  telefone: string
  cargo?: string | null
  foto_url?: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  aguardando_aprovacao: "Em Revisão",
  concluido: "Concluído",
}

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  confirmado: "bg-green-500/10 text-green-400 border-green-500/30",
  cancelado: "bg-red-500/10 text-red-400 border-red-500/30",
  aguardando_aprovacao: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  concluido: "bg-purple-500/10 text-purple-400 border-purple-500/30",
}

export default function RegistrosPage() {
  const router = useRouter()
  const [eventos, setEventos] = useState<EventoComRegistros[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [registros, setRegistros] = useState<Record<string, Registro[]>>({})
  const [loadingRegistros, setLoadingRegistros] = useState<string | null>(null)

  const fetchEventos = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/registros")
      const data = await res.json()
      if (data.eventos) setEventos(data.eventos)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEventos()
  }, [])

  const fetchRegistros = async (eventId: string) => {
    if (registros[eventId]) return
    setLoadingRegistros(eventId)
    try {
      const res = await fetch(`/api/eventos/${eventId}/registros`)
      const data = await res.json()
      if (data.registros) {
        setRegistros((prev) => ({ ...prev, [eventId]: data.registros }))
      }
    } catch {
      // silently fail
    } finally {
      setLoadingRegistros(null)
    }
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      fetchRegistros(id)
    }
  }

  const eventosFiltrados = useMemo(() => {
    if (!search.trim()) return eventos
    const q = search.toLowerCase()
    return eventos.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    )
  }, [eventos, search])

  const totalRespostas = eventos.reduce((sum, e) => sum + e.total_registros, 0)

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-5 px-3 sm:px-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Registros de Eventos</h1>
          <p className="text-muted-foreground text-sm">
            {eventos.length} evento{eventos.length !== 1 ? "s" : ""} com{" "}
            {totalRespostas} resposta{totalRespostas !== 1 ? "s" : ""} no total
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchEventos}
          className="border-zinc-700 w-fit"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {/* Pesquisa */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar evento ou local..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[#111] border-zinc-700"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <MessageSquare className="h-12 w-12 text-zinc-700 mx-auto" />
          <p className="text-muted-foreground">
            {search ? "Nenhum evento encontrado com essa busca." : "Nenhum evento com registros ainda."}
          </p>
          <p className="text-xs text-zinc-600">
            Compartilhe o link de um evento para receber registros.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventosFiltrados.map((evento) => {
            const isExpanded = expandedId === evento.id
            const regs = registros[evento.id] || []
            const isLoadingRegs = loadingRegistros === evento.id

            return (
              <Card
                key={evento.id}
                className="border-zinc-800 bg-[#1a1a1a] overflow-hidden"
              >
                {/* Card header — clicável para expandir */}
                <button
                  type="button"
                  onClick={() => toggleExpand(evento.id)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-start gap-3">
                      {/* Contador de respostas */}
                      <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span className="text-lg font-bold text-amber-400 leading-none">
                          {evento.total_registros}
                        </span>
                        <span className="text-[9px] text-amber-400/70 leading-none mt-0.5">resp.</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white leading-tight truncate">
                            {evento.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${STATUS_COLORS[evento.status] || ""}`}
                          >
                            {STATUS_LABELS[evento.status] || evento.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {format(new Date(evento.date), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                          {evento.location && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{evento.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-zinc-400 hover:text-white border border-zinc-700 h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/events/${evento.id}`)
                          }}
                        >
                          Ver evento
                        </Button>
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-zinc-500" />
                          : <ChevronDown className="h-4 w-4 text-zinc-500" />
                        }
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {/* Registros expandidos */}
                {isExpanded && (
                  <CardContent className="pt-0 px-4 pb-4">
                    <div className="border-t border-zinc-800 pt-3 space-y-2">
                      {isLoadingRegs ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando registros...
                        </div>
                      ) : regs.length === 0 ? (
                        <p className="text-center py-4 text-sm text-muted-foreground">
                          Nenhum registro encontrado.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {regs.map((reg) => (
                            <div
                              key={reg.id}
                              className="flex items-center gap-3 rounded-lg bg-zinc-900/60 p-2.5"
                            >
                              {reg.foto_url ? (
                                <img
                                  src={reg.foto_url}
                                  alt={reg.nome}
                                  className="h-10 w-10 rounded-lg object-cover border border-zinc-700 shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                  <span className="text-base font-bold text-zinc-500">
                                    {reg.nome.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-white leading-tight">{reg.nome}</p>
                                <p className="text-xs text-muted-foreground">{reg.telefone}</p>
                                {reg.cargo && (
                                  <p className="text-xs text-amber-400/80 mt-0.5">{reg.cargo}</p>
                                )}
                              </div>
                              <p className="text-xs text-zinc-600 shrink-0 text-right">
                                {format(new Date(reg.created_at), "dd/MM HH:mm")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
