"use client"

import { useState, useEffect } from "react"
import { Trash2, ChefHat, DollarSign, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { FichaTecnicaFormDialog, type FichaTecnica } from "@/components/ficha-tecnica-form-dialog"

export default function FichasTecnicasPage() {
  const [fichas, setFichas] = useState<FichaTecnica[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFicha, setSelectedFicha] = useState<FichaTecnica | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedFicha, setExpandedFicha] = useState<string | null>(null)

  useEffect(() => {
    fetchFichas()
  }, [])

  const fetchFichas = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/fichas-tecnicas")
      const data = await response.json()
      if (data.fichas) setFichas(data.fichas)
    } catch {
      toast({ title: "Erro ao carregar fichas técnicas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const calcularCustoTotal = (ficha: FichaTecnica) => {
    return ficha.ficha_ingredientes.reduce((total, ing) => {
      const custo = ing.produto?.custo_unitario || 0
      return total + ing.quantidade * custo
    }, 0)
  }

  const calcularCustoPorUnidade = (ficha: FichaTecnica) => {
    const total = calcularCustoTotal(ficha)
    return ficha.rendimento > 0 ? total / ficha.rendimento : 0
  }

  const handleDelete = async () => {
    if (!selectedFicha) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/fichas-tecnicas/${selectedFicha.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Erro ao excluir")
      toast({ title: "Ficha excluída com sucesso" })
      fetchFichas()
    } catch {
      toast({ title: "Erro ao excluir ficha técnica", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedFicha(null)
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-3 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Fichas Técnicas</h1>
          <p className="text-muted-foreground text-sm">Receitas e tabela de custo dos produtos produzidos</p>
        </div>
        <FichaTecnicaFormDialog onSuccess={fetchFichas} />
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            Como usar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cadastre o custo unitário de cada produto de estoque (editando o produto) e adicione os
          ingredientes à ficha técnica para calcular automaticamente o custo de produção.
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando fichas técnicas...</div>
      ) : fichas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma ficha técnica cadastrada. Clique em "Nova Ficha Técnica" para começar.
        </div>
      ) : (
        <div className="space-y-4">
          {fichas.map((ficha) => {
            const custoTotal = calcularCustoTotal(ficha)
            const custoPorUnidade = calcularCustoPorUnidade(ficha)
            const isExpanded = expandedFicha === ficha.id
            const semCusto = ficha.ficha_ingredientes.some((i) => !i.produto?.custo_unitario)

            return (
              <Card key={ficha.id} className="border-zinc-800 bg-[#1a1a1a]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ChefHat className="h-5 w-5 text-amber-400" />
                          {ficha.nome}
                        </CardTitle>
                        <Badge variant="outline" className="border-zinc-600 text-xs">
                          Rende {ficha.rendimento} {ficha.unidade_rendimento}
                        </Badge>
                        {semCusto && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">
                            Custos incompletos
                          </Badge>
                        )}
                      </div>
                      {ficha.descricao && (
                        <CardDescription className="mt-1">{ficha.descricao}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Custo/unidade</p>
                        <p className="text-lg font-bold text-amber-400">
                          {formatCurrency(custoPorUnidade)}
                        </p>
                      </div>
                      <FichaTecnicaFormDialog ficha={ficha} onSuccess={fetchFichas} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedFicha(ficha)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit text-xs text-muted-foreground hover:text-white mt-1"
                    onClick={() => setExpandedFicha(isExpanded ? null : ficha.id)}
                  >
                    {isExpanded ? "Ocultar tabela de custo" : "Ver tabela de custo"}
                  </Button>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border border-zinc-800">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-zinc-900/50">
                            <TableHead>Ingrediente</TableHead>
                            <TableHead className="text-right">Quantidade</TableHead>
                            <TableHead className="text-right">Custo Unitário</TableHead>
                            <TableHead className="text-right">Custo Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ficha.ficha_ingredientes.map((ing) => {
                            const custo = ing.produto?.custo_unitario || 0
                            const custoIng = ing.quantidade * custo
                            return (
                              <TableRow key={ing.id} className="hover:bg-zinc-900/30">
                                <TableCell className="font-medium">
                                  {ing.produto?.nome || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {ing.quantidade} {ing.unidade_medida}
                                </TableCell>
                                <TableCell className="text-right">
                                  {custo > 0 ? (
                                    formatCurrency(custo)
                                  ) : (
                                    <span className="text-yellow-500 text-xs">Não informado</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(custoIng)}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                          <TableRow className="bg-zinc-900/50 font-bold">
                            <TableCell colSpan={3} className="text-right">
                              <span className="flex items-center justify-end gap-1">
                                <DollarSign className="h-4 w-4 text-amber-400" />
                                Custo Total de Produção
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-amber-400">
                              {formatCurrency(custoTotal)}
                            </TableCell>
                          </TableRow>
                          <TableRow className="bg-zinc-900/50 font-bold">
                            <TableCell colSpan={3} className="text-right text-sm">
                              Custo por {ficha.unidade_rendimento}
                            </TableCell>
                            <TableCell className="text-right text-amber-400">
                              {formatCurrency(custoPorUnidade)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ficha técnica</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedFicha?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
