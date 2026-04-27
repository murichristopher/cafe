"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  History,
  Download,
  ArrowUpDown,
  Search,
} from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { ProdutoFormDialog } from "@/components/produto-form-dialog"
import { MovimentacaoFormDialog } from "@/components/movimentacao-form-dialog"
import { EstoqueFilters } from "@/components/estoque-filters"
import { ProdutoHistoricoDialog } from "@/components/produto-historico-dialog"
import type { Produto, EstoqueMovimentacaoWithRelations, User } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [movimentacoes, setMovimentacoes] = useState<EstoqueMovimentacaoWithRelations[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [historicoProduto, setHistoricoProduto] = useState<Produto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("produtos")
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    search: "",
    produtoId: "",
    tipo: "",
    responsavelId: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    fetchProdutos()
    fetchMovimentacoes()
    fetchUsers()
  }, [])

  const fetchProdutos = async () => {
    try {
      const response = await fetch("/api/estoque/produtos")
      const data = await response.json()
      if (data.produtos) {
        setProdutos(data.produtos)
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMovimentacoes = async (produtoId?: string) => {
    try {
      const url = produtoId
        ? `/api/estoque/movimentacoes?produto_id=${produtoId}`
        : "/api/estoque/movimentacoes"
      const response = await fetch(url)
      const data = await response.json()
      if (data.movimentacoes) {
        setMovimentacoes(data.movimentacoes)
      }
    } catch (error) {
      console.error("Erro ao buscar movimentações:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("id, name, email").order("name")
      if (error) throw error
      if (data) {
        setUsers(data as User[])
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    }
  }

  const handleDeleteClick = (produto: Produto) => {
    setSelectedProduto(produto)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProduto) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/estoque/produtos/${selectedProduto.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao excluir produto")
      }

      toast({
        title: "Produto excluído",
        description: `${selectedProduto.nome} foi removido com sucesso.`,
      })

      fetchProdutos()
    } catch (error: any) {
      console.error("Erro ao excluir produto:", error)
      toast({
        title: "Erro ao excluir produto",
        description: error.message || "Ocorreu um erro ao tentar excluir o produto.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedProduto(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  const getEstoqueStatus = (produto: Produto) => {
    if (produto.estoque_minimo && produto.estoque_atual <= produto.estoque_minimo) {
      return "low"
    }
    return "ok"
  }

  const estatisticas = useMemo(() => {
    const produtosComEstoqueBaixo = produtos.filter(
      (p) => p.estoque_minimo && p.estoque_atual <= p.estoque_minimo
    )
    const totalProdutos = produtos.length
    const totalEstoque = produtos.reduce((sum, p) => sum + p.estoque_atual, 0)
    const totalEntradas = movimentacoes
      .filter((m) => m.tipo === "entrada")
      .reduce((sum, m) => sum + m.quantidade, 0)
    const totalSaidas = movimentacoes
      .filter((m) => m.tipo === "saida")
      .reduce((sum, m) => sum + m.quantidade, 0)

    return {
      totalProdutos,
      produtosComEstoqueBaixo: produtosComEstoqueBaixo.length,
      totalEstoque,
      totalEntradas,
      totalSaidas,
    }
  }, [produtos, movimentacoes])

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      if (searchTerm && !produto.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      return true
    })
  }, [produtos, searchTerm])

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((mov) => {
      if (filters.produtoId) {
        const produtoId = typeof mov.produto === "object" && mov.produto ? mov.produto.id : null
        if (produtoId !== filters.produtoId) return false
      }
      if (filters.tipo && mov.tipo !== filters.tipo) return false
      if (filters.responsavelId) {
        const responsavelId =
          typeof mov.responsavel === "object" && mov.responsavel ? mov.responsavel.id : null
        if (responsavelId !== filters.responsavelId) return false
      }
      if (filters.startDate) {
        if (new Date(mov.data_movimentacao) < new Date(filters.startDate)) return false
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        if (new Date(mov.data_movimentacao) > endDate) return false
      }
      return true
    })
  }, [movimentacoes, filters])

  const exportarDados = () => {
    const dados = movimentacoesFiltradas.map((mov) => ({
      Data: formatDate(mov.data_movimentacao),
      Produto:
        typeof mov.produto === "object" && mov.produto ? mov.produto.nome : "N/A",
      Tipo: mov.tipo === "entrada" ? "Entrada" : "Saída",
      Quantidade: mov.quantidade,
      Unidade:
        typeof mov.produto === "object" && mov.produto ? mov.produto.unidade_medida : "",
      Responsável:
        typeof mov.responsavel === "object" && mov.responsavel ? mov.responsavel.name : "N/A",
      Observações: mov.observacoes || "",
    }))

    const csv = [
      Object.keys(dados[0]).join(","),
      ...dados.map((row) => Object.values(row).map((v) => `"${v}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `movimentacoes_estoque_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Exportação concluída",
      description: "Os dados foram exportados com sucesso.",
    })
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-3 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Estoque</h1>
          <p className="text-muted-foreground text-sm">Controle de produtos e movimentações</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ProdutoFormDialog onSuccess={fetchProdutos} />
          <MovimentacaoFormDialog
            onSuccess={() => {
              fetchMovimentacoes()
              fetchProdutos()
            }}
          />
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalProdutos}</div>
            <p className="text-xs text-muted-foreground">produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.produtosComEstoqueBaixo}</div>
            <p className="text-xs text-muted-foreground">produtos precisando reposição</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalEntradas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">unidades recebidas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalSaidas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">unidades utilizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Estoque Baixo */}
      {estatisticas.produtosComEstoqueBaixo > 0 && (
        <Card className="border-yellow-500 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Estoque Baixo
            </CardTitle>
            <CardDescription>
              {estatisticas.produtosComEstoqueBaixo} produto(s) com estoque abaixo do mínimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {produtos
                .filter((p) => p.estoque_minimo && p.estoque_atual <= p.estoque_minimo)
                .map((produto) => (
                  <Badge
                    key={produto.id}
                    variant="outline"
                    className="border-yellow-500 text-yellow-500 cursor-pointer hover:bg-yellow-500/20"
                    onClick={() => setHistoricoProduto(produto)}
                  >
                    {produto.nome} - {produto.estoque_atual} {produto.unidade_medida}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="movimentacoes">Histórico</TabsTrigger>
          </TabsList>
          {activeTab === "movimentacoes" && (
            <Button
              variant="outline"
              onClick={exportarDados}
              disabled={movimentacoesFiltradas.length === 0}
              className="border-zinc-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          )}
        </div>

        {/* TAB PRODUTOS - CARDS */}
        <TabsContent value="produtos" className="space-y-4">
          {/* Barra de pesquisa */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#111] border-zinc-700"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando produtos...</div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm
                ? "Nenhum produto encontrado com essa busca."
                : "Nenhum produto cadastrado. Clique em 'Novo Produto' para começar."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {produtosFiltrados.map((produto) => {
                const status = getEstoqueStatus(produto)
                const isLow = status === "low"
                return (
                  <Card
                    key={produto.id}
                    className={`border transition-colors ${
                      isLow
                        ? "border-yellow-500/50 bg-yellow-500/5"
                        : "border-zinc-800 bg-[#1a1a1a]"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight">{produto.nome}</CardTitle>
                        {isLow ? (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-500 shrink-0 text-xs">
                            Baixo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-500 shrink-0 text-xs">
                            OK
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Quantidade em destaque */}
                      <div className="text-center py-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
                        <p className="text-3xl font-bold text-white">
                          {produto.estoque_atual % 1 === 0
                            ? produto.estoque_atual
                            : produto.estoque_atual.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{produto.unidade_medida}</p>
                        {produto.estoque_minimo !== null && produto.estoque_minimo !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            mín: {produto.estoque_minimo} {produto.unidade_medida}
                          </p>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="grid grid-cols-2 gap-2">
                        <MovimentacaoFormDialog
                          produtoId={produto.id}
                          onSuccess={() => {
                            fetchMovimentacoes()
                            fetchProdutos()
                          }}
                          trigger={
                            <Button
                              size="sm"
                              className="w-full bg-amber-500 hover:bg-amber-600 text-black text-xs"
                            >
                              <ArrowUpDown className="mr-1 h-3 w-3" />
                              Movimentar
                            </Button>
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-zinc-700 text-xs"
                          onClick={() => setHistoricoProduto(produto)}
                        >
                          <History className="mr-1 h-3 w-3" />
                          Histórico
                        </Button>
                      </div>

                      <div className="flex justify-between gap-2">
                        <ProdutoFormDialog produto={produto} onSuccess={fetchProdutos} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(produto)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB HISTÓRICO DE MOVIMENTAÇÕES */}
        <TabsContent value="movimentacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>
                Registro completo de todas as entradas e saídas de estoque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EstoqueFilters
                produtos={produtos}
                users={users}
                filters={filters}
                onFiltersChange={setFilters}
              />

              {movimentacoesFiltradas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {movimentacoes.length === 0
                    ? "Nenhuma movimentação registrada ainda."
                    : "Nenhuma movimentação encontrada com os filtros aplicados."}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-zinc-800">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimentacoesFiltradas.map((mov) => (
                        <TableRow key={mov.id} className="hover:bg-zinc-900/50">
                          <TableCell>{formatDate(mov.data_movimentacao)}</TableCell>
                          <TableCell className="font-medium">
                            {typeof mov.produto === "object" && mov.produto ? (
                              <button
                                onClick={() => {
                                  const produto = produtos.find((p) => p.id === mov.produto?.id)
                                  if (produto) setHistoricoProduto(produto)
                                }}
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                {mov.produto.nome}
                              </button>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
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
                            {mov.quantidade}{" "}
                            {typeof mov.produto === "object" && mov.produto
                              ? mov.produto.unidade_medida
                              : ""}
                          </TableCell>
                          <TableCell>
                            {typeof mov.responsavel === "object" && mov.responsavel
                              ? mov.responsavel.name
                              : "N/A"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={mov.observacoes || ""}>
                            {mov.observacoes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedProduto?.nome}? Esta ação não pode ser
              desfeita. Todas as movimentações associadas também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProdutoHistoricoDialog
        produto={historicoProduto}
        open={!!historicoProduto}
        onOpenChange={(open) => {
          if (!open) setHistoricoProduto(null)
        }}
      />
    </div>
  )
}
