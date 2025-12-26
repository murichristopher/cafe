"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Produto, User } from "@/types"

interface EstoqueFiltersProps {
  produtos: Produto[]
  users: User[]
  filters: {
    search: string
    produtoId: string
    tipo: string
    responsavelId: string
    startDate: string
    endDate: string
  }
  onFiltersChange: (filters: any) => void
}

export function EstoqueFilters({
  produtos,
  users,
  filters,
  onFiltersChange,
}: EstoqueFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      produtoId: "",
      tipo: "",
      responsavelId: "",
      startDate: "",
      endDate: "",
    })
  }

  const hasActiveFilters =
    filters.produtoId ||
    filters.tipo ||
    filters.responsavelId ||
    filters.startDate ||
    filters.endDate

  return (
    <div className="flex justify-end">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`border-zinc-700 ${hasActiveFilters ? "border-amber-500" : ""}`}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                {[filters.produtoId, filters.tipo, filters.responsavelId, filters.startDate, filters.endDate].filter(Boolean).length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-[#1a1a1a] border-zinc-700" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtros Avançados</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Produto</Label>
                <Select
                  value={filters.produtoId}
                  onValueChange={(value) => handleFilterChange("produtoId", value)}
                >
                  <SelectTrigger className="bg-[#111] border-zinc-700">
                    <SelectValue placeholder="Todos os produtos" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-zinc-700">
                    <SelectItem value="">Todos os produtos</SelectItem>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Tipo de Movimentação</Label>
                <Select
                  value={filters.tipo}
                  onValueChange={(value) => handleFilterChange("tipo", value)}
                >
                  <SelectTrigger className="bg-[#111] border-zinc-700">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-zinc-700">
                    <SelectItem value="">Todos os tipos</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Responsável</Label>
                <Select
                  value={filters.responsavelId}
                  onValueChange={(value) => handleFilterChange("responsavelId", value)}
                >
                  <SelectTrigger className="bg-[#111] border-zinc-700">
                    <SelectValue placeholder="Todos os responsáveis" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-zinc-700">
                    <SelectItem value="">Todos os responsáveis</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Data Inicial</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="bg-[#111] border-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Data Final</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="bg-[#111] border-zinc-700"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

