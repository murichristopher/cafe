"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import type { Produto } from "@/types"

export type FichaTecnica = {
  id: string
  nome: string
  descricao?: string | null
  rendimento: number
  unidade_rendimento: string
  ficha_ingredientes: FichaIngrediente[]
  created_at: string
  updated_at: string
}

export type FichaIngrediente = {
  id?: string
  ficha_id?: string
  produto_id: string
  quantidade: number
  unidade_medida: string
  produto?: {
    id: string
    nome: string
    unidade_medida: string
    custo_unitario?: number | null
  } | null
}

interface FichaTecnicaFormDialogProps {
  ficha?: FichaTecnica
  onSuccess: () => void
}

export function FichaTecnicaFormDialog({ ficha, onSuccess }: FichaTecnicaFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [rendimento, setRendimento] = useState("1")
  const [unidadeRendimento, setUnidadeRendimento] = useState("unidade")
  const [ingredientes, setIngredientes] = useState<
    { produto_id: string; quantidade: string; unidade_medida: string }[]
  >([])

  useEffect(() => {
    if (open) {
      fetchProdutos()
      if (ficha) {
        setNome(ficha.nome)
        setDescricao(ficha.descricao || "")
        setRendimento(String(ficha.rendimento))
        setUnidadeRendimento(ficha.unidade_rendimento)
        setIngredientes(
          ficha.ficha_ingredientes.map((i) => ({
            produto_id: i.produto_id,
            quantidade: String(i.quantidade),
            unidade_medida: i.unidade_medida,
          }))
        )
      } else {
        setNome("")
        setDescricao("")
        setRendimento("1")
        setUnidadeRendimento("unidade")
        setIngredientes([])
      }
    }
  }, [open, ficha])

  const fetchProdutos = async () => {
    try {
      const response = await fetch("/api/estoque/produtos")
      const data = await response.json()
      if (data.produtos) setProdutos(data.produtos)
    } catch {
      toast({ title: "Erro ao carregar produtos", variant: "destructive" })
    }
  }

  const addIngrediente = () => {
    setIngredientes([...ingredientes, { produto_id: "", quantidade: "", unidade_medida: "" }])
  }

  const removeIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index))
  }

  const updateIngrediente = (index: number, field: string, value: string) => {
    const updated = [...ingredientes]
    updated[index] = { ...updated[index], [field]: value }
    if (field === "produto_id") {
      const produto = produtos.find((p) => p.id === value)
      if (produto) updated[index].unidade_medida = produto.unidade_medida
    }
    setIngredientes(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        rendimento: parseFloat(rendimento),
        unidade_rendimento: unidadeRendimento,
        ingredientes: ingredientes
          .filter((i) => i.produto_id && i.quantidade)
          .map((i) => ({
            produto_id: i.produto_id,
            quantidade: parseFloat(i.quantidade),
            unidade_medida: i.unidade_medida,
          })),
      }

      const url = ficha ? `/api/fichas-tecnicas/${ficha.id}` : "/api/fichas-tecnicas"
      const method = ficha ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao salvar ficha técnica")
      }

      toast({ title: ficha ? "Ficha atualizada" : "Ficha criada com sucesso" })
      setOpen(false)
      onSuccess()
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {ficha ? (
          <Button variant="ghost" size="sm" className="text-xs border border-zinc-700">
            Editar
          </Button>
        ) : (
          <Button className="bg-amber-500 hover:bg-amber-600 text-black">
            <Plus className="mr-2 h-4 w-4" /> Nova Ficha Técnica
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-[#1a1a1a] border-zinc-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ficha ? "Editar Ficha Técnica" : "Nova Ficha Técnica"}</DialogTitle>
          <DialogDescription>
            Defina os ingredientes e quantidades para calcular o custo do produto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 grid gap-2">
              <Label>Nome do Produto *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-[#111] border-zinc-700"
                placeholder="Ex: Sanduíche Natural, Pão de queijo..."
              />
            </div>
            <div className="sm:col-span-2 grid gap-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-[#111] border-zinc-700"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Rendimento *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={rendimento}
                onChange={(e) => setRendimento(e.target.value)}
                className="bg-[#111] border-zinc-700"
              />
            </div>
            <div className="grid gap-2">
              <Label>Unidade do Rendimento *</Label>
              <Input
                value={unidadeRendimento}
                onChange={(e) => setUnidadeRendimento(e.target.value)}
                className="bg-[#111] border-zinc-700"
                placeholder="unidade, porção, kg..."
              />
            </div>
          </div>

          {/* Ingredientes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Ingredientes</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addIngrediente}
                className="border-zinc-700 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" /> Adicionar
              </Button>
            </div>

            {ingredientes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ingrediente adicionado. Clique em "Adicionar" para incluir.
              </p>
            )}

            {ingredientes.map((ing, index) => (
              <div key={index} className="flex flex-col sm:grid sm:grid-cols-[1fr_80px_72px_36px] gap-2">
                <div className="grid gap-1">
                  {index === 0 && <Label className="text-xs text-muted-foreground hidden sm:block">Produto</Label>}
                  <Select
                    value={ing.produto_id}
                    onValueChange={(v) => updateIngrediente(index, "produto_id", v)}
                  >
                    <SelectTrigger className="bg-[#111] border-zinc-700 h-9 text-sm">
                      <SelectValue placeholder="Selecione o produto..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-zinc-700">
                      {produtos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <div className="grid gap-1">
                    {index === 0 && <Label className="text-xs text-muted-foreground hidden sm:block">Qtd</Label>}
                    <Input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={ing.quantidade}
                      onChange={(e) => updateIngrediente(index, "quantidade", e.target.value)}
                      className="bg-[#111] border-zinc-700 h-9 text-sm"
                      placeholder="Qtd"
                    />
                  </div>
                  <div className="grid gap-1">
                    {index === 0 && <Label className="text-xs text-muted-foreground hidden sm:block">Unidade</Label>}
                    <Input
                      value={ing.unidade_medida}
                      onChange={(e) => updateIngrediente(index, "unidade_medida", e.target.value)}
                      className="bg-[#111] border-zinc-700 h-9 text-sm"
                      placeholder="un, kg..."
                    />
                  </div>
                </div>
                <div className="flex justify-end sm:block sm:pt-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    onClick={() => removeIngrediente(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : ficha ? (
                "Salvar Alterações"
              ) : (
                "Criar Ficha"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
