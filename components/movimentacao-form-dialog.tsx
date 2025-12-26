"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Loader2, Plus } from "lucide-react"
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
import type { Produto, User } from "@/types"
import { supabase } from "@/lib/supabase"

interface MovimentacaoFormDialogProps {
  produtoId?: string
  onSuccess: () => void
}

export function MovimentacaoFormDialog({ produtoId, onSuccess }: MovimentacaoFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    produto_id: produtoId || "",
    tipo: "entrada" as "entrada" | "saida",
    quantidade: "",
    data_movimentacao: new Date().toISOString().split("T")[0],
    responsavel_id: "",
    observacoes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setLoading(true)
      fetchProdutos()
      fetchUsers()
    } else {
      // Resetar estado quando fechar o dialog
      setFormData({
        produto_id: produtoId || "",
        tipo: "entrada",
        quantidade: "",
        data_movimentacao: new Date().toISOString().split("T")[0],
        responsavel_id: "",
        observacoes: "",
      })
    }
  }, [open, produtoId])

  const fetchProdutos = async () => {
    try {
      setLoading(true)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.produto_id) {
      newErrors.produto_id = "Produto é obrigatório"
    }

    if (!formData.quantidade || parseFloat(formData.quantidade) <= 0) {
      newErrors.quantidade = "Quantidade deve ser maior que zero"
    }

    if (!formData.data_movimentacao) {
      newErrors.data_movimentacao = "Data é obrigatória"
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
      const response = await fetch("/api/estoque/movimentacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          produto_id: formData.produto_id,
          tipo: formData.tipo,
          quantidade: parseFloat(formData.quantidade),
          data_movimentacao: new Date(formData.data_movimentacao).toISOString(),
          responsavel_id: formData.responsavel_id || null,
          observacoes: formData.observacoes.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao criar movimentação")
      }

      toast({
        title: "Movimentação registrada",
        description: `A ${formData.tipo === "entrada" ? "entrada" : "saída"} foi registrada com sucesso.`,
      })

      setFormData({
        produto_id: produtoId || "",
        tipo: "entrada",
        quantidade: "",
        data_movimentacao: new Date().toISOString().split("T")[0],
        responsavel_id: "",
        observacoes: "",
      })
      setOpen(false)
      onSuccess()
    } catch (error: any) {
      console.error("Erro ao criar movimentação:", error)
      toast({
        title: "Erro ao criar movimentação",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600">
          <Plus className="mr-2 h-4 w-4" /> Nova Movimentação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-zinc-800">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
          <DialogDescription>
            Registre uma entrada ou saída de estoque para um produto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="produto_id">Produto *</Label>
              {loading ? (
                <div className="flex h-10 w-full items-center justify-center rounded-md border bg-[#111] border-zinc-700 text-sm text-muted-foreground">
                  Carregando produtos...
                </div>
              ) : (
                <Select
                  value={formData.produto_id}
                  onValueChange={(value) => handleSelectChange("produto_id", value)}
                  disabled={!!produtoId}
                >
                  <SelectTrigger
                    className={`bg-[#111] border-zinc-700 ${errors.produto_id ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-zinc-700">
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome} ({produto.estoque_atual} {produto.unidade_medida})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.produto_id && <p className="text-sm text-red-500">{errors.produto_id}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Movimentação *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleSelectChange("tipo", value)}
              >
                <SelectTrigger className="bg-[#111] border-zinc-700">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-zinc-700">
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantidade}
                onChange={handleChange}
                className={`bg-[#111] border-zinc-700 ${errors.quantidade ? "border-red-500" : ""}`}
                placeholder="0.00"
              />
              {errors.quantidade && <p className="text-sm text-red-500">{errors.quantidade}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data_movimentacao">Data da Movimentação *</Label>
              <Input
                id="data_movimentacao"
                name="data_movimentacao"
                type="date"
                value={formData.data_movimentacao}
                onChange={handleChange}
                className={`bg-[#111] border-zinc-700 ${errors.data_movimentacao ? "border-red-500" : ""}`}
              />
              {errors.data_movimentacao && <p className="text-sm text-red-500">{errors.data_movimentacao}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="responsavel_id">Responsável (opcional)</Label>
              <Select
                value={formData.responsavel_id || undefined}
                onValueChange={(value) => handleSelectChange("responsavel_id", value || "")}
              >
                <SelectTrigger className="bg-[#111] border-zinc-700">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-zinc-700">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                className="bg-[#111] border-zinc-700"
                placeholder="Observações adicionais sobre a movimentação"
                rows={3}
              />
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
                  Registrando...
                </>
              ) : (
                "Registrar Movimentação"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

