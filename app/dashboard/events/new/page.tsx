"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, Clock, Loader2, MapPin, ArrowLeft, Users, Receipt, CreditCard } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ImageUploadSimple } from "@/components/ui/image-upload-simple"
import type { Option } from "@/components/ui/multi-select"

// Define the User type
type User = {
  id: string
  name: string
  phone_number: string
  email: string
  role: string
}

export default function NewEventPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [fetchingFornecedores, setFetchingFornecedores] = useState(true)
  const [fornecedores, setFornecedores] = useState<Option[]>([])
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([])
  const [eventImage, setEventImage] = useState<string>("")

  // Form data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState("pendente")
  const [valor, setValor] = useState("")
  const [notaFiscal, setNotaFiscal] = useState("")
  const [pagamento, setPagamento] = useState("pendente")
  const [diaPagamento, setDiaPagamento] = useState("")
  const [pax, setPax] = useState<string>("")

  // Fetch fornecedores on component mount
  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const { data, error } = await supabase.from("users").select("id, name").eq("role", "fornecedor")

        if (error) {
          console.error("Erro ao buscar fornecedores:", error)
          toast({
            title: "Erro ao carregar fornecedores",
            description: error.message,
            variant: "destructive",
          })
          return
        }

        setFornecedores(
          data.map((user) => ({
            label: user.name,
            value: user.id,
          })),
        )
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error)
        toast({
          title: "Erro ao carregar fornecedores",
          description: "Ocorreu um erro inesperado ao buscar fornecedores.",
          variant: "destructive",
        })
      } finally {
        setFetchingFornecedores(false)
      }
    }

    fetchFornecedores()
  }, [toast])

  const handleImageUpload = (imageUrl: string) => {
    setEventImage(imageUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar um evento.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Validar data e hora
      if (!date || !startTime) {
        throw new Error("Data e horário de início são obrigatórios")
      }

      const eventDate = new Date(`${date}T${startTime}`)

      // Corrigir o problema da data de pagamento usando o fuso horário local
      let formattedDiaPagamento = null
      if (diaPagamento) {
        // Usar o horário meio-dia (12:00) para evitar problemas de fuso horário
        formattedDiaPagamento = new Date(`${diaPagamento}T12:00:00`).toISOString().split("T")[0]
      }

      // Preparar dados para inserção
      const eventData = {
        title,
        description,
        date: eventDate.toISOString(),
        location,
        admin_id: user.id,
        fornecedor_id: null, // Não usamos mais este campo diretamente
        status,
        valor: valor ? Number.parseFloat(valor) : null,
        nota_fiscal: notaFiscal || null,
        pagamento,
        horario_fim: endTime || null,
        dia_pagamento: formattedDiaPagamento,
        pax: pax ? Number.parseInt(pax, 10) : null,
        event_image: eventImage || null,
      }

      console.log("Dados do evento a serem enviados:", eventData)

      // Inserir o evento
      const { data, error } = await supabase.from("events").insert([eventData]).select()

      if (error) {
        throw error
      }

      const eventId = data[0].id
      console.log(`Evento criado com ID: ${eventId}`)

      // Adicionar fornecedores ao evento
      if (selectedFornecedores.length > 0) {
        console.log(
          `Adicionando ${selectedFornecedores.length} fornecedores ao evento ${eventId}:`,
          selectedFornecedores,
        )

        // Preparar dados para inserção na tabela event_fornecedores
        const fornecedoresData = selectedFornecedores.map((fornecedorId) => ({
          event_id: eventId,
          fornecedor_id: fornecedorId,
        }))

        // Inserir relacionamentos na tabela event_fornecedores
        const { error: fornecedoresError } = await supabase.from("event_fornecedores").insert(fornecedoresData)

        if (fornecedoresError) {
          console.error("Erro ao adicionar fornecedores:", fornecedoresError)
          toast({
            title: "Aviso",
            description: "Evento criado, mas houve um erro ao adicionar fornecedores.",
            variant: "destructive",
          })
        } else {
          console.log(`Fornecedores adicionados com sucesso ao evento ${eventId}`)

          // Verificar se os fornecedores foram realmente adicionados
          const { data: checkData, error: checkError } = await supabase
            .from("event_fornecedores")
            .select("*")
            .eq("event_id", eventId)

          if (checkError) {
            console.error("Erro ao verificar fornecedores:", checkError)
          } else {
            console.log(`Verificação de fornecedores: ${checkData.length} encontrados para o evento ${eventId}`)
          }
        }
      } else {
        console.log(`Nenhum fornecedor selecionado para o evento ${eventId}`)
      }

      // Aguardar um pouco para garantir que os dados estejam consistentes no banco
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Notify fornecedores via WhatsApp
      try {
        console.log(`Enviando notificações para fornecedores do evento ${eventId}`)

        // Fetch complete fornecedor data for the selected IDs
        const fornecedoresData: User[] = []

        if (selectedFornecedores.length > 0) {
          // Fetch each fornecedor individually to avoid RLS issues
          for (const fornecedorId of selectedFornecedores) {
            const { data, error } = await supabase
              .from("users")
              .select("id, name, phone_number, email, role")
              .eq("id", fornecedorId)
              .single()

            if (!error && data) {
              fornecedoresData.push(data as User)
            }
          }

          console.log(`Fetched ${fornecedoresData.length} fornecedores for notification`)
        }

        const response = await fetch(`/api/events/${eventId}/notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fornecedores: fornecedoresData, // Pass complete fornecedor data
          }),
        })

        const notificationResult = await response.json()

        if (!response.ok) {
          console.warn("Evento criado, mas houve um problema ao enviar notificações:", notificationResult.error)
          toast({
            title: "Evento criado",
            description: "Evento criado com sucesso, mas houve um problema ao enviar notificações para fornecedores.",
            variant: "default",
          })
        } else {
          console.log("Notificações enviadas com sucesso:", notificationResult)
        }
      } catch (notifyError) {
        console.error("Erro ao enviar notificações:", notifyError)
      }

      toast({
        title: "Evento criado com sucesso",
        description: "O evento foi criado e os fornecedores foram notificados via WhatsApp.",
      })

      // Redirecionar para a listagem de eventos
      router.push("/dashboard/events")
    } catch (error: any) {
      console.error("Erro ao criar evento:", error)
      toast({
        title: "Erro ao criar evento",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Redirecionar para dashboard se não for admin
  if (user && user.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href="/dashboard/events" className="flex items-center text-yellow-400 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para eventos
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-zinc-800 shadow-lg bg-[#1a1a1a] dark:bg-[#1a1a1a]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Novo Evento</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome do evento */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Nome do evento
                </Label>
                <Input
                  id="title"
                  placeholder="Nome do evento"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full focus:ring-offset-2"
                  disabled={isLoading}
                />
              </div>

              {/* Imagem do evento */}
              <div className="space-y-2">
                <Label htmlFor="event-image" className="text-sm font-medium">
                  Imagem do Evento
                </Label>
                <ImageUploadSimple
                  currentImageUrl={eventImage}
                  onImageUploaded={handleImageUpload}
                  disabled={isLoading}
                />
              </div>

              {/* Detalhes */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Detalhes
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descrição do evento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="min-h-[100px] w-full"
                  disabled={isLoading}
                />
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Data
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-10 w-full focus:ring-offset-2"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium">
                    Horário de início
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="startTime"
                      type="time"
                      className="pl-10 w-full focus:ring-offset-2"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium">
                    Horário de fim
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="endTime"
                      type="time"
                      className="pl-10 w-full focus:ring-offset-2"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Endereço
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Endereço do evento"
                    className="pl-10 w-full focus:ring-offset-2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Número de Pessoas (PAX) */}
              <div className="space-y-2">
                <Label htmlFor="pax" className="text-sm font-medium">
                  Número de Pessoas (PAX)
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pax"
                    type="number"
                    min="1"
                    placeholder="Quantidade de pessoas"
                    className="pl-10 w-full focus:ring-offset-2"
                    value={pax}
                    onChange={(e) => setPax(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Fornecedores - Substituindo o MultiSelect por uma lista de checkboxes */}
              <div className="space-y-2">
                <Label htmlFor="fornecedores" className="text-sm font-medium">
                  Fornecedores
                </Label>
                <div className="border border-input rounded-md p-3 max-h-60 overflow-y-auto">
                  {fetchingFornecedores ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : fornecedores.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum fornecedor disponível</p>
                  ) : (
                    <div className="space-y-2">
                      {fornecedores.map((fornecedor) => (
                        <div key={fornecedor.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`fornecedor-${fornecedor.value}`}
                            checked={selectedFornecedores.includes(fornecedor.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFornecedores([...selectedFornecedores, fornecedor.value])
                              } else {
                                setSelectedFornecedores(selectedFornecedores.filter((id) => id !== fornecedor.value))
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
                          />
                          <label htmlFor={`fornecedor-${fornecedor.value}`} className="text-sm font-medium">
                            {fornecedor.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nota Fiscal */}
              <div className="space-y-2">
                <Label htmlFor="notaFiscal" className="text-sm font-medium">
                  Nota Fiscal
                </Label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="notaFiscal"
                    placeholder="Número da nota fiscal"
                    className="pl-10 w-full focus:ring-offset-2"
                    value={notaFiscal}
                    onChange={(e) => setNotaFiscal(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Valor do Evento */}
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-sm font-medium">
                  Valor do evento (R$)
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10 w-full focus:ring-offset-2"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus} disabled={isLoading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dia do Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="diaPagamento" className="text-sm font-medium">
                  Dia do pagamento
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="diaPagamento"
                    type="date"
                    className="pl-10 w-full focus:ring-offset-2"
                    value={diaPagamento}
                    onChange={(e) => setDiaPagamento(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Status do Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="pagamento" className="text-sm font-medium">
                  Status do pagamento
                </Label>
                <Select value={pagamento} onValueChange={setPagamento} disabled={isLoading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status do pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex justify-end gap-4">
            <Link href="/dashboard/events">
              <Button variant="outline" className="border-zinc-700 text-white">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Evento"
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

