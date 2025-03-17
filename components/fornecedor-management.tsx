"use client"

import { useState } from "react"
import type { User } from "@/types"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Trash2, Edit, UserPlus } from "lucide-react"
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

interface FornecedorManagementProps {
  fornecedores: User[]
  onUpdate: () => void
}

export function FornecedorManagement({ fornecedores, onUpdate }: FornecedorManagementProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFornecedor, setSelectedFornecedor] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (fornecedor: User) => {
    setSelectedFornecedor(fornecedor)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedFornecedor) return

    setIsDeleting(true)
    try {
      // Problema: A função estava apenas atualizando o estado local, mas não estava
      // realmente excluindo o fornecedor do banco de dados
      const { error } = await supabase.from("users").delete().eq("id", selectedFornecedor.id)

      if (error) {
        throw error
      }

      // Verificar se há eventos associados a este fornecedor e atualizar para null
      await supabase.from("events").update({ fornecedor_id: null }).eq("fornecedor_id", selectedFornecedor.id)

      toast({
        title: "Fornecedor excluído",
        description: `${selectedFornecedor.name} foi removido com sucesso.`,
      })

      // Atualizar a lista de fornecedores
      onUpdate()
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error)
      toast({
        title: "Erro ao excluir fornecedor",
        description: "Ocorreu um erro ao tentar excluir o fornecedor. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSelectedFornecedor(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Gerenciar Fornecedores</h2>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Fornecedor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fornecedores.map((fornecedor) => (
          <div key={fornecedor.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{fornecedor.name}</h3>
                <p className="text-sm text-muted-foreground">{fornecedor.email}</p>
                {fornecedor.phone_number && <p className="text-sm text-muted-foreground">{fornecedor.phone_number}</p>}
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(fornecedor)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedFornecedor?.name}? Esta ação não pode ser desfeita.
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
    </div>
  )
}

