"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Event, User } from "@/types"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { MultiSelect } from "@/components/ui/multi-select"
import { notifyFornecedorChanges } from "@/lib/fornecedor-notification"

// Schema de validação para o formulário
const eventFormSchema = z.object({
  title: z.string().min(3, {
    message: "O título deve ter pelo menos 3 caracteres.",
  }),
  description: z.string().min(10, {
    message: "A descrição deve ter pelo menos 10 caracteres.",
  }),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido. Use HH:MM.",
  }),
  location: z.string().min(3, {
    message: "O local deve ter pelo menos 3 caracteres.",
  }),
  status: z.string(),
  fornecedores: z.array(z.string()).optional(),
  pax: z.coerce.number().int().positive().optional(),
  valor: z.coerce.number().positive().optional(),
  valor_de_custo: z.string().optional(),
  pagamento: z.string().optional(),
  nota_fiscal: z.string().optional(),
  horario_fim: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Formato de hora inválido. Use HH:MM.",
    })
    .optional(),
  dia_pagamento: z.string().optional(),
  event_image: z.string().optional(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

interface EventFormProps {
  event?: Event
  isEditing?: boolean
}

export function EventForm({ event, isEditing = false }: EventFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [fornecedores, setFornecedores] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [eventImage, setEventImage] = useState<string | null>(event?.event_image || null)
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([])
  const [previousFornecedores, setPreviousFornecedores] = useState<string[]>([])

  // Inicializar o formulário com valores padrão ou valores do evento existente
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      date: event?.date ? new Date(event.date) : new Date(),
      time: event?.date ? format(new Date(event.date), "HH:mm") : "09:00",
      location: event?.location || "",
      status: event?.status || "pendente",
      fornecedores: [],
      pax: event?.pax || undefined,
      valor: event?.valor || undefined,
      valor_de_custo: event?.valor_de_custo || "",
      pagamento: event?.pagamento || "pendente",
      nota_fiscal: event?.nota_fiscal || "",
      horario_fim: event?.horario_fim || "",
      dia_pagamento: event?.dia_pagamento || "",
      event_image: event?.event_image || "",
    },
  })

  // Buscar fornecedores e fornecedores do evento atual
  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        // Log para depurar o carregamento e renderização do formulário
        console.log("🔍 DEBUG - Iniciando carregamento do formulário")
        console.log("🔍 Valores iniciais:", form.getValues())
        console.log("🔍 Valor de custo inicial:", form.getValues("valor_de_custo"))
        
        const { data, error } = await supabase.from("users").select("*").eq("role", "fornecedor")

        if (error) {
          console.error("Error fetching fornecedores:", error)
          return
        }

        setFornecedores(data)

        // Se estiver editando, buscar os fornecedores associados a este evento
        if (isEditing && event) {
          const { data: eventFornecedores, error: eventFornecedoresError } = await supabase
            .from("event_fornecedores")
            .select("fornecedor_id")
            .eq("event_id", event.id)

          if (eventFornecedoresError) {
            console.error("Error fetching event fornecedores:", eventFornecedoresError)
            return
          }

          const fornecedoresIds = eventFornecedores.map((ef) => ef.fornecedor_id)
          setSelectedFornecedores(fornecedoresIds)
          setPreviousFornecedores(fornecedoresIds) // Armazenar os fornecedores originais
          form.setValue("fornecedores", fornecedoresIds)
        }
      } catch (error) {
        console.error("Error fetching fornecedores:", error)
      }
    }

    fetchFornecedores()
  }, [event, isEditing, form])

  // Função para lidar com o envio do formulário
  async function onSubmit(values: EventFormValues) {
    // Adicionar log para verificar valores enviados
    console.log("📝 Valores submetidos:", values);
    console.log("📝 Valor de custo submetido:", values.valor_de_custo);
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar ou editar eventos.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Combinar data e hora
      const dateTime = new Date(values.date)
      const [hours, minutes] = values.time.split(":").map(Number)
      dateTime.setHours(hours, minutes)

      // Preparar dados do evento
      const eventData = {
        title: values.title,
        description: values.description,
        date: dateTime.toISOString(),
        location: values.location,
        status: values.status,
        admin_id: user.id,
        pax: values.pax || null,
        valor: values.valor || null,
        valor_de_custo: values.valor_de_custo || null,
        pagamento: values.pagamento || null,
        nota_fiscal: values.nota_fiscal || null,
        horario_fim: values.horario_fim || null,
        dia_pagamento: values.dia_pagamento || null,
        event_image: eventImage,
      }

      console.log("Enviando dados do evento com valor_de_custo:", values.valor_de_custo)

      let eventId: string

      if (isEditing && event) {
        // Atualizar evento existente
        const { data, error } = await supabase.from("events").update(eventData).eq("id", event.id).select()

        if (error) {
          throw error
        }

        eventId = event.id
      } else {
        // Criar novo evento
        const { data, error } = await supabase.from("events").insert([eventData]).select()

        if (error) {
          throw error
        }

        eventId = data[0].id
      }

      // Gerenciar relacionamentos com fornecedores
      if (values.fornecedores && values.fornecedores.length > 0) {
        // Se estiver editando, remover todos os relacionamentos existentes
        if (isEditing && event) {
          await supabase.from("event_fornecedores").delete().eq("event_id", event.id)
        }

        // Criar novos relacionamentos
        const fornecedoresRelationships = values.fornecedores.map((fornecedorId) => ({
          event_id: eventId,
          fornecedor_id: fornecedorId,
        }))

        const { error: relationshipError } = await supabase.from("event_fornecedores").insert(fornecedoresRelationships)

        if (relationshipError) {
          console.error("Error creating fornecedor relationships:", relationshipError)
        }

        // Se estiver editando e houver novos fornecedores, enviar notificação
        if (isEditing && event && values.fornecedores) {
          // Verificar se há novos fornecedores
          const hasNewFornecedores = values.fornecedores.some((id) => !previousFornecedores.includes(id))

          if (hasNewFornecedores) {
            // Formatar a data para a notificação
            const formattedDate = format(dateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

            // Obter a URL base
            const baseUrl = window.location.origin

            // Enviar notificação sobre os novos fornecedores
            const notificationResult = await notifyFornecedorChanges(
              eventId,
              values.title,
              values.fornecedores,
              previousFornecedores,
              formattedDate,
              values.location,
              baseUrl,
            )

            if (notificationResult.success) {
              console.log("Notificação enviada com sucesso:", notificationResult.message)
            } else {
              console.error("Erro ao enviar notificação:", notificationResult.message)
            }
          }
        }
      }

      // Redirecionar para a página do evento
      router.push(`/dashboard/events/${eventId}`)
      router.refresh()

      toast({
        title: isEditing ? "Evento atualizado" : "Evento criado",
        description: isEditing ? "O evento foi atualizado com sucesso." : "O evento foi criado com sucesso.",
      })
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o evento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para lidar com o upload de imagem
  const handleImageUpload = (url: string) => {
    setEventImage(url)
    form.setValue("event_image", url)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Título do evento"
                    {...field}
                    className="bg-[#222222] border-zinc-700 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local</FormLabel>
                <FormControl>
                  <Input placeholder="Local do evento" {...field} className="bg-[#222222] border-zinc-700 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição do evento"
                  {...field}
                  className="min-h-32 bg-[#222222] border-zinc-700 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal bg-[#222222] border-zinc-700 text-white",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#222222] border-zinc-700" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                      className="bg-[#222222]"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input placeholder="HH:MM" {...field} className="bg-[#222222] border-zinc-700 text-white" />
                    <Clock className="ml-2 h-4 w-4 text-gray-400" />
                  </div>
                </FormControl>
                <FormDescription>Formato: HH:MM (24h)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-[#222222] border-zinc-700 text-white">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#222222] border-zinc-700 text-white">
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fornecedores"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedores</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={fornecedores.map((f) => ({ label: f.name, value: f.id }))}
                    selected={selectedFornecedores}
                    onChange={(selected) => {
                      setSelectedFornecedores(selected)
                      field.onChange(selected)
                    }}
                    className="bg-[#222222] border-zinc-700 text-white"
                    placeholder="Selecione os fornecedores"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="pax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Pessoas (PAX)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Número de pessoas"
                    {...field}
                    className="bg-[#222222] border-zinc-700 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Valor do evento"
                    {...field}
                    className="bg-[#222222] border-zinc-700 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="valor_de_custo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor de Custo (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Valor de custo do evento"
                    {...field}
                    className="bg-[#222222] border-zinc-700 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-[#222222] border-zinc-700 text-white">
                      <SelectValue placeholder="Selecione o status do pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#222222] border-zinc-700 text-white">
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nota_fiscal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota Fiscal</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Número da nota fiscal"
                    {...field}
                    className="bg-[#222222] border-zinc-700 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="horario_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário de Término</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input placeholder="HH:MM" {...field} className="bg-[#222222] border-zinc-700 text-white" />
                    <Clock className="ml-2 h-4 w-4 text-gray-400" />
                  </div>
                </FormControl>
                <FormDescription>Formato: HH:MM (24h)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dia_pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia de Pagamento</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Dia de pagamento"
                    {...field}
                    className="bg-[#222222] border-zinc-700 text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Imagem do Evento</FormLabel>
          <div className="mt-2 flex flex-col gap-2">
            {eventImage && (
              <div className="relative aspect-video overflow-hidden rounded-md border border-dashed border-zinc-700 bg-zinc-800">
                <img src={eventImage} alt="Imagem do evento" className="h-full w-full object-cover" />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Para manter a funcionalidade existente
                  // Simulando o upload com um URL fictício
                  handleImageUpload("https://exemplo.com/imagem.jpg");
                }
              }}
              className="bg-[#222222] border-zinc-700 text-white"
            />
            <p className="text-xs text-gray-400">Selecione uma imagem para o evento</p>
          </div>
        </div>

        <Button type="submit" className="bg-yellow-400 text-black hover:bg-yellow-500" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Atualizar Evento" : "Criar Evento"}
        </Button>
      </form>
    </Form>
  )
}

