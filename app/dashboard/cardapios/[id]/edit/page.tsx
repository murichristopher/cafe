"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, Clock, Loader2, ArrowLeft, Users, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Cardapio } from "@/types"

// Opções pré-definidas
const SALGADOS_OPTIONS = [
  "Canapés de frango",
  "Canapés de cream cheese com parmesão",
  "Quiche de tomate com manjericão",
  "Quiche de queijo",
  "Barquete de salaminho com cream cheese",
  "Espetinho de legumes",
  "Kibe com geleia de pimenta",
  "Coxinha de frango com geleia de hortelã",
  "Bolinhas de queijo",
  "Mini caponata com toradinhas",
  "Queijo camembert com geleia de frutas vermelhas",
  "Dadinho de tapioca com melado de cana",
  "Brioche de Salame italiano",
  "Salgadinhos assados variados",
]

const DOCES_OPTIONS = [
  "Mini tortinha de morango",
  "Mini palha italiana",
  "Banoffee nas tacinhas",
  "Cookies",
]

const BEBIDAS_OPTIONS = [
  "Drinks variados",
  "Cerveja",
  "Espumante",
]

const SANDUICHES_OPTIONS = [
  "Brioche de Salame italiano",
  "Salgadinhos assados variados",
]

export default function EditCardapioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: cardapioId } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // Form data
  const [data, setData] = useState("")
  const [horarioInicio, setHorarioInicio] = useState("")
  const [horarioFim, setHorarioFim] = useState("")
  const [quantidadeParticipantes, setQuantidadeParticipantes] = useState("")
  const [nomeCliente, setNomeCliente] = useState("")
  const [local, setLocal] = useState("")
  const [titulo, setTitulo] = useState("")
  const [investimento, setInvestimento] = useState("")
  const [salgados, setSalgados] = useState<string[]>([])
  const [salgadoCustom, setSalgadoCustom] = useState("")
  const [sanduiches, setSanduiches] = useState<string[]>([])
  const [sanduicheCustom, setSanduicheCustom] = useState("")
  const [doces, setDoces] = useState<string[]>([])
  const [doceCustom, setDoceCustom] = useState("")
  const [bebidas, setBebidas] = useState<Array<{ nome: string; quantidade: string }>>([])
  const [bebidaCustom, setBebidaCustom] = useState("")
  const [bebidaQuantidade, setBebidaQuantidade] = useState("")
  const [informacoesAdicionais, setInformacoesAdicionais] = useState("")

  // Fetch cardapio data
  useEffect(() => {
    const fetchCardapio = async () => {
      setIsFetching(true)
      try {
        const { data: cardapioData, error } = await supabase
          .from("cardapios")
          .select("*")
          .eq("id", cardapioId)
          .single()

        if (error) {
          console.error("Error fetching cardapio:", error)
          toast({
            title: "Erro ao carregar cardápio",
            description: "Não foi possível carregar os detalhes do cardápio.",
            variant: "destructive",
          })
          router.push("/dashboard/cardapios")
          return
        }

        const cardapio = cardapioData as Cardapio

        // Format date
        const cardapioDate = new Date(cardapio.data)
        const formattedDate = cardapioDate.toISOString().split("T")[0]

        setData(formattedDate)
        setHorarioInicio(cardapio.horario_inicio)
        setHorarioFim(cardapio.horario_fim || "")
        setQuantidadeParticipantes(cardapio.quantidade_participantes.toString())
        setNomeCliente(cardapio.nome_cliente || "")
        setLocal(cardapio.local || "")
        setTitulo(cardapio.titulo || "")
        setInvestimento(cardapio.investimento?.toString() || "")
        setSalgados(cardapio.salgados || [])
        setSanduiches(cardapio.sanduiches || [])
        setDoces(cardapio.doces || [])
        
        // Convert bebidas object to array
        const bebidasArray: Array<{ nome: string; quantidade: string }> = []
        if (cardapio.bebidas) {
          Object.entries(cardapio.bebidas).forEach(([nome, quantidade]) => {
            bebidasArray.push({ nome, quantidade: quantidade.toString() })
          })
        }
        setBebidas(bebidasArray)
        
        setInformacoesAdicionais(cardapio.informacoes_adicionais || "")
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao carregar o cardápio.",
          variant: "destructive",
        })
        router.push("/dashboard/cardapios")
      } finally {
        setIsFetching(false)
      }
    }

    fetchCardapio()
  }, [cardapioId, router, toast])

  const handleSalgadoToggle = (salgado: string) => {
    if (salgados.includes(salgado)) {
      setSalgados(salgados.filter((s) => s !== salgado))
    } else {
      setSalgados([...salgados, salgado])
    }
  }

  const handleAddSalgadoCustom = () => {
    if (salgadoCustom.trim() && !salgados.includes(salgadoCustom.trim())) {
      setSalgados([...salgados, salgadoCustom.trim()])
      setSalgadoCustom("")
    }
  }

  const handleSanduicheToggle = (sanduiche: string) => {
    if (sanduiches.includes(sanduiche)) {
      setSanduiches(sanduiches.filter((s) => s !== sanduiche))
    } else {
      setSanduiches([...sanduiches, sanduiche])
    }
  }

  const handleAddSanduicheCustom = () => {
    if (sanduicheCustom.trim() && !sanduiches.includes(sanduicheCustom.trim())) {
      setSanduiches([...sanduiches, sanduicheCustom.trim()])
      setSanduicheCustom("")
    }
  }

  const handleDoceToggle = (doce: string) => {
    if (doces.includes(doce)) {
      setDoces(doces.filter((d) => d !== doce))
    } else {
      setDoces([...doces, doce])
    }
  }

  const handleAddDoceCustom = () => {
    if (doceCustom.trim() && !doces.includes(doceCustom.trim())) {
      setDoces([...doces, doceCustom.trim()])
      setDoceCustom("")
    }
  }

  const handleBebidaToggle = (bebida: string) => {
    const existingIndex = bebidas.findIndex((b) => b.nome === bebida)
    if (existingIndex >= 0) {
      setBebidas(bebidas.filter((_, i) => i !== existingIndex))
    } else {
      setBebidas([...bebidas, { nome: bebida, quantidade: "1" }])
    }
  }

  const handleBebidaQuantidadeChange = (nome: string, quantidade: string) => {
    const newBebidas = bebidas.map((b) => (b.nome === nome ? { ...b, quantidade } : b))
    setBebidas(newBebidas)
  }

  const handleAddBebidaCustom = () => {
    if (bebidaCustom.trim() && !bebidas.some((b) => b.nome === bebidaCustom.trim())) {
      setBebidas([...bebidas, { nome: bebidaCustom.trim(), quantidade: bebidaQuantidade || "1" }])
      setBebidaCustom("")
      setBebidaQuantidade("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação
    if (!data || !horarioInicio || !horarioFim || !quantidadeParticipantes) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (salgados.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos um salgado",
        variant: "destructive",
      })
      return
    }

    if (doces.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos um doce",
        variant: "destructive",
      })
      return
    }

    if (bebidas.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos uma bebida",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Converter bebidas para objeto
      const bebidasObj: Record<string, number> = {}
      bebidas.forEach((bebida) => {
        bebidasObj[bebida.nome] = parseInt(bebida.quantidade) || 1
      })

      // Atualizar no banco de dados
      const { error: updateError } = await supabase
        .from("cardapios")
        .update({
          data,
          horario_inicio: horarioInicio,
          horario_fim: horarioFim,
          quantidade_participantes: parseInt(quantidadeParticipantes),
          nome_cliente: nomeCliente.trim() || null,
          local: local.trim() || null,
          titulo: titulo.trim() || "COQUETEL",
          investimento: investimento ? parseFloat(investimento) : null,
          sanduiches: sanduiches || [],
          salgados,
          doces,
          bebidas: bebidasObj,
          informacoes_adicionais: informacoesAdicionais.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cardapioId)

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Cardápio atualizado com sucesso",
        description: "Redirecionando...",
      })

      router.push("/dashboard/cardapios")
    } catch (error: any) {
      console.error("Erro ao atualizar cardápio:", error)
      toast({
        title: "Erro ao atualizar cardápio",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/cardapios" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Cardápios
          </Link>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <Card className="border-zinc-800 shadow-lg bg-[#1a1a1a] dark:bg-[#1a1a1a]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Editar Cardápio</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações do Evento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Informações do Evento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data" className="text-sm font-medium">
                      Data *
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="data"
                        type="date"
                        className="pl-10 w-full"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidadeParticipantes" className="text-sm font-medium">
                      Participantes *
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="quantidadeParticipantes"
                        type="number"
                        min="1"
                        className="pl-10 w-full"
                        value={quantidadeParticipantes}
                        onChange={(e) => setQuantidadeParticipantes(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horarioInicio" className="text-sm font-medium">
                      Horário Início *
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="horarioInicio"
                        type="time"
                        className="pl-10 w-full"
                        value={horarioInicio}
                        onChange={(e) => setHorarioInicio(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horarioFim" className="text-sm font-medium">
                      Horário Fim *
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="horarioFim"
                        type="time"
                        className="pl-10 w-full"
                        value={horarioFim}
                        onChange={(e) => setHorarioFim(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeCliente" className="text-sm font-medium">
                      Nome do Cliente
                    </Label>
                    <Input
                      id="nomeCliente"
                      placeholder="Nome do cliente"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="local" className="text-sm font-medium">
                      Local
                    </Label>
                    <Input
                      id="local"
                      placeholder="Local do evento"
                      value={local}
                      onChange={(e) => setLocal(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo" className="text-sm font-medium">
                      Título
                    </Label>
                    <Input
                      id="titulo"
                      placeholder="COQUETEL"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="investimento" className="text-sm font-medium">
                      Investimento
                    </Label>
                    <Input
                      id="investimento"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={investimento}
                      onChange={(e) => setInvestimento(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Sanduíches */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-white">Sanduíches</Label>
                <div className="border border-zinc-700 rounded-md p-4 bg-zinc-900">
                  <div className="grid grid-cols-2 gap-4">
                    {SANDUICHES_OPTIONS.map((sanduiche) => (
                      <div key={sanduiche} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`sanduiche-${sanduiche}`}
                          checked={sanduiches.includes(sanduiche)}
                          onChange={() => handleSanduicheToggle(sanduiche)}
                          disabled={isLoading}
                          className="h-4 w-4 rounded border-zinc-600 text-yellow-400 focus:ring-yellow-400 bg-zinc-800"
                        />
                        <label
                          htmlFor={`sanduiche-${sanduiche}`}
                          className="text-sm text-white cursor-pointer flex-1"
                        >
                          {sanduiche}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sanduiche-custom" className="text-sm">
                    Adicionar sanduíche customizado
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="sanduiche-custom"
                      placeholder="Nome do sanduíche"
                      value={sanduicheCustom}
                      onChange={(e) => setSanduicheCustom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddSanduicheCustom()
                        }
                      }}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddSanduicheCustom}
                      disabled={isLoading || !sanduicheCustom.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Salgados */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-white">Salgados *</Label>
                <div className="border border-zinc-700 rounded-md p-4 bg-zinc-900">
                  <div className="grid grid-cols-2 gap-4">
                    {SALGADOS_OPTIONS.map((salgado) => (
                      <div key={salgado} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`salgado-${salgado}`}
                          checked={salgados.includes(salgado)}
                          onChange={() => handleSalgadoToggle(salgado)}
                          disabled={isLoading}
                          className="h-4 w-4 rounded border-zinc-600 text-yellow-400 focus:ring-yellow-400 bg-zinc-800"
                        />
                        <label
                          htmlFor={`salgado-${salgado}`}
                          className="text-sm text-white cursor-pointer flex-1"
                        >
                          {salgado}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salgado-custom" className="text-sm">
                    Adicionar salgado customizado
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="salgado-custom"
                      placeholder="Nome do salgado"
                      value={salgadoCustom}
                      onChange={(e) => setSalgadoCustom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddSalgadoCustom()
                        }
                      }}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddSalgadoCustom}
                      disabled={isLoading || !salgadoCustom.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Doces */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-white">Doces *</Label>
                <div className="border border-zinc-700 rounded-md p-4 bg-zinc-900">
                  <div className="grid grid-cols-2 gap-4">
                    {DOCES_OPTIONS.map((doce) => (
                      <div key={doce} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`doce-${doce}`}
                          checked={doces.includes(doce)}
                          onChange={() => handleDoceToggle(doce)}
                          disabled={isLoading}
                          className="h-4 w-4 rounded border-zinc-600 text-yellow-400 focus:ring-yellow-400 bg-zinc-800"
                        />
                        <label
                          htmlFor={`doce-${doce}`}
                          className="text-sm text-white cursor-pointer flex-1"
                        >
                          {doce}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doce-custom" className="text-sm">
                    Adicionar doce customizado
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="doce-custom"
                      placeholder="Nome do doce"
                      value={doceCustom}
                      onChange={(e) => setDoceCustom(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddDoceCustom()
                        }
                      }}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddDoceCustom}
                      disabled={isLoading || !doceCustom.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bebidas */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-white">Bebidas *</Label>
                <div className="border border-zinc-700 rounded-md p-4 bg-zinc-900">
                  <div className="grid grid-cols-2 gap-4">
                    {BEBIDAS_OPTIONS.map((bebida) => {
                      const bebidaSelecionada = bebidas.find((b) => b.nome === bebida)
                      return (
                        <div key={bebida} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`bebida-${bebida}`}
                            checked={!!bebidaSelecionada}
                            onChange={() => handleBebidaToggle(bebida)}
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-zinc-600 text-yellow-400 focus:ring-yellow-400 bg-zinc-800"
                          />
                          <label
                            htmlFor={`bebida-${bebida}`}
                            className="text-sm text-white cursor-pointer flex-1"
                          >
                            {bebida}
                          </label>
                          {bebidaSelecionada && (
                            <Input
                              type="number"
                              min="1"
                              value={bebidaSelecionada.quantidade}
                              onChange={(e) => handleBebidaQuantidadeChange(bebida, e.target.value)}
                              className="w-20 h-8"
                              disabled={isLoading}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bebida-custom" className="text-sm">
                    Adicionar bebida customizada
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="bebida-custom"
                      placeholder="Nome da bebida"
                      value={bebidaCustom}
                      onChange={(e) => setBebidaCustom(e.target.value)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Qtd"
                      type="number"
                      min="1"
                      value={bebidaQuantidade}
                      onChange={(e) => setBebidaQuantidade(e.target.value)}
                      disabled={isLoading}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddBebidaCustom}
                      disabled={isLoading || !bebidaCustom.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {bebidas.filter((b) => !BEBIDAS_OPTIONS.includes(b.nome)).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Bebidas customizadas:</Label>
                    <div className="space-y-2">
                      {bebidas
                        .filter((b) => !BEBIDAS_OPTIONS.includes(b.nome))
                        .map((bebida, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-md"
                          >
                            <span className="text-sm text-white flex-1">{bebida.nome}</span>
                            <Input
                              type="number"
                              min="1"
                              value={bebida.quantidade}
                              onChange={(e) => handleBebidaQuantidadeChange(bebida.nome, e.target.value)}
                              className="w-20 h-8"
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newBebidas = bebidas.filter((b) => b.nome !== bebida.nome)
                                setBebidas(newBebidas)
                              }}
                              className="h-5 w-5 text-red-500 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-2">
                <Label htmlFor="informacoesAdicionais" className="text-sm font-medium">
                  Informações Adicionais (opcional)
                </Label>
                <Textarea
                  id="informacoesAdicionais"
                  placeholder="Adicione qualquer informação adicional sobre o evento"
                  value={informacoesAdicionais}
                  onChange={(e) => setInformacoesAdicionais(e.target.value)}
                  className="min-h-[100px] w-full"
                  disabled={isLoading}
                />
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex justify-end gap-4">
            <Link href="/dashboard/cardapios">
              <Button variant="outline" className="border-zinc-700 text-white" disabled={isLoading}>
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
                  Atualizando...
                </>
              ) : (
                "Atualizar Cardápio"
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

