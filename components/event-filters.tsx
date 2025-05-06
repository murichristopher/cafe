"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon, X, Search, Filter } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import type { User } from "@/types"

interface EventFiltersProps {
  filters: {
    status: string
    startDate: string
    endDate: string
    search: string
    fornecedor?: string
    pagamento?: string
  }
  setFilters: React.Dispatch<
    React.SetStateAction<{
      status: string
      startDate: string
      endDate: string
      search: string
      fornecedor?: string
      pagamento?: string
    }>
  >
  showFornecedorFilter?: boolean
  showCompleted: boolean
  setShowCompleted: (show: boolean) => void
}

export function EventFilters({ 
  filters, 
  setFilters, 
  showFornecedorFilter = false,
  showCompleted,
  setShowCompleted
}: EventFiltersProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(filters.endDate ? new Date(filters.endDate) : undefined)
  const [fornecedores, setFornecedores] = useState<User[]>([])
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    // Só buscar fornecedores se o filtro estiver habilitado
    if (showFornecedorFilter) {
      const fetchFornecedores = async () => {
        const { data, error } = await supabase.from("users").select("*").eq("role", "fornecedor").order("name")

        if (!error && data) {
          setFornecedores(data)
        }
      }

      fetchFornecedores()
    }
  }, [showFornecedorFilter])

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date)
    setFilters((prev) => ({
      ...prev,
      startDate: date ? date.toISOString() : "",
    }))
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date)
    setFilters((prev) => ({
      ...prev,
      endDate: date ? date.toISOString() : "",
    }))
  }

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "todos" ? "" : value,
    }))
  }

  const handleFornecedorChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      fornecedor: value === "todos" ? "" : value,
    }))
  }

  const handlePagamentoChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      pagamento: value === "todos" ? "" : value,
    }))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }))
  }

  const handleClearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setFilters({
      status: "",
      startDate: "",
      endDate: "",
      search: "",
      fornecedor: "",
      pagamento: "",
    })
    setShowCompleted(false)
  }

  const hasActiveFilters = 
    filters.status || 
    filters.startDate || 
    filters.endDate || 
    filters.search || 
    filters.fornecedor || 
    filters.pagamento || 
    showCompleted

  return (
    <div className="w-full bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <div className="flex flex-col gap-4">
        {/* Barra de busca e botão de filtros */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar eventos..."
              value={filters.search}
              onChange={handleSearchChange}
              className="pl-10 w-full"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={cn(
              "px-3 h-10", 
              (isFiltersOpen || hasActiveFilters) && "bg-yellow-400 hover:bg-yellow-500 text-black"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && <span className="ml-2 bg-black text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">!</span>}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={handleClearFilters} className="h-10 px-3">
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>

        {/* Filtros expandidos */}
        {isFiltersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal w-full", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Data inicial</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateSelect}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal w-full", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Data final</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={handleEndDateSelect} initialFocus locale={ptBR} />
              </PopoverContent>
            </Popover>

            <Select value={filters.status || "todos"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.pagamento || "todos"} onValueChange={handlePagamentoChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aguardando">Aguardando</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>

            {showFornecedorFilter && fornecedores && fornecedores.length > 0 && (
              <Select value={filters.fornecedor || "todos"} onValueChange={handleFornecedorChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              onClick={() => setShowCompleted(!showCompleted)}
              className={cn(
                "justify-start text-left font-normal w-full",
                showCompleted && "bg-yellow-400 hover:bg-yellow-500 text-black"
              )}
            >
              {showCompleted ? "Ocultar Concluídos" : "Mostrar Concluídos"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

