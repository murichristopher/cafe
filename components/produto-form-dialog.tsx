"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, Plus, Edit } from "lucide-react"
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
import { toast } from "@/components/ui/use-toast"
import type { Produto } from "@/types"

interface ProdutoFormDialogProps {
  produto?: Produto | null
  onSuccess: () => void
}

export function ProdutoFormDialog({ produto, onSuccess }: ProdutoFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nome: produto?.nome || "",
    descricao: produto?.descricao || "",
    unidade_medida: produto?.unidade_medida || "uni",
    estoque_minimo: produto?.estoque_minimo?.toString() || "0",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório"
    }

    if (!formData.unidade_medida.trim()) {
      newErrors.unidade_medida = "Unidade de medida é obrigatória"
    }

    const estoqueMinimo = parseFloat(formData.estoque_minimo)
    if (isNaN(estoqueMinimo) || estoqueMinimo < 0) {
      newErrors.estoque_minimo = "Estoque mínimo deve ser um número positivo"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const url = produto
        ? `/api/estoque/produtos/${produto.id}`
        : "/api/estoque/produtos"
      const method = produto ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || null,
          unidade_medida: formData.unidade_medida.trim(),
          estoque_minimo: parseFloat(formData.estoque_minimo) || 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao salvar produto")
      }

      toast({
        title: produto ? "Produto atualizado" : "Produto criado",
        description: produto
          ? "O produto foi atualizado com sucesso."
          : "O produto foi criado com sucesso.",
      })

      setFormData({ nome: "", descricao: "", unidade_medida: "uni", estoque_minimo: "0" })
      setOpen(false)
      onSuccess()
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error)
      toast({
        title: "Erro ao salvar produto",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const unidadesMedida = ["uni", "kg", "litro", "g", "ml", "caixa", "pacote", "fardo"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {produto ? (
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-amber-500 hover:bg-amber-600">
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-zinc-800">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
          <DialogDescription>
            {produto
              ? "Atualize as informações do produto."
              : "Preencha os dados do produto para adicioná-lo ao estoque."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`bg-[#111] border-zinc-700 ${errors.nome ? "border-red-500" : ""}`}
                placeholder="Ex: Chocolate meio amargo"
              />
              {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                className="bg-[#111] border-zinc-700"
                placeholder="Descrição adicional do produto"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unidade_medida">Unidade de Medida *</Label>
              <select
                id="unidade_medida"
                name="unidade_medida"
                value={formData.unidade_medida}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-[#111] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-zinc-700 ${errors.unidade_medida ? "border-red-500" : ""}`}
              >
                {unidadesMedida.map((unidade) => (
                  <option key={unidade} value={unidade}>
                    {unidade}
                  </option>
                ))}
              </select>
              {errors.unidade_medida && <p className="text-sm text-red-500">{errors.unidade_medida}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                name="estoque_minimo"
                type="number"
                min="0"
                step="0.01"
                value={formData.estoque_minimo}
                onChange={handleChange}
                className={`bg-[#111] border-zinc-700 ${errors.estoque_minimo ? "border-red-500" : ""}`}
                placeholder="0"
              />
              {errors.estoque_minimo && <p className="text-sm text-red-500">{errors.estoque_minimo}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-700 text-white"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : produto ? (
                "Atualizar"
              ) : (
                "Criar Produto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

