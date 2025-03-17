"use client"

import type React from "react"

import { useState } from "react"
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
import { toast } from "@/components/ui/use-toast"
import { adminCreateFornecedor } from "@/app/actions/fornecedor-actions"

export function FornecedorFormDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "phone_number") {
      // Format phone number as user types
      let formattedValue = value.replace(/\D/g, "")
      if (formattedValue.length > 0) {
        // Format as (XX) XXXXX-XXXX
        if (formattedValue.length <= 2) {
          formattedValue = `(${formattedValue}`
        } else if (formattedValue.length <= 7) {
          formattedValue = `(${formattedValue.substring(0, 2)}) ${formattedValue.substring(2)}`
        } else {
          formattedValue = `(${formattedValue.substring(0, 2)}) ${formattedValue.substring(
            2,
            7,
          )}-${formattedValue.substring(7, 11)}`
        }
      }

      setFormData({ ...formData, [name]: formattedValue })
    } else {
      setFormData({ ...formData, [name]: value })
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
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
      // Use the admin-specific server action to create the fornecedor
      const result = await adminCreateFornecedor(formData.name, formData.email, formData.phone_number)

      if (!result.success) {
        throw new Error(result.error || "Falha ao criar fornecedor")
      }

      toast({
        title: "Fornecedor criado com sucesso",
        description: "Um email foi enviado para o fornecedor com instruções de acesso.",
      })

      // Reset form and close dialog
      setFormData({ name: "", email: "", phone_number: "" })
      setOpen(false)

      // Refresh the page to show the new fornecedor
      // This is optional, you could also use a more elegant approach
      // like updating the state or using SWR/React Query to refetch data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error("Erro ao criar fornecedor:", error)
      toast({
        title: "Erro ao criar fornecedor",
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
          <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-zinc-800">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Preencha os dados do fornecedor. Um email será enviado com instruções de acesso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`bg-[#111] border-zinc-700 ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`bg-[#111] border-zinc-700 ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Telefone (opcional)</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="(XX) XXXXX-XXXX"
                className="bg-[#111] border-zinc-700"
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
                  Criando...
                </>
              ) : (
                "Criar Fornecedor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

