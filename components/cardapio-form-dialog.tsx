"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, Plus, X, Trash2 } from "lucide-react"
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

interface CardapioFormDialogProps {
  onSuccess: () => void
}

export function CardapioFormDialog({ onSuccess }: CardapioFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    data: "",
    horarioInicio: "",
    horarioFim: "",
    quantidadeParticipantes: "",
    salgados: [""],
    doces: [""],
    bebidas: [{ nome: "", quantidade: "" }],
    informacoesAdicionais: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const handleSalgadoChange = (index: number, value: string) => {
    const newSalgados = [...formData.salgados]
    newSalgados[index] = value
    setFormData({ ...formData, salgados: newSalgados })
  }

  const addSalgado = () => {
    setFormData({ ...formData, salgados: [...formData.salgados, ""] })
  }

  const removeSalgado = (index: number) => {
    const newSalgados = formData.salgados.filter((_, i) => i !== index)
    setFormData({ ...formData, salgados: newSalgados.length > 0 ? newSalgados : [""] })
  }

  const handleDoceChange = (index: number, value: string) => {
    const newDoces = [...formData.doces]
    newDoces[index] = value
    setFormData({ ...formData, doces: newDoces })
  }

  const addDoce = () => {
    setFormData({ ...formData, doces: [...formData.doces, ""] })
  }

  const removeDoce = (index: number) => {
    const newDoces = formData.doces.filter((_, i) => i !== index)
    setFormData({ ...formData, doces: newDoces.length > 0 ? newDoces : [""] })
  }

  const handleBebidaChange = (index: number, field: "nome" | "quantidade", value: string) => {
    const newBebidas = [...formData.bebidas]
    newBebidas[index] = { ...newBebidas[index], [field]: value }
    setFormData({ ...formData, bebidas: newBebidas })
  }

  const addBebida = () => {
    setFormData({ ...formData, bebidas: [...formData.bebidas, { nome: "", quantidade: "" }] })
  }

  const removeBebida = (index: number) => {
    const newBebidas = formData.bebidas.filter((_, i) => i !== index)
    setFormData({ ...formData, bebidas: newBebidas.length > 0 ? newBebidas : [{ nome: "", quantidade: "" }] })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.data.trim()) {
      newErrors.data = "Data é obrigatória"
    }

    if (!formData.horarioInicio.trim()) {
      newErrors.horarioInicio = "Horário de início é obrigatório"
    }

    if (!formData.horarioFim.trim()) {
      newErrors.horarioFim = "Horário de fim é obrigatório"
    }

    if (!formData.quantidadeParticipantes.trim()) {
      newErrors.quantidadeParticipantes = "Quantidade de participantes é obrigatória"
    } else {
      const qtd = parseInt(formData.quantidadeParticipantes)
      if (isNaN(qtd) || qtd <= 0) {
        newErrors.quantidadeParticipantes = "Quantidade deve ser um número positivo"
      }
    }

    // Validar salgados
    const salgadosFiltrados = formData.salgados.filter((s) => s.trim() !== "")
    if (salgadosFiltrados.length === 0) {
      newErrors.salgados = "Adicione pelo menos um salgado"
    }

    // Validar doces
    const docesFiltrados = formData.doces.filter((d) => d.trim() !== "")
    if (docesFiltrados.length === 0) {
      newErrors.doces = "Adicione pelo menos um doce"
    }

    // Validar bebidas
    const bebidasFiltradas = formData.bebidas.filter((b) => b.nome.trim() !== "")
    if (bebidasFiltradas.length === 0) {
      newErrors.bebidas = "Adicione pelo menos uma bebida"
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
      // Filtrar itens vazios
      const salgados = formData.salgados.filter((s) => s.trim() !== "")
      const doces = formData.doces.filter((d) => d.trim() !== "")
      const bebidasObj: Record<string, number> = {}

      formData.bebidas.forEach((bebida) => {
        if (bebida.nome.trim() !== "") {
          const quantidade = parseInt(bebida.quantidade) || 1
          bebidasObj[bebida.nome.trim()] = quantidade
        }
      })

      const payload = {
        data: formData.data,
        horarioInicio: formData.horarioInicio,
        horarioFim: formData.horarioFim,
        quantidadeParticipantes: parseInt(formData.quantidadeParticipantes),
        salgados,
        doces,
        bebidas: bebidasObj,
        informacoesAdicionais: formData.informacoesAdicionais.trim() || null,
        timestamp: new Date().toISOString(),
      }

      const response = await fetch("/api/webhook/cardapio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao criar cardápio")
      }

      toast({
        title: "Sucesso",
        description: "Cardápio criado com sucesso!",
      })

      // Reset form
      setFormData({
        data: "",
        horarioInicio: "",
        horarioFim: "",
        quantidadeParticipantes: "",
        salgados: [""],
        doces: [""],
        bebidas: [{ nome: "", quantidade: "" }],
        informacoesAdicionais: "",
      })
      setErrors({})
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao criar cardápio:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao criar cardápio",
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
          <Plus className="mr-2 h-4 w-4" /> Novo Cardápio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-zinc-800">
        <DialogHeader>
          <DialogTitle>Criar Novo Cardápio</DialogTitle>
          <DialogDescription>Preencha as informações do cardápio do evento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Informações do Evento */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Informações do Evento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    name="data"
                    type="date"
                    value={formData.data}
                    onChange={handleChange}
                    className={`bg-[#111] border-zinc-700 ${errors.data ? "border-red-500" : ""}`}
                  />
                  {errors.data && <p className="text-sm text-red-500">{errors.data}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantidadeParticipantes">Participantes *</Label>
                  <Input
                    id="quantidadeParticipantes"
                    name="quantidadeParticipantes"
                    type="number"
                    min="1"
                    value={formData.quantidadeParticipantes}
                    onChange={handleChange}
                    className={`bg-[#111] border-zinc-700 ${errors.quantidadeParticipantes ? "border-red-500" : ""}`}
                  />
                  {errors.quantidadeParticipantes && (
                    <p className="text-sm text-red-500">{errors.quantidadeParticipantes}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="horarioInicio">Horário Início *</Label>
                  <Input
                    id="horarioInicio"
                    name="horarioInicio"
                    type="time"
                    value={formData.horarioInicio}
                    onChange={handleChange}
                    className={`bg-[#111] border-zinc-700 ${errors.horarioInicio ? "border-red-500" : ""}`}
                  />
                  {errors.horarioInicio && <p className="text-sm text-red-500">{errors.horarioInicio}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="horarioFim">Horário Fim *</Label>
                  <Input
                    id="horarioFim"
                    name="horarioFim"
                    type="time"
                    value={formData.horarioFim}
                    onChange={handleChange}
                    className={`bg-[#111] border-zinc-700 ${errors.horarioFim ? "border-red-500" : ""}`}
                  />
                  {errors.horarioFim && <p className="text-sm text-red-500">{errors.horarioFim}</p>}
                </div>
              </div>
            </div>

            {/* Salgados */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-white">Salgados *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSalgado}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              {formData.salgados.map((salgado, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={salgado}
                    onChange={(e) => handleSalgadoChange(index, e.target.value)}
                    placeholder="Nome do salgado"
                    className="bg-[#111] border-zinc-700"
                  />
                  {formData.salgados.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSalgado(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.salgados && <p className="text-sm text-red-500">{errors.salgados}</p>}
            </div>

            {/* Doces */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-white">Doces *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDoce}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              {formData.doces.map((doce, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={doce}
                    onChange={(e) => handleDoceChange(index, e.target.value)}
                    placeholder="Nome do doce"
                    className="bg-[#111] border-zinc-700"
                  />
                  {formData.doces.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDoce(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.doces && <p className="text-sm text-red-500">{errors.doces}</p>}
            </div>

            {/* Bebidas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-white">Bebidas *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBebida}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              {formData.bebidas.map((bebida, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={bebida.nome}
                    onChange={(e) => handleBebidaChange(index, "nome", e.target.value)}
                    placeholder="Nome da bebida"
                    className="bg-[#111] border-zinc-700 flex-1"
                  />
                  <Input
                    value={bebida.quantidade}
                    onChange={(e) => handleBebidaChange(index, "quantidade", e.target.value)}
                    placeholder="Qtd"
                    type="number"
                    min="1"
                    className="bg-[#111] border-zinc-700 w-20"
                  />
                  {formData.bebidas.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBebida(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.bebidas && <p className="text-sm text-red-500">{errors.bebidas}</p>}
            </div>

            {/* Informações Adicionais */}
            <div className="grid gap-2">
              <Label htmlFor="informacoesAdicionais">Informações Adicionais (opcional)</Label>
              <Textarea
                id="informacoesAdicionais"
                name="informacoesAdicionais"
                value={formData.informacoesAdicionais}
                onChange={handleChange}
                placeholder="Adicione qualquer informação adicional sobre o evento"
                className="bg-[#111] border-zinc-700"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar Cardápio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

