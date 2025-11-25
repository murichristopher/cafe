"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, Clock, Loader2, MapPin, ArrowLeft, Users, Receipt, CreditCard } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { EventWithFornecedor } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format } from "date-fns"
import { ImageUploadSimple } from "@/components/ui/image-upload-simple"
import type { Option } from "@/components/ui/multi-select"
import { notifyFornecedorChanges } from "@/lib/fornecedor-notification"
import { ptBR } from "date-fns/locale"

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params)

  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [fetchingFornecedores, setFetchingFornecedores] = useState(true)
  const [fornecedores, setFornecedores] = useState<Option[]>([])
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([])
  const [previousFornecedores, setPreviousFornecedores] = useState<string[]>([])
  const [eventImage, setEventImage] = useState<string>("")
  const [event, setEvent] = useState<EventWithFornecedor | null>(null)

  // Form data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [dataTermino, setDataTermino] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [cidade, setCidade] = useState("")
  const [status, setStatus] = useState("pendente")
  const [valor, setValor] = useState("")
  const [valorDeCusto, setValorDeCusto] = useState("")
  const [notaFiscal, setNotaFiscal] = useState("")
  const [pagamento, setPagamento] = useState("pendente")
  const [diaPagamento, setDiaPagamento] = useState("")
  const [pax, setPax] = useState<string>("")

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      setIsFetching(true)
      try {
        // Buscar o evento
        const { data, error } = await supabase
          .from("events")
          .select("*, fornecedor:fornecedor_id(id, name, email)")
          .eq("id", eventId)
          .single()

        if (error) {
          console.error("Error fetching event:", error)
          toast({
            title: "Erro ao carregar evento",
            description: "Não foi possível carregar os detalhes do evento.",
            variant: "destructive",
          })
          return
        }

        const eventData = data as EventWithFornecedor
        setEvent(eventData)

        // Format date and time
        const eventDate = new Date(eventData.date)
        const formattedDate = format(eventDate, "yyyy-MM-dd")
        const formattedTime = format(eventDate, "HH:mm")

        // Format data_termino if it exists
        let formattedDataTermino = ""
        if (eventData.data_termino) {
          const dataTerminoDate = new Date(eventData.data_termino)
          formattedDataTermino = format(dataTerminoDate, "yyyy-MM-dd")
        }

        // Format payment date correctly by using the local timezone
        let formattedPaymentDate = ""
        if (eventData.dia_pagamento) {
          const paymentDate = new Date(eventData.dia_pagamento + "T12:00:00")
          formattedPaymentDate = format(paymentDate, "yyyy-MM-dd")
        }

        // Set form data
        setTitle(eventData.title)
        setDescription(eventData.description)
        setDate(formattedDate)
        setDataTermino(formattedDataTermino)
        setStartTime(formattedTime)
        setEndTime(eventData.horario_fim || "")
        setLocation(eventData.location)
        setCidade(eventData.cidade || "")
        setStatus(eventData.status)
        setValor(eventData.valor ? eventData.valor.toString() : "")
        setValorDeCusto(eventData.valor_de_custo ? eventData.valor_de_custo.toString() : "")
        setNotaFiscal(eventData.nota_fiscal || "")
        setPagamento(eventData.pagamento || "pendente")
        setDiaPagamento(formattedPaymentDate)
        setPax(eventData.pax ? eventData.pax.toString() : "")
        setEventImage(eventData.event_image || "")

        // Buscar os fornecedores associados ao evento
        const { data: eventFornecedores, error: fornecedoresError } = await supabase
          .from("event_fornecedores")
          .select("fornecedor_id")
          .eq("event_id", eventId)

        if (fornecedoresError) {
          console.error("Erro ao buscar fornecedores do evento:", fornecedoresError)
        } else if (eventFornecedores) {
          const fornecedorIds = eventFornecedores.map((ef) => ef.fornecedor_id)
          setSelectedFornecedores(fornecedorIds)
          setPreviousFornecedores(fornecedorIds) // Armazenar os fornecedores originais
        }
      } catch (error) {
        console.error("Error fetching event:", error)
        toast({
          title: "Erro ao carregar evento",
          description: "Ocorreu um erro inesperado ao carregar os detalhes do evento.",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchEvent()
  }, [eventId, toast])

  // Fetch fornecedores
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

  const handleImageUploaded = (imageUrl: string) => {
    setEventImage(imageUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para editar um evento.",
        variant: "destructive",
      })
      return
    }

    if (!event) {
      toast({
        title: "Erro ao editar evento",
        description: "Evento não encontrado.",
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
      
      // Formatar data de término se existir
      let formattedDataTermino = null
      if (dataTermino) {
        // Se temos a data de término, usar o horário de fim ou meio-dia como padrão
        const terminoTime = endTime || "12:00"
        formattedDataTermino = new Date(`${dataTermino}T${terminoTime}`).toISOString()
      }

      // Corrigir o problema da data de pagamento usando o fuso horário local
      let formattedDiaPagamento = null
      if (diaPagamento) {
        // Usar o horário meio-dia (12:00) para evitar problemas de fuso horário
        formattedDiaPagamento = new Date(`${diaPagamento}T12:00:00`).toISOString().split("T")[0]
      }

      // Preparar dados para atualização
      const eventData = {
        title,
        description,
        date: eventDate.toISOString(),
        location,
        cidade: cidade || null,
        fornecedor_id: null, // Não usamos mais este campo diretamente
        status,
        valor: valor ? Number.parseFloat(valor) : null,
        valor_de_custo: valorDeCusto ? Number.parseFloat(valorDeCusto) : null,
        nota_fiscal: notaFiscal || null,
        pagamento,
        horario_fim: endTime || null,
        dia_pagamento: formattedDiaPagamento,
        pax: pax ? Number.parseInt(pax, 10) : null,
        event_image: eventImage || null,
        data_termino: formattedDataTermino,
      }

      // Atualizar o evento
      const { error } = await supabase.from("events").update(eventData).eq("id", eventId)

      if (error) {
        throw error
      }

      // Atualizar os fornecedores do evento
      // 1. Remover todos os fornecedores existentes
      const { error: deleteError } = await supabase.from("event_fornecedores").delete().eq("event_id", eventId)

      if (deleteError) {
        console.error("Erro ao remover fornecedores existentes:", deleteError)
        throw deleteError
      }

      // 2. Adicionar os fornecedores selecionados
      if (selectedFornecedores.length > 0) {
        const fornecedoresData = selectedFornecedores.map((fornecedorId) => ({
          event_id: eventId,
          fornecedor_id: fornecedorId,
        }))

        const { error: insertError } = await supabase.from("event_fornecedores").insert(fornecedoresData)

        if (insertError) {
          console.error("Erro ao adicionar fornecedores:", insertError)
          toast({
            title: "Aviso",
            description: "Evento atualizado, mas houve um erro ao adicionar fornecedores.",
            variant: "destructive",
          })
        }

        // Verificar se há novos fornecedores
        const hasNewFornecedores = selectedFornecedores.some((id) => !previousFornecedores.includes(id))

        if (hasNewFornecedores) {
          // Formatar a data para a notificação
          const formattedDate = format(eventDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

          // Obter a URL base
          const baseUrl = window.location.origin

          // Enviar notificação sobre os novos fornecedores
          const notificationResult = await notifyFornecedorChanges(
            eventId,
            title,
            selectedFornecedores,
            previousFornecedores,
            formattedDate,
            location,
            baseUrl,
          )

          if (notificationResult.success) {
            console.log("Notificação enviada com sucesso:", notificationResult.message)
          } else {
            console.error("Erro ao enviar notificação:", notificationResult.message)
          }
        }
      }

      toast({
        title: "Evento atualizado com sucesso",
        description: "As alterações foram salvas com sucesso.",
      })

      // Redirecionar para a página de detalhes do evento
      router.push(`/dashboard/events/${eventId}`)
    } catch (error: any) {
      console.error("Erro ao atualizar evento:", error)
      toast({
        title: "Erro ao atualizar evento",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Redirecionar para dashboard se não for admin
  if (user && user.role !== "admin") {
    return router.push("/dashboard")
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Evento não encontrado</p>
        <Link href="/dashboard/events" className="text-yellow-400 hover:underline mt-4 inline-block">
          Voltar para eventos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href={`/dashboard/events/${eventId}`} className="flex items-center text-yellow-400 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para detalhes do evento
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-zinc-800 shadow-lg bg-[#1a1a1a] dark:bg-[#1a1a1a]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Editar Evento</CardTitle>
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
                  onImageUploaded={handleImageUploaded}
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

              {/* Data de Término */}
              <div className="space-y-2">
                <Label htmlFor="dataTermino" className="text-sm font-medium">
                  Data de Término
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dataTermino"
                    type="date"
                    className="pl-10 w-full focus:ring-offset-2"
                    value={dataTermino}
                    onChange={(e) => setDataTermino(e.target.value)}
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

              {/* Cidade */}
              <div className="space-y-2">
                <Label htmlFor="cidade" className="text-sm font-medium">
                  Cidade
                </Label>
                <Input
                  id="cidade"
                  placeholder="Cidade do evento"
                  className="w-full focus:ring-offset-2"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  disabled={isLoading}
                />
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

              {/* Valor de Custo */}
              <div className="space-y-2">
                <Label htmlFor="valorDeCusto" className="text-sm font-medium">
                  Valor de Custo (R$)
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="valorDeCusto"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10 w-full focus:ring-offset-2"
                    value={valorDeCusto}
                    onChange={(e) => setValorDeCusto(e.target.value)}
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
            <Link href={`/dashboard/events/${eventId}`}>
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
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

