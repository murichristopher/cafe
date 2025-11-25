"use client"

import { useState, useEffect, useRef } from "react"
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  // Initialize filters from URL query params or localStorage (per-user)
  const getInitialFilters = () => {
    try {
      const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
      const status = urlParams.get("status") || ""
      const startDate = urlParams.get("startDate") || ""
      const endDate = urlParams.get("endDate") || ""
      const search = urlParams.get("search") || ""
      const fornecedor = urlParams.get("fornecedor") || ""
      const pagamento = urlParams.get("pagamento") || ""

      // If any param present, prefer URL
      const hasUrl = status || startDate || endDate || search || fornecedor || pagamento
      if (hasUrl) {
        return { status, startDate, endDate, search, fornecedor, pagamento }
      }

      // Fallback to localStorage per user
      const cacheKey = `events_filters_${user?.id || "guest"}`
      const stored = localStorage.getItem(cacheKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn("Erro ao obter filtros iniciais:", e)
    }

    return { status: "", startDate: "", endDate: "", search: "", fornecedor: "", pagamento: "" }
  }

  const [filters, setFilters] = useState(() => getInitialFilters())
  const isFetchingRef = useRef(false)

  // Função para tentar carregar eventos com timeout e retries
  const loadEvents = async (retry = 0) => {
    // Prevent concurrent loads
    if (isFetchingRef.current) {
      console.log("loadEvents: fetch already in progress, skipping")
      return
    }
    isFetchingRef.current = true
    setIsLoading(true)
    setHasError(false)
    
    try {
      console.log(`Iniciando carregamento de eventos (tentativa ${retry + 1}/3)`)
      // Definir um tempo limite para a operação (8 segundos)
      // O timeout resolve um sentinel em vez de rejeitar para evitar erros não tratados
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ __timeout: true }), 8000)
      })

      // Executar a busca com limite de tempo e tratar sentinel
      const result = await Promise.race([fetchEvents(), timeoutPromise])
      if (result && (result as any).__timeout) {
        throw new Error("Timeout ao carregar eventos")
      }
      console.log("Eventos carregados com sucesso")
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
      isFetchingRef.current = false
    }
  }

  const fetchEvents = async () => {
    try {
      // Verificar se temos os dados do usuário
      if (!user || !user.id) {
        console.error("Tentativa de carregar eventos sem dados de usuário");
        return;
      }

  // Se for fornecedor, primeira buscar todos os eventos e depois filtrar pelo nome
      if (user?.role === "fornecedor") {
        if (!user.name) {
          console.error("Nome do fornecedor não disponível, não é possível filtrar");
          setEvents([]);
          return;
        }
        
        console.log("Filtrando por fornecedor usando o nome:", user.name);
        console.log("ID do fornecedor logado:", user.id);

        // Abordagem mais direta: buscar primeiro os IDs de eventos associados a este fornecedor
        console.log("Buscando IDs de eventos onde este fornecedor está associado");
        
        // 1. Eventos onde o usuário é fornecedor principal
        const { data: eventsPrincipal, error: errorPrincipal } = await supabase
          .from("events")
          .select("id")
          .eq("fornecedor_id", user.id);
          
        if (errorPrincipal) {
          console.error("Erro ao buscar eventos como fornecedor principal:", errorPrincipal);
        }
        
        // 2. Eventos onde o usuário está na tabela de relacionamentos
        const { data: eventsRelacionados, error: errorRelacionados } = await supabase
          .from("event_fornecedores")
          .select("event_id")
          .eq("fornecedor_id", user.id);
          
        if (errorRelacionados) {
          console.error("Erro ao buscar eventos relacionados:", errorRelacionados);
        }
        
  // Juntar os IDs e remover duplicatas
  let eventIdsList: string[] = [];
        
        if (eventsPrincipal && eventsPrincipal.length > 0) {
          eventIdsList = [...eventsPrincipal.map((e) => e.id)];
          console.log(`Encontrados ${eventIdsList.length} eventos como fornecedor principal`);
        }

        if (eventsRelacionados && eventsRelacionados.length > 0) {
          eventIdsList = [...eventIdsList, ...eventsRelacionados.map((e) => e.event_id)];
          console.log(`Total após adicionar eventos relacionados: ${eventIdsList.length}`);
        }

        // Remover duplicatas
        const uniqueEventIds = [...new Set(eventIdsList)];
        console.log(`IDs únicos após remover duplicatas: ${uniqueEventIds.length}`);
        
        if (uniqueEventIds.length === 0) {
          console.log("Nenhum evento encontrado para este fornecedor");
          setEvents([]);
          setIsLoading(false);
          return;
        }
        
        // Buscar os eventos com os IDs permitidos
        // Aplicar filtros básicos antes de buscar os eventos
        let finalQuery = supabase.from("events").select("*").in("id", uniqueEventIds);
        
        // Aplicar filtros adicionais
        if (filters.status) {
          finalQuery = finalQuery.eq("status", filters.status);
        }

        if (filters.pagamento) {
          finalQuery = finalQuery.eq("pagamento", filters.pagamento);
        }

        // Ignorar eventos concluídos se showCompleted for false
        if (!showCompleted) {
          finalQuery = finalQuery.neq("status", "concluido");
        }

        if (filters.startDate) {
          finalQuery = finalQuery.gte("date", filters.startDate);
        }

        if (filters.endDate) {
          // Adicionar um dia ao endDate para incluir eventos do próprio dia
          const endDate = new Date(filters.endDate);
          endDate.setDate(endDate.getDate() + 1);
          finalQuery = finalQuery.lt("date", endDate.toISOString());
        }
        
        if (filters.search) {
          finalQuery = finalQuery.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
          );
        }

        // Ordenar por data
        finalQuery = finalQuery.order("date", { ascending: false });
        
        // Executar a consulta final
        const { data: filteredEvents, error: finalError } = await finalQuery;
        
        if (finalError) {
          console.error("Erro ao buscar eventos filtrados:", finalError);
          throw finalError;
        }
        
        console.log(`Eventos encontrados após aplicar filtros: ${filteredEvents?.length || 0}`);
        
        // Agora buscar os detalhes dos fornecedores para todos os eventos em lote
  const eventIdsForFiltered = (filteredEvents || []).map((e) => e.id)

        // Buscar todas as relações event_fornecedores de uma vez
        const { data: allEventFornecedores } = await supabase
          .from("event_fornecedores")
          .select("event_id, fornecedor_id")
          .in("event_id", eventIdsForFiltered)

        // Mapear event_id -> fornecedor_ids[]
        const mapping = new Map<string, Set<string>>()
        if (allEventFornecedores) {
          allEventFornecedores.forEach((row: any) => {
            if (!mapping.has(row.event_id)) mapping.set(row.event_id, new Set())
            mapping.get(row.event_id)!.add(row.fornecedor_id)
          })
        }

        // Coletar todos os fornecedor ids únicos (incluindo fornecedor_id direto nos eventos)
        const fornecedorIdSet = new Set<string>()
        ;(filteredEvents || []).forEach((ev: any) => {
          if (ev.fornecedor_id) fornecedorIdSet.add(ev.fornecedor_id)
          const s = mapping.get(ev.id)
          if (s) s.forEach((id) => fornecedorIdSet.add(id))
        })

        const fornecedorIds = Array.from(fornecedorIdSet)

        let fornecedoresData: any[] = []
        if (fornecedorIds.length > 0) {
          const { data: fetchedFornecedores, error: fornecedoresDataError } = await supabase
            .from("users")
            .select("*")
            .in("id", fornecedorIds)

          if (!fornecedoresDataError && fetchedFornecedores) {
            fornecedoresData = fetchedFornecedores
          }
        }

        // Construir mapa id->user
        const fornecedorById = new Map<string, any>()
        fornecedoresData.forEach((f) => fornecedorById.set(f.id, f))

        // Montar eventos finais com lista de fornecedores
        const eventsWithFornecedores = (filteredEvents || []).map((event: any) => {
          const setIds = mapping.get(event.id) || new Set<string>()
          const ids = Array.from(setIds)
          if (event.fornecedor_id) ids.push(event.fornecedor_id)
          const uniqueIds = Array.from(new Set(ids))
          const fornecedores = uniqueIds.map((id) => fornecedorById.get(id)).filter(Boolean)
          return { ...event, fornecedores }
        })

        setEvents(eventsWithFornecedores as EventWithFornecedores[])
        
        // Salvar no localStorage para cache com chave específica por usuário
        const cacheKey = `cached_events_${user?.id || 'guest'}`;
        const timestampKey = `cached_events_timestamp_${user?.id || 'guest'}`;
        localStorage.setItem(cacheKey, JSON.stringify(eventsWithFornecedores));
        localStorage.setItem(timestampKey, Date.now().toString());
        
        setIsLoading(false);
        return;
      }
      
  // Para administradores, continuar com a lógica original
      // Construir a consulta base
      let query = supabase.from("events").select("*")
      
      // Aplicar filtros adicionais
      if (filters.status) {
        query = query.eq("status", filters.status)
      }

      if (filters.pagamento) {
        query = query.eq("pagamento", filters.pagamento)
      }

      // Ignorar eventos concluídos se showCompleted for false
      if (!showCompleted) {
        query = query.neq("status", "concluido")
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

      // Filtrar por fornecedor específico se o filtro estiver ativo (apenas para admin)
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

      // Executar a consulta
      const { data, error } = await query
      console.log(`Total de eventos retornados: ${data?.length || 0}`)

      if (error) {
        console.error("Erro ao buscar eventos:", error)
        toast({
          title: "Erro ao carregar eventos",
          description: "Não foi possível carregar a lista de eventos.",
          variant: "destructive",
        })
        return
      }

      // Para reduzir round-trips, buscar todas as relações event_fornecedores e usuários em lote
      const eventIds = (data || []).map((e: any) => e.id)

      // Buscar todas as relações de uma vez
      const { data: allEventFornecedores } = await supabase
        .from("event_fornecedores")
        .select("event_id, fornecedor_id")
        .in("event_id", eventIds)

      const mapping = new Map<string, Set<string>>()
      if (allEventFornecedores) {
        allEventFornecedores.forEach((row: any) => {
          if (!mapping.has(row.event_id)) mapping.set(row.event_id, new Set())
          mapping.get(row.event_id)!.add(row.fornecedor_id)
        })
      }

      const fornecedorIdSet = new Set<string>()
      ;(data || []).forEach((ev: any) => {
        if (ev.fornecedor_id) fornecedorIdSet.add(ev.fornecedor_id)
        const s = mapping.get(ev.id)
        if (s) s.forEach((id) => fornecedorIdSet.add(id))
      })

      const fornecedorIds = Array.from(fornecedorIdSet)

      let fornecedoresData: any[] = []
      if (fornecedorIds.length > 0) {
        const { data: fetchedFornecedores, error: fornecedoresDataError } = await supabase
          .from("users")
          .select("*")
          .in("id", fornecedorIds)

        if (!fornecedoresDataError && fetchedFornecedores) {
          fornecedoresData = fetchedFornecedores
        }
      }

      const fornecedorById = new Map<string, any>()
      fornecedoresData.forEach((f) => fornecedorById.set(f.id, f))

      const eventsWithFornecedores = (data || []).map((event: any) => {
        const setIds = mapping.get(event.id) || new Set<string>()
        const ids = Array.from(setIds)
        if (event.fornecedor_id) ids.push(event.fornecedor_id)
        const uniqueIds = Array.from(new Set(ids))
        const fornecedores = uniqueIds.map((id) => fornecedorById.get(id)).filter(Boolean)
        return { ...event, fornecedores }
      })

      setEvents(eventsWithFornecedores as EventWithFornecedores[])
      
      // Salvar no localStorage para cache com chave específica por usuário
      const cacheKey = `cached_events_${user?.id || 'guest'}`
      const timestampKey = `cached_events_timestamp_${user?.id || 'guest'}`
      localStorage.setItem(cacheKey, JSON.stringify(eventsWithFornecedores))
      localStorage.setItem(timestampKey, Date.now().toString())
    } catch (error) {
      console.error("Erro ao buscar eventos:", error)
      
      // Tentar usar cache como fallback
      try {
        const cacheKey = `cached_events_${user?.id || 'guest'}`
        const timestampKey = `cached_events_timestamp_${user?.id || 'guest'}`
        const cachedEvents = localStorage.getItem(cacheKey)
        const timestamp = localStorage.getItem(timestampKey)
        
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

  // Effect para limpar eventos e estados quando o componente é montado
  useEffect(() => {
    console.log("Componente de eventos montado, limpando estados")
    // Limpar eventos para garantir que não fiquem dados anteriores
    setEvents([])
    setIsLoading(true)
    setHasError(false)
    
    // Também limpar o localStorage se o fornecedor estiver vendo a página
    // Isso garante que não teremos cache incorreto após recarregar a página
    if (user?.role === "fornecedor") {
      const cacheKey = `cached_events_${user?.id || 'guest'}`
      const timestampKey = `cached_events_timestamp_${user?.id || 'guest'}`
      localStorage.removeItem(cacheKey)
      localStorage.removeItem(timestampKey)
      console.log("Cache de eventos de fornecedor limpo")
    }
  }, []) // Este efeito roda apenas uma vez, na montagem

  // Effect para carregar eventos ao montar o componente e quando filtros mudarem
  useEffect(() => {
    // Só prosseguir se tivermos dados do usuário
    if (!user || !user.id) {
      console.log("Aguardando dados do usuário para carregar eventos...")
      return;
    }

    console.log("Iniciando carregamento de eventos com usuário:", user.role, user.id, user.name);
    
    // Primeiro verificamos se temos dados em cache recente para mostrar
    const cacheKey = `cached_events_${user?.id || 'guest'}`
    const timestampKey = `cached_events_timestamp_${user?.id || 'guest'}`
    const cachedEvents = localStorage.getItem(cacheKey)
    const timestamp = localStorage.getItem(timestampKey)
    
    // Para fornecedores, sempre recarregar para garantir que a filtragem por nome funcione
    if (user?.role === "fornecedor") {
      console.log("Fornecedor identificado, carregando eventos filtrados...", user.name)
      // Limpar eventos atuais antes de recarregar para evitar mostrar dados incorretos
      setEvents([])
      loadEvents(0)
      return
    }
    
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
  }, [filters, showCompleted, user])


  // Sync filters & showCompleted to URL and localStorage when they change
  useEffect(() => {
    try {
      const qs = new URLSearchParams()
      if (filters.status) qs.set("status", filters.status)
      if (filters.startDate) qs.set("startDate", filters.startDate)
      if (filters.endDate) qs.set("endDate", filters.endDate)
      if (filters.search) qs.set("search", filters.search)
      if (filters.fornecedor) qs.set("fornecedor", filters.fornecedor)
      if (filters.pagamento) qs.set("pagamento", filters.pagamento)

      // include showCompleted for completeness
      if (showCompleted) qs.set("showCompleted", "1")

      const newUrl = `${window.location.pathname}?${qs.toString()}`
      // Use history API to avoid navigation
      window.history.replaceState({}, "", qs.toString() ? newUrl : window.location.pathname)

      // Persist to localStorage per user
      const cacheKey = `events_filters_${user?.id || "guest"}`
      localStorage.setItem(cacheKey, JSON.stringify(filters))
      localStorage.setItem(`${cacheKey}_showCompleted`, showCompleted ? "1" : "0")
      localStorage.setItem(`${cacheKey}_ts`, Date.now().toString())
    } catch (e) {
      console.warn("Erro ao sincronizar filtros:", e)
    }
  }, [filters, showCompleted, user?.id])

  // Restore filters from URL/localStorage when navigating with back/forward
  useEffect(() => {
    const handlePop = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const status = urlParams.get("status") || ""
        const startDate = urlParams.get("startDate") || ""
        const endDate = urlParams.get("endDate") || ""
        const search = urlParams.get("search") || ""
        const fornecedor = urlParams.get("fornecedor") || ""
        const pagamento = urlParams.get("pagamento") || ""
        const show = urlParams.get("showCompleted") === "1"

        // If url has any params, apply them
        const hasUrl = status || startDate || endDate || search || fornecedor || pagamento || urlParams.has("showCompleted")
        if (hasUrl) {
          setFilters({ status, startDate, endDate, search, fornecedor, pagamento })
          setShowCompleted(show)
          return
        }

        // Otherwise try localStorage
        const cacheKey = `events_filters_${user?.id || "guest"}`
        const stored = localStorage.getItem(cacheKey)
        const showStored = localStorage.getItem(`${cacheKey}_showCompleted`)
        if (stored) {
          setFilters(JSON.parse(stored))
          setShowCompleted(showStored === "1")
        }
      } catch (e) {
        console.warn("Erro ao restaurar filtros no popstate:", e)
      }
    }

    window.addEventListener("popstate", handlePop)
    return () => window.removeEventListener("popstate", handlePop)
  }, [user?.id])

  // Effect para detectar quando o usuário volta à aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Verificar se temos dados do usuário antes de tentar recarregar
        if (!user || !user.id) {
          console.log("Usuário não carregado completamente, aguardando dados para recarregar eventos");
          return;
        }
        
        // Aguardar um momento e verificar se os dados precisam ser recarregados
        setTimeout(() => {
          const cacheKey = `cached_events_${user?.id || 'guest'}`
          const timestampKey = `cached_events_timestamp_${user?.id || 'guest'}`
          const timestamp = localStorage.getItem(timestampKey)
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
  }, [user?.id])

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

        <div className="flex flex-col gap-4">
          <EventFilters 
            filters={filters} 
            setFilters={setFilters} 
            showFornecedorFilter={user?.role === "admin"} 
            showCompleted={showCompleted}
            setShowCompleted={setShowCompleted}
          />
          
          <div className="flex justify-end">
            <div className="bg-zinc-900 rounded-lg p-2 border border-zinc-800 flex gap-2">
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
                  <TableHead>Cidade</TableHead>
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
                      <TableCell>{event.cidade || "-"}</TableCell>
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

