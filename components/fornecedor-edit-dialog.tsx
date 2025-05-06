"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, Pencil } from "lucide-react"
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
import type { User as UserType } from "@/types"

interface FornecedorEditDialogProps {
  fornecedor: UserType
  onFornecedorUpdated: () => void
}

export function FornecedorEditDialog({ fornecedor, onFornecedorUpdated }: FornecedorEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: fornecedor.name,
    email: fornecedor.email,
    phone_number: fornecedor.phone_number || "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form data when fornecedor changes or dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      // Reset form data to current fornecedor values when opening
      setFormData({
        name: fornecedor.name,
        email: fornecedor.email,
        phone_number: fornecedor.phone_number || "",
        password: "",
      })
      setErrors({})
    }
  }

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
      console.log("Updating fornecedor:", fornecedor.id)
      console.log("Form data:", formData)

      // Try using a server-side API route instead of direct Supabase client
      const response = await fetch(`/api/fornecedores/${fornecedor.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone_number || null,
          password: formData.password || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Fornecedor não encontrado. Ele pode ter sido excluído.")
        } else {
          throw new Error(result.error || "Falha ao atualizar fornecedor")
        }
      }

      if (result.warning) {
        console.warn("Warning from API:", result.warning)
        toast({
          title: "Atualização com aviso",
          description: result.warning,
          variant: "default",
        })
      }

      // Verificar se houve erro na atualização da senha
      if (result.passwordUpdated === false) {
        console.warn("Warning from API:", result.passwordMessage)
        toast({
          title: "Atualização parcial",
          description: result.passwordMessage || "Os dados do fornecedor foram atualizados, mas ocorreu um erro ao atualizar a senha.",
          variant: "default",
        })
      } else {
        toast({
          title: "Fornecedor atualizado",
          description: formData.password 
            ? "As informações e senha do fornecedor foram atualizadas com sucesso."
            : "As informações do fornecedor foram atualizadas com sucesso.",
        })
      }

      // Close dialog and refresh data
      setOpen(false)
      onFornecedorUpdated()
    } catch (error: any) {
      console.error("Erro ao atualizar fornecedor:", error)
      toast({
        title: "Erro ao atualizar fornecedor",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-100/10">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-zinc-800">
        <DialogHeader>
          <DialogTitle>Editar Fornecedor</DialogTitle>
          <DialogDescription>Atualize as informações do fornecedor.</DialogDescription>
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
            <div className="grid gap-2">
              <Label htmlFor="password">Nova Senha (opcional)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Deixe em branco para manter a senha atual"
                className={`bg-[#111] border-zinc-700 ${errors.password ? "border-red-500" : ""}`}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
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
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

