"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, Loader2, X } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface EventFormModalProps {
  isOpen: boolean
  onClose: () => void
  onEventCreated: () => void
}

export function EventFormModal({ isOpen, onClose, onEventCreated }: EventFormModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [location, setLocation] = useState("")
  const [fornecedorId, setFornecedorId] = useState("")
  const [status, setStatus] = useState("pending")
  const [valor, setValor] = useState("")
  const [notaFiscal, setNotaFiscal] = useState("")
  const [pagamento, setPagamento] = useState("pendente")
  const [fornecedores, setFornecedores] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingFornecedores, setIsFetchingFornecedores] = useState(true)

  useState(() => {
    const fetchFornecedores = async () => {
      setIsFetchingFornecedores(true)

      try {
        const { data, error } = await supabase.from("users").select("*").eq("role", "fornecedor")

        if (error) {
          console.error("Erro ao buscar fornecedores:", error)
          return
        }

        setFornecedores(data as User[])
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error)
      } finally {
        setIsFetchingFornecedores(false)
      }
    }

    if (isOpen) {
      fetchFornecedores()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (!isSupabaseConfigured()) {
      toast({
        title: "Erro de configuração",
        description: "O Supabase não está configurado corretamente. Verifique as variáveis de ambiente.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const eventDate = new Date(`${date}T${time}`)

      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title,
            description,
            date: eventDate.toISOString(),
            location,
            admin_id: user.id,
            fornecedor_id: fornecedorId || null,
            status,
            valor: valor ? Number.parseFloat(valor) : null,
            nota_fiscal: notaFiscal || null,
            pagamento,
          },
        ])
        .select()

      if (error) {
        toast({
          title: "Erro ao criar evento",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Evento criado com sucesso",
        description: "O evento foi criado e está pendente de confirmação.",
      })

      // Limpar o formulário
      setTitle("")
      setDescription("")
      setDate("")
      setTime("")
      setLocation("")
      setFornecedorId("")
      setStatus("pending")
      setValor("")
      setNotaFiscal("")
      setPagamento("pendente")

      // Fechar o modal e notificar o componente pai
      onClose()
      onEventCreated()
    } catch (error) {
      toast({
        title: "Erro ao criar evento",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Novo Evento</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Nome do Evento</Label>
                <Input
                  id="title"
                  placeholder="Nome do evento"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Detalhes</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição do evento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-10"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    className="pl-10"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  placeholder="Local do evento"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {isFetchingFornecedores ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : fornecedores.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">Nenhum fornecedor encontrado</div>
                    ) : (
                      fornecedores.map((fornecedor) => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notaFiscal">Nota Fiscal</Label>
                <Input
                  id="notaFiscal"
                  placeholder="Número da nota fiscal"
                  value={notaFiscal}
                  onChange={(e) => setNotaFiscal(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pagamento">Pagamento</Label>
                <Select value={pagamento} onValueChange={setPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status do pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-4 md:col-span-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Evento"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

