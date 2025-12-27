"use client"

import type React from "react"
import { useState } from "react"
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

export default function NewCardapioPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Form data
  const [data, setData] = useState("")
  const [horarioInicio, setHorarioInicio] = useState("")
  const [horarioFim, setHorarioFim] = useState("")
  const [quantidadeParticipantes, setQuantidadeParticipantes] = useState("")
  const [salgados, setSalgados] = useState<string[]>([])
  const [salgadoCustom, setSalgadoCustom] = useState("")
  const [doces, setDoces] = useState<string[]>([])
  const [doceCustom, setDoceCustom] = useState("")
  const [bebidas, setBebidas] = useState<Array<{ nome: string; quantidade: string }>>([])
  const [bebidaCustom, setBebidaCustom] = useState("")
  const [bebidaQuantidade, setBebidaQuantidade] = useState("")
  const [informacoesAdicionais, setInformacoesAdicionais] = useState("")

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

      const payload = {
        data,
        horarioInicio,
        horarioFim,
        quantidadeParticipantes: parseInt(quantidadeParticipantes),
        salgados,
        doces,
        bebidas: bebidasObj,
        informacoesAdicionais: informacoesAdicionais.trim() || null,
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

      // Gerar PDF e redirecionar
      // Vamos criar o PDF usando a função de geração
      const cardapioData = {
        id: responseData.id,
        data,
        horario_inicio: horarioInicio,
        horario_fim: horarioFim,
        quantidade_participantes: parseInt(quantidadeParticipantes),
        salgados,
        doces,
        bebidas: bebidasObj,
        informacoes_adicionais: informacoesAdicionais.trim() || null,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Importar e gerar PDF
      const jsPDFModule = await import("jspdf")
      const jsPDF = jsPDFModule.default

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      const columnGap = 10

      const darkGreen = [13, 51, 44]
      const gold = [210, 180, 120]
      const lightGold = [230, 200, 140]
      const white = [255, 255, 255]
      const darkGold = [180, 150, 90]
      const lightGreen = [20, 70, 60]

      const addPageBackground = () => {
        doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2])
        doc.rect(0, 0, pageWidth, pageHeight, "F")
      }

      const createCard = (x: number, y: number, width: number, height: number, fillColor: number[], borderColor: number[]) => {
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
        doc.setLineWidth(0.5)
        doc.rect(x, y, width, height, "FD")
        doc.setDrawColor(gold[0], gold[1], gold[2])
        doc.setLineWidth(0.3)
        doc.rect(x + 1, y + 1, width - 2, height - 2, "D")
      }

      addPageBackground()

      // Logo
      let logoHeight = 0
      try {
        const logoResponse = await fetch("/logo-gold.png")
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob()
          const logoUrl = URL.createObjectURL(logoBlob)
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.src = logoUrl

          await new Promise<void>((resolve) => {
            let resolved = false
            const timeout = setTimeout(() => {
              if (!resolved) {
                resolved = true
                URL.revokeObjectURL(logoUrl)
                resolve()
              }
            }, 2000)

            img.onload = () => {
              if (!resolved) {
                clearTimeout(timeout)
                resolved = true
                try {
                  const logoWidth = 35
                  logoHeight = (img.height / img.width) * logoWidth
                  doc.addImage(img, "PNG", margin, margin - 5, logoWidth, logoHeight)
                  URL.revokeObjectURL(logoUrl)
                  resolve()
                } catch (err) {
                  URL.revokeObjectURL(logoUrl)
                  resolve()
                }
              }
            }
            img.onerror = () => {
              if (!resolved) {
                clearTimeout(timeout)
                resolved = true
                URL.revokeObjectURL(logoUrl)
                resolve()
              }
            }
          })
        }
      } catch (error) {
        console.error("Erro ao carregar logo:", error)
      }

      // Informações do evento
      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const eventInfoY = margin - 5 + (logoHeight > 0 ? logoHeight / 2 - 6 : 5)
      const eventInfoX = pageWidth - margin
      const lineSpacing = 5.5

      const formatDate = (dateString: string) => {
        if (!dateString) return ""
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, "0")
        const month = String(date.getMonth() + 1).padStart(2, "0")
        return `${day}/${month}`
      }

      const formatTime = (timeString: string) => {
        if (!timeString) return ""
        const [hours, minutes] = timeString.split(":")
        return `${hours}:${minutes}`
      }

      doc.text(`Data: ${formatDate(data)}`, eventInfoX, eventInfoY, { align: "right" })
      doc.text(
        `Horário: ${formatTime(horarioInicio)} às ${formatTime(horarioFim)}`,
        eventInfoX,
        eventInfoY + lineSpacing,
        { align: "right" }
      )
      doc.text(`${quantidadeParticipantes} participantes`, eventInfoX, eventInfoY + lineSpacing * 2, { align: "right" })

      // Título COQUETEL
      const titleY = Math.max(margin - 5 + logoHeight + 12, margin - 5 + 40)
      const titleWidth = 75
      const titleHeight = 18
      const titleX = (pageWidth - titleWidth) / 2

      doc.setFillColor(darkGold[0], darkGold[1], darkGold[2])
      doc.setDrawColor(gold[0], gold[1], gold[2])
      doc.setLineWidth(1.2)
      doc.rect(titleX, titleY, titleWidth, titleHeight, "FD")

      doc.setDrawColor(lightGold[0], lightGold[1], lightGold[2])
      doc.setLineWidth(0.4)
      doc.rect(titleX + 2, titleY + 2, titleWidth - 4, titleHeight - 4, "D")

      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.rect(titleX + 3, titleY + 3, titleWidth - 6, titleHeight - 6, "F")

      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(21)
      doc.setFont("helvetica", "bold")
      doc.text("COQUETEL", pageWidth / 2, titleY + titleHeight / 2 + 4, { align: "center" })

      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.circle(titleX - 7, titleY + titleHeight / 2, 2.5, "F")
      doc.circle(titleX + titleWidth + 7, titleY + titleHeight / 2, 2.5, "F")

      // Linha vertical
      const lineX = pageWidth / 2
      const lineStartY = titleY + titleHeight + 12
      const lineEndY = pageHeight - margin - 40

      doc.setDrawColor(gold[0], gold[1], gold[2])
      doc.setLineWidth(1.5)
      doc.line(lineX, lineStartY, lineX, lineEndY)

      doc.setDrawColor(lightGold[0], lightGold[1], lightGold[2])
      doc.setLineWidth(0.5)
      doc.line(lineX - 2, lineStartY, lineX - 2, lineEndY)
      doc.line(lineX + 2, lineStartY, lineX + 2, lineEndY)

      const coffeeIconY = lineStartY + (lineEndY - lineStartY) / 2
      doc.setFillColor(darkGold[0], darkGold[1], darkGold[2])
      doc.circle(lineX, coffeeIconY, 5, "F")
      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.circle(lineX, coffeeIconY, 3.5, "F")
      doc.setFillColor(lightGold[0], lightGold[1], lightGold[2])
      doc.circle(lineX, coffeeIconY, 2, "F")

      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.circle(lineX, lineStartY, 2, "F")
      doc.circle(lineX, lineEndY, 2, "F")

      // Colunas
      const leftColumnX = margin
      const rightColumnX = pageWidth / 2 + columnGap / 2
      const columnWidth = (pageWidth - margin * 2 - columnGap) / 2
      const sectionSpacing = 16
      const itemSpacing = 5.5
      const sectionTitleHeight = 9
      const startY = titleY + titleHeight + 18

      // Salgados
      let leftY = startY
      const salgadosCardHeight = sectionTitleHeight + 2
      createCard(leftColumnX, leftY, columnWidth, salgadosCardHeight, gold, darkGold)
      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.setFillColor(white[0], white[1], white[2])
      doc.circle(leftColumnX + 4, leftY + 5, 1.5, "F")
      doc.text("Salgados", leftColumnX + 8, leftY + 6.5)

      leftY += sectionSpacing
      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(10.5)
      doc.setFont("helvetica", "normal")
      salgados.forEach((salgado) => {
        if (leftY > pageHeight - margin - 35) {
          doc.addPage()
          addPageBackground()
          leftY = margin + 20
        }
        doc.setFillColor(gold[0], gold[1], gold[2])
        doc.circle(leftColumnX + 4, leftY - 1.5, 1.2, "F")
        // Quebrar linha se o texto for muito longo
        const maxWidth = columnWidth - 12 // Largura disponível (coluna - margem - espaço do bullet)
        const lines = doc.splitTextToSize(salgado, maxWidth)
        doc.text(lines, leftColumnX + 8, leftY)
        leftY += itemSpacing * lines.length // Ajustar espaçamento baseado no número de linhas
      })

      // Doces
      let rightY = startY
      const docesCardHeight = sectionTitleHeight + 2
      createCard(rightColumnX, rightY, columnWidth, docesCardHeight, gold, darkGold)
      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.setFillColor(white[0], white[1], white[2])
      doc.circle(rightColumnX + 4, rightY + 5, 1.5, "F")
      doc.text("Doces", rightColumnX + 8, rightY + 6.5)

      rightY += sectionSpacing
      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(10.5)
      doc.setFont("helvetica", "normal")
      doces.forEach((doce) => {
        if (rightY > pageHeight - margin - 55) {
          doc.addPage()
          addPageBackground()
          rightY = margin + 20
        }
        doc.setFillColor(gold[0], gold[1], gold[2])
        doc.circle(rightColumnX + 4, rightY - 1.5, 1.2, "F")
        // Quebrar linha se o texto for muito longo
        const maxWidth = columnWidth - 12 // Largura disponível (coluna - margem - espaço do bullet)
        const lines = doc.splitTextToSize(doce, maxWidth)
        doc.text(lines, rightColumnX + 8, rightY)
        rightY += itemSpacing * lines.length // Ajustar espaçamento baseado no número de linhas
      })

      // Bebidas
      rightY += 4
      if (rightY > pageHeight - margin - 55) {
        doc.addPage()
        addPageBackground()
        rightY = margin + 20
      }
      const bebidasCardHeight = sectionTitleHeight + 2
      createCard(rightColumnX, rightY, columnWidth, bebidasCardHeight, gold, darkGold)
      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.setFillColor(white[0], white[1], white[2])
      doc.circle(rightColumnX + 4, rightY + 5, 1.5, "F")
      doc.text("Bebidas", rightColumnX + 8, rightY + 6.5)

      rightY += sectionSpacing
      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(10.5)
      doc.setFont("helvetica", "normal")
      bebidas.forEach((bebida) => {
        if (rightY > pageHeight - margin - 35) {
          doc.addPage()
          addPageBackground()
          rightY = margin + 20
        }
        doc.setFillColor(gold[0], gold[1], gold[2])
        doc.circle(rightColumnX + 4, rightY - 1.5, 1.2, "F")
        let texto = bebida.nome
        if (bebida.nome === "Cerveja") {
          texto = `${bebida.quantidade} unidades de cerveja Heineken`
        } else if (bebida.nome === "Espumante") {
          texto = `${bebida.quantidade} garrafas de espumante`
        } else if (parseInt(bebida.quantidade) > 1) {
          texto = `${bebida.quantidade} ${bebida.nome}`
        }
        // Quebrar linha se o texto for muito longo
        const maxWidth = columnWidth - 12 // Largura disponível (coluna - margem - espaço do bullet)
        const lines = doc.splitTextToSize(texto, maxWidth)
        doc.text(lines, rightColumnX + 8, rightY)
        rightY += itemSpacing * lines.length // Ajustar espaçamento baseado no número de linhas
      })

      // Informações adicionais
      if (informacoesAdicionais.trim()) {
        const leftColumnEndY = startY + sectionSpacing + (salgados.length * itemSpacing)
        const rightColumnEndY = startY + sectionSpacing + (doces.length * itemSpacing) + 4 + sectionSpacing + (bebidas.length * itemSpacing)
        const maxContentY = Math.max(leftColumnEndY, rightColumnEndY)
        const spaceForFooter = 30
        const availableSpace = pageHeight - maxContentY - spaceForFooter

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        const lines = doc.splitTextToSize(informacoesAdicionais, pageWidth - margin * 2 - 10)
        const textHeight = lines.length * 5 + 25
        const startInfoY = maxContentY + 12

        if (textHeight <= availableSpace && startInfoY < pageHeight - spaceForFooter - textHeight) {
          createCard(margin, startInfoY, pageWidth - margin * 2, sectionTitleHeight + 2, gold, darkGold)
          doc.setTextColor(white[0], white[1], white[2])
          doc.setFontSize(13)
          doc.setFont("helvetica", "bold")
          doc.setFillColor(white[0], white[1], white[2])
          doc.circle(margin + 5, startInfoY + 5, 1.5, "F")
          doc.text("Informações Adicionais", margin + 9, startInfoY + 7)
          doc.setFontSize(10)
          doc.setFont("helvetica", "normal")
          doc.text(lines, margin + 6, startInfoY + 20)
        } else {
          doc.addPage()
          addPageBackground()
          createCard(margin, margin, pageWidth - margin * 2, sectionTitleHeight + 2, gold, darkGold)
          doc.setTextColor(white[0], white[1], white[2])
          doc.setFontSize(15)
          doc.setFont("helvetica", "bold")
          doc.setFillColor(white[0], white[1], white[2])
          doc.circle(margin + 5, margin + 5, 1.5, "F")
          doc.text("Informações Adicionais", margin + 9, margin + 7)
          doc.setFontSize(10.5)
          doc.setFont("helvetica", "normal")
          doc.text(lines, margin + 6, margin + 22)
        }
      }

      // Rodapé
      const footerY = pageHeight - margin - 15
      const footerCardHeight = 28
      createCard(margin, footerY, pageWidth - margin * 2, footerCardHeight, lightGreen, gold)

      doc.setDrawColor(gold[0], gold[1], gold[2])
      doc.setLineWidth(0.8)
      doc.line(margin + 10, footerY, pageWidth - margin - 10, footerY)

      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.circle(margin + 8, footerY + 6, 3, "F")
      doc.setFillColor(lightGold[0], lightGold[1], lightGold[2])
      doc.circle(margin + 8, footerY + 6, 2, "F")

      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(9.5)
      doc.setFont("helvetica", "bold")
      doc.text("www.elevecafe.com.br", pageWidth / 2, footerY + 8, { align: "center" })
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text("WhatsApp: (21) 96591-3009", pageWidth / 2, footerY + 14, { align: "center" })
      doc.text("Instagram: @eleve.cafe", pageWidth / 2, footerY + 20, { align: "center" })

      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.circle(margin + 5, footerY + footerCardHeight / 2, 2, "F")
      doc.circle(pageWidth - margin - 5, footerY + footerCardHeight / 2, 2, "F")

      // Salvar PDF
      const fileName = `cardapio-${data || "evento"}.pdf`
      doc.save(fileName)

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


