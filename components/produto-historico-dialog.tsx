"use client"

import { useState, useEffect } from "react"
import { X, TrendingUp, TrendingDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Produto, EstoqueMovimentacaoWithRelations } from "@/types"

interface ProdutoHistoricoDialogProps {
  produto: Produto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProdutoHistoricoDialog({
  produto,
  open,
  onOpenChange,
}: ProdutoHistoricoDialogProps) {
  const [movimentacoes, setMovimentacoes] = useState<EstoqueMovimentacaoWithRelations[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && produto) {
      fetchHistorico()
    }
  }, [open, produto])

  const fetchHistorico = async () => {
    if (!produto) return

    setLoading(true)
    try {
      const response = await fetch(`/api/estoque/movimentacoes?produto_id=${produto.id}`)
      const data = await response.json()
      if (data.movimentacoes) {
        setMovimentacoes(data.movimentacoes)
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calcularEstatisticas = () => {
    const entradas = movimentacoes
      .filter((m) => m.tipo === "entrada")
      .reduce((sum, m) => sum + m.quantidade, 0)
    const saidas = movimentacoes
      .filter((m) => m.tipo === "saida")
      .reduce((sum, m) => sum + m.quantidade, 0)
    return { entradas, saidas, total: entradas - saidas }
  }

  const stats = calcularEstatisticas()

  if (!produto) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#1a1a1a] border-zinc-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Histórico de Movimentações</DialogTitle>
          <DialogDescription>
            {produto.nome} - Estoque atual: {produto.estoque_atual} {produto.unidade_medida}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Total Entradas</span>
            </div>
            <p className="text-2xl font-bold">{stats.entradas.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{produto.unidade_medida}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">Total Saídas</span>
            </div>
            <p className="text-2xl font-bold">{stats.saidas.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{produto.unidade_medida}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <span className="text-sm font-medium">Saldo</span>
            </div>
            <p className="text-2xl font-bold">{stats.total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{produto.unidade_medida}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando histórico...</div>
        ) : movimentacoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma movimentação registrada para este produto.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentacoes.map((mov) => (
                <TableRow key={mov.id}>
                  <TableCell>{formatDate(mov.data_movimentacao)}</TableCell>
                  <TableCell>
                    {mov.tipo === "entrada" ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Entrada
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <TrendingDown className="mr-1 h-3 w-3" />
                        Saída
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {mov.quantidade} {produto.unidade_medida}
                  </TableCell>
                  <TableCell>
                    {typeof mov.responsavel === "object" && mov.responsavel
                      ? mov.responsavel.name
                      : "N/A"}
                  </TableCell>
                  <TableCell className="max-w-xs">{mov.observacoes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}

