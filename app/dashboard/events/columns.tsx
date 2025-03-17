"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import type { EventWithFornecedor } from "@/types"

export const columns: ColumnDef<EventWithFornecedor>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Nome do Evento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("title")}</div>
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"))
      return format(date, "dd/MM/yyyy", { locale: ptBR })
    },
  },
  {
    accessorKey: "time",
    header: "Horário",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"))
      return format(date, "HH:mm", { locale: ptBR })
    },
  },
  {
    accessorKey: "location",
    header: "Local",
    cell: ({ row }) => row.getValue("location"),
  },
  {
    accessorKey: "pax",
    header: "Pessoas",
    cell: ({ row }) => {
      const pax = row.original.pax
      return pax !== null && pax !== undefined ? pax : "-"
    },
  },
  {
    accessorKey: "fornecedor",
    header: "Fornecedor",
    cell: ({ row }) => {
      const fornecedor = row.original.fornecedor
      return fornecedor ? fornecedor.name : "Não atribuído"
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string

      const statusMap: Record<string, { label: string; className: string }> = {
        pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
        confirmed: { label: "Confirmado", className: "bg-green-100 text-green-800" },
        cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
        aguardando_aprovacao: { label: "Aguardando Aprovação", className: "bg-blue-100 text-blue-800" },
        concluido: { label: "Concluído", className: "bg-purple-100 text-purple-800" },
      }

      const { label, className } = statusMap[status] || { label: status, className: "bg-gray-100" }

      return <Badge className={className}>{label}</Badge>
    },
  },
  {
    accessorKey: "nota_fiscal",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Nota Fiscal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => row.original.nota_fiscal || "Não informada",
  },
  {
    accessorKey: "pagamento",
    header: "Pagamento",
    cell: ({ row }) => {
      const pagamento = row.original.pagamento as string | null

      if (!pagamento) return "Não definido"

      const pagamentoMap: Record<string, { label: string; className: string }> = {
        pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
        realizado: { label: "Realizado", className: "bg-green-100 text-green-800" },
        cancelado: { label: "Cancelado", className: "bg-red-100 text-red-800" },
      }

      const { label, className } = pagamentoMap[pagamento] || { label: pagamento, className: "bg-gray-100" }

      return <Badge className={className}>{label}</Badge>
    },
  },
  {
    accessorKey: "valor",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const valor = row.original.valor
      return valor ? `R$ ${valor.toFixed(2).replace(".", ",")}` : "Não definido"
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const event = row.original

      return (
        <div className="flex justify-end">
          <Link href={`/dashboard/events/${event.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Ver detalhes</span>
            </Button>
          </Link>
        </div>
      )
    },
  },
]

