"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon, X } from "lucide-react"
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
  }
  setFilters: React.Dispatch<
    React.SetStateAction<{
      status: string
      startDate: string
      endDate: string
      search: string
      fornecedor?: string
    }>
  >
  showFornecedorFilter?: boolean
}

export function EventFilters({ filters, setFilters, showFornecedorFilter = false }: EventFiltersProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(filters.endDate ? new Date(filters.endDate) : undefined)
  const [fornecedores, setFornecedores] = useState<User[]>([])

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
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            placeholder="Buscar eventos..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
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
                className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}
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
            <SelectTrigger className="w-[180px]">
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

          {showFornecedorFilter && fornecedores && fornecedores.length > 0 && (
            <Select value={filters.fornecedor || "todos"} onValueChange={handleFornecedorChange}>
              <SelectTrigger className="w-[180px]">
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

          {(filters.status || filters.startDate || filters.endDate || filters.search || filters.fornecedor) && (
            <Button variant="ghost" onClick={handleClearFilters} className="h-10 px-3">
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

