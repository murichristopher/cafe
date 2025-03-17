"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Mail, Search, User, Trash, Loader2, Phone } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { User as UserType } from "@/types"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
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
import { FornecedorFormDialog } from "@/components/fornecedor-form-dialog"

export default function FornecedoresPage() {
  const { user } = useAuth()
  const [fornecedores, setFornecedores] = useState<UserType[]>([])
  const [filteredFornecedores, setFilteredFornecedores] = useState<UserType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Adicionar estado para controlar o fornecedor selecionado para exclusão
  const [selectedFornecedor, setSelectedFornecedor] = useState<UserType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Adicionar função para excluir fornecedor
  const handleDeleteFornecedor = async (fornecedorId: string) => {
    setIsDeleting(true)
    try {
      // Primeiro, verificar se o fornecedor está associado a algum evento
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id")
        .eq("fornecedor_id", fornecedorId)

      if (eventsError) {
        throw eventsError
      }

      if (events && events.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: `Este fornecedor está associado a ${events.length} evento(s). Remova as associações primeiro.`,
          variant: "destructive",
        })
        return
      }

      // Se não houver eventos associados, excluir o fornecedor
      const { error } = await supabase.from("users").delete().eq("id", fornecedorId)

      if (error) {
        throw error
      }

      toast({
        title: "Fornecedor excluído",
        description: "O fornecedor foi excluído com sucesso.",
      })

      // Atualizar a lista de fornecedores
      setFornecedores(fornecedores.filter((f) => f.id !== fornecedorId))
      setFilteredFornecedores(filteredFornecedores.filter((f) => f.id !== fornecedorId))
    } catch (error: any) {
      console.error("Erro ao excluir fornecedor:", error)
      toast({
        title: "Erro ao excluir fornecedor",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setSelectedFornecedor(null)
    }
  }

  useEffect(() => {
    const fetchFornecedores = async () => {
      setIsLoading(true)

      try {
        const { data, error } = await supabase.from("users").select("*").eq("role", "fornecedor")

        if (error) {
          console.error("Error fetching fornecedores:", error)
          return
        }

        setFornecedores(data as UserType[])
        setFilteredFornecedores(data as UserType[])
      } catch (error) {
        console.error("Error fetching fornecedores:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.role === "admin") {
      fetchFornecedores()
    }
  }, [user])

  useEffect(() => {
    if (searchTerm) {
      const filtered = fornecedores.filter(
        (fornecedor) =>
          fornecedor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fornecedor.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredFornecedores(filtered)
    } else {
      setFilteredFornecedores(fornecedores)
    }
  }, [searchTerm, fornecedores])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        {user?.role === "admin" && <FornecedorFormDialog />}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar fornecedores..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          </div>
        ) : filteredFornecedores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <User className="h-12 w-12 text-muted-foreground" />
              <CardDescription className="mt-4 text-center">Nenhum fornecedor encontrado.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFornecedores.map((fornecedor) => (
              <motion.div
                key={fornecedor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">{fornecedor.name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100/10"
                        onClick={() => setSelectedFornecedor(fornecedor)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="mr-2 h-4 w-4" />
                      {fornecedor.email}
                    </div>
                    {fornecedor.phone_number && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="mr-2 h-4 w-4" />
                        {fornecedor.phone_number}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {/* Dialog de confirmação para excluir fornecedor */}
      <AlertDialog open={!!selectedFornecedor} onOpenChange={(open) => !open && setSelectedFornecedor(null)}>
        <AlertDialogContent className="bg-[#1a1a1a] border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor {selectedFornecedor?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => selectedFornecedor && handleDeleteFornecedor(selectedFornecedor.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

