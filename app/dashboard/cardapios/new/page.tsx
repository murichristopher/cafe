"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useCardapioForm } from "@/hooks/use-cardapio-form"
import { generateCardapioPDF } from "@/lib/cardapio/pdf-generator"
import { SALGADOS_OPTIONS, DOCES_OPTIONS, SANDUICHES_OPTIONS } from "@/lib/cardapio/constants"
import { EventInfoSection } from "@/components/cardapio/event-info-section"
import { ItemsSection } from "@/components/cardapio/items-section"
import { BebidasSection } from "@/components/cardapio/bebidas-section"

export default function NewCardapioPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    formState,
    updateField,
    handleSanduicheToggle,
    handleAddSanduicheCustom,
    handleSalgadoToggle,
    handleAddSalgadoCustom,
    handleDoceToggle,
    handleAddDoceCustom,
    handleBebidaToggle,
    handleBebidaQuantidadeChange,
    handleAddBebidaCustom,
  } = useCardapioForm()

  const validateForm = (): boolean => {
    if (!formState.data || !formState.horarioInicio || !formState.horarioFim || !formState.quantidadeParticipantes) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return false
    }

    if (formState.salgados.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos um salgado",
        variant: "destructive",
      })
      return false
    }

    if (formState.doces.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos um doce",
        variant: "destructive",
      })
      return false
    }

    if (formState.bebidas.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos uma bebida",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Converter bebidas para objeto
      const bebidasObj: Record<string, number> = {}
      formState.bebidas.forEach((bebida) => {
        bebidasObj[bebida.nome] = parseInt(bebida.quantidade) || 1
      })

      const payload = {
        data: formState.data,
        horarioInicio: formState.horarioInicio,
        horarioFim: formState.horarioFim,
        quantidadeParticipantes: parseInt(formState.quantidadeParticipantes),
        nomeCliente: formState.nomeCliente.trim() || null,
        local: formState.local.trim() || null,
        titulo: formState.titulo.trim() || "COQUETEL",
        investimento: formState.investimento ? parseFloat(formState.investimento) : null,
        sanduiches: formState.sanduiches,
        salgados: formState.salgados,
        doces: formState.doces,
        bebidas: bebidasObj,
        informacoesAdicionais: formState.informacoesAdicionais.trim() || null,
        timestamp: new Date().toISOString(),
      }

      const response = await fetch("/api/webhook/cardapio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Falha ao criar cardápio")
      }

      toast({
        title: "Cardápio criado com sucesso",
        description: "Redirecionando para download do PDF...",
      })

      // Gerar PDF usando a função modularizada
      await generateCardapioPDF({
        data: formState.data,
        horarioInicio: formState.horarioInicio,
        horarioFim: formState.horarioFim,
        quantidadeParticipantes: formState.quantidadeParticipantes,
        nomeCliente: formState.nomeCliente,
        local: formState.local,
        titulo: formState.titulo,
        investimento: formState.investimento,
        sanduiches: formState.sanduiches,
        salgados: formState.salgados,
        doces: formState.doces,
        bebidas: formState.bebidas,
        informacoesAdicionais: formState.informacoesAdicionais,
      })

      // Redirecionar para lista de cardápios
      router.push("/dashboard/cardapios")
    } catch (error: any) {
      console.error("Erro ao criar cardápio:", error)
      toast({
        title: "Erro ao criar cardápio",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
            <CardTitle className="text-2xl text-white">Novo Cardápio</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações do Evento */}
              <EventInfoSection formState={formState} updateField={updateField} isLoading={isLoading} />

              {/* Sanduíches */}
              <ItemsSection
                title="Sanduíches"
                items={formState.sanduiches}
                options={SANDUICHES_OPTIONS}
                customValue={formState.sanduicheCustom}
                onToggle={handleSanduicheToggle}
                onAddCustom={handleAddSanduicheCustom}
                onCustomChange={(value) => updateField("sanduicheCustom", value)}
                isLoading={isLoading}
              />

              {/* Salgados */}
              <ItemsSection
                title="Salgados"
                items={formState.salgados}
                options={SALGADOS_OPTIONS}
                customValue={formState.salgadoCustom}
                onToggle={handleSalgadoToggle}
                onAddCustom={handleAddSalgadoCustom}
                onCustomChange={(value) => updateField("salgadoCustom", value)}
                isLoading={isLoading}
                required
              />

              {/* Doces */}
              <ItemsSection
                title="Doces"
                items={formState.doces}
                options={DOCES_OPTIONS}
                customValue={formState.doceCustom}
                onToggle={handleDoceToggle}
                onAddCustom={handleAddDoceCustom}
                onCustomChange={(value) => updateField("doceCustom", value)}
                isLoading={isLoading}
                required
              />

              {/* Bebidas */}
              <BebidasSection
                bebidas={formState.bebidas}
                bebidaCustom={formState.bebidaCustom}
                bebidaQuantidade={formState.bebidaQuantidade}
                onToggle={handleBebidaToggle}
                onQuantidadeChange={handleBebidaQuantidadeChange}
                onAddCustom={handleAddBebidaCustom}
                onCustomChange={(value) => updateField("bebidaCustom", value)}
                onQuantidadeInputChange={(value) => updateField("bebidaQuantidade", value)}
                onRemove={(nome) => {
                  const newBebidas = formState.bebidas.filter((b) => b.nome !== nome)
                  updateField("bebidas", newBebidas)
                }}
                isLoading={isLoading}
              />

              {/* Informações Adicionais */}
              <div className="space-y-2">
                <Label htmlFor="informacoesAdicionais" className="text-sm font-medium">
                  Informações Adicionais (opcional)
                </Label>
                <Textarea
                  id="informacoesAdicionais"
                  placeholder="Adicione qualquer informação adicional sobre o evento"
                  value={formState.informacoesAdicionais}
                  onChange={(e) => updateField("informacoesAdicionais", e.target.value)}
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
                  Criando...
                </>
              ) : (
                "Criar Cardápio"
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
