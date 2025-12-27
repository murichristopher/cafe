"use client"

import { useState, useEffect } from "react"
import { Download, Calendar, Clock, Users, Search, FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Cardapio } from "@/types"
import Link from "next/link"

export default function CardapiosPage() {
  const [cardapios, setCardapios] = useState<Cardapio[]>([])
  const [filteredCardapios, setFilteredCardapios] = useState<Cardapio[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCardapios()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = cardapios.filter((cardapio) => {
        const searchLower = searchTerm.toLowerCase()
        const dataStr = format(new Date(cardapio.data), "dd/MM/yyyy", { locale: ptBR })
        return (
          dataStr.includes(searchLower) ||
          cardapio.salgados.some((s) => s.toLowerCase().includes(searchLower)) ||
          cardapio.doces.some((d) => d.toLowerCase().includes(searchLower)) ||
          Object.keys(cardapio.bebidas).some((b) => b.toLowerCase().includes(searchLower))
        )
      })
      setFilteredCardapios(filtered)
    } else {
      setFilteredCardapios(cardapios)
    }
  }, [searchTerm, cardapios])

  const fetchCardapios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("cardapios")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar cardápios:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os cardápios",
          variant: "destructive",
        })
        return
      }

      setCardapios(data as Cardapio[])
      setFilteredCardapios(data as Cardapio[])
    } catch (error) {
      console.error("Erro ao buscar cardápios:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar cardápios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

  const generatePDF = async (cardapio: Cardapio) => {
    // Importar jsPDF dinamicamente
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
    const contentWidth = pageWidth - margin * 2
    const columnGap = 10

    // Paleta de cores expandida
    const darkGreen = [13, 51, 44] // #0d332c
    const gold = [210, 180, 120] // #d2b478
    const lightGold = [230, 200, 140] // #e6c88c
    const white = [255, 255, 255]
    const darkGold = [180, 150, 90] // #b4965a
    const lightGreen = [20, 70, 60] // #14463c

    // Função para adicionar padrão decorativo
    const addDecorativePattern = (x: number, y: number, width: number, height: number) => {
      doc.setDrawColor(gold[0], gold[1], gold[2])
      doc.setLineWidth(0.3)
      // Linhas diagonais sutis
      for (let i = 0; i < width; i += 5) {
        doc.line(x + i, y, x + i + 2, y + height)
      }
    }

    // Função para adicionar sombra sutil
    const addShadow = (x: number, y: number, width: number, height: number) => {
      doc.setFillColor(5, 5, 5) // Cinza muito escuro para simular sombra
      doc.rect(x + 1, y + 1, width, height, "F")
    }

    // Função para criar card com borda decorativa (sem sombra)
    const createCard = (x: number, y: number, width: number, height: number, fillColor: number[], borderColor: number[]) => {
      // Card principal
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
      doc.setLineWidth(0.5)
      doc.rect(x, y, width, height, "FD")
      // Borda interna dourada
      doc.setDrawColor(gold[0], gold[1], gold[2])
      doc.setLineWidth(0.3)
      doc.rect(x + 1, y + 1, width - 2, height - 2, "D")
    }

    // Função auxiliar para adicionar fundo em nova página
    const addPageBackground = () => {
      doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2])
      doc.rect(0, 0, pageWidth, pageHeight, "F")
      // Padrão decorativo sutil no fundo
      doc.setFillColor(lightGreen[0] + 10, lightGreen[1] + 10, lightGreen[2] + 10) // Mais claro para simular transparência
      for (let i = 0; i < pageHeight; i += 20) {
        doc.circle(pageWidth / 2, i, 30, "F")
      }
    }

    // Fundo verde escuro
    addPageBackground()

    // Logo e informações do evento - alinhados na mesma altura, sem molduras
    const topSectionY = margin - 5 // Logo um pouco mais para cima
    let logoHeight = 0
    
    // Logo (canto superior esquerdo) - sem moldura
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
                doc.addImage(img, "PNG", margin, topSectionY, logoWidth, logoHeight)
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
      } else {
        // Se não tiver logo, apenas texto
        doc.setTextColor(gold[0], gold[1], gold[2])
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("ELEVE", margin, topSectionY + 8)
        doc.setFontSize(10)
        doc.text("CAFÉ", margin, topSectionY + 16)
        logoHeight = 20
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error)
      doc.setTextColor(gold[0], gold[1], gold[2])
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("ELEVE", margin, topSectionY + 8)
      doc.setFontSize(10)
      doc.text("CAFÉ", margin, topSectionY + 16)
      logoHeight = 20
    }

    // Informações do evento (canto superior direito) - sem moldura, alinhado com logo
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const eventInfoY = topSectionY + (logoHeight > 0 ? logoHeight / 2 - 6 : 5)
    const eventInfoX = pageWidth - margin
    const lineSpacing = 5.5
    
    doc.text(`Data: ${formatDate(cardapio.data)}`, eventInfoX, eventInfoY, { align: "right" })
    doc.text(
      `Horário: ${formatTime(cardapio.horario_inicio)} às ${formatTime(cardapio.horario_fim)}`,
      eventInfoX,
      eventInfoY + lineSpacing,
      { align: "right" }
    )
    doc.text(
      `${cardapio.quantidade_participantes} participantes`,
      eventInfoX,
      eventInfoY + lineSpacing * 2,
      { align: "right" }
    )

    // Título COQUETEL - alinhado após logo e info
    const titleY = Math.max(topSectionY + logoHeight + 15, topSectionY + 40)
    const titleWidth = 75
    const titleHeight = 18
    const titleX = (pageWidth - titleWidth) / 2
    
    // Borda externa dourada
    doc.setFillColor(darkGold[0], darkGold[1], darkGold[2])
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(1.2)
    doc.rect(titleX, titleY, titleWidth, titleHeight, "FD")
    
    // Borda interna
    doc.setDrawColor(lightGold[0], lightGold[1], lightGold[2])
    doc.setLineWidth(0.4)
    doc.rect(titleX + 2, titleY + 2, titleWidth - 4, titleHeight - 4, "D")
    
    // Fundo gradiente simulado (camadas)
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.rect(titleX + 3, titleY + 3, titleWidth - 6, titleHeight - 6, "F")
    
    // Texto principal
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(21)
    doc.setFont("helvetica", "bold")
    doc.text("COQUETEL", pageWidth / 2, titleY + titleHeight / 2 + 4, { align: "center" })
    
    // Decoração nas laterais
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.circle(titleX - 7, titleY + titleHeight / 2, 2.5, "F")
    doc.circle(titleX + titleWidth + 7, titleY + titleHeight / 2, 2.5, "F")

    // Linha vertical dourada decorativa
    const lineX = pageWidth / 2
    const lineStartY = titleY + titleHeight + 12
    const lineEndY = pageHeight - margin - 40
    
    // Linha principal
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(1.5)
    doc.line(lineX, lineStartY, lineX, lineEndY)
    
    // Linhas decorativas laterais
    doc.setDrawColor(lightGold[0], lightGold[1], lightGold[2])
    doc.setLineWidth(0.5)
    doc.line(lineX - 2, lineStartY, lineX - 2, lineEndY)
    doc.line(lineX + 2, lineStartY, lineX + 2, lineEndY)

    // Ícone de café decorativo na linha
    const coffeeIconY = lineStartY + (lineEndY - lineStartY) / 2
    // Círculo externo
    doc.setFillColor(darkGold[0], darkGold[1], darkGold[2])
    doc.circle(lineX, coffeeIconY, 5, "F")
    // Círculo interno
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.circle(lineX, coffeeIconY, 3.5, "F")
    // Círculo central
    doc.setFillColor(lightGold[0], lightGold[1], lightGold[2])
    doc.circle(lineX, coffeeIconY, 2, "F")
    
    // Decorações nas extremidades da linha
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.circle(lineX, lineStartY, 2, "F")
    doc.circle(lineX, lineEndY, 2, "F")

    // Colunas - perfeitamente alinhadas
    const leftColumnX = margin
    const rightColumnX = pageWidth / 2 + columnGap / 2
    const columnWidth = (pageWidth - margin * 2 - columnGap) / 2
    const sectionSpacing = 16 // Espaço entre título e itens
    const itemSpacing = 5.5 // Espaço entre itens
    const sectionTitleHeight = 9 // Altura do título da seção
    const startY = titleY + titleHeight + 18 // Posição inicial alinhada

    // Coluna esquerda - Salgados
    let leftY = startY

    // Card para título Salgados
    const salgadosCardHeight = sectionTitleHeight + 2
    createCard(leftColumnX, leftY, columnWidth, salgadosCardHeight, gold, darkGold)
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    // Ícone decorativo
    doc.setFillColor(white[0], white[1], white[2])
    doc.circle(leftColumnX + 4, leftY + 5, 1.5, "F")
    doc.text("Salgados", leftColumnX + 8, leftY + 6.5)

    leftY += sectionSpacing
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(10.5)
    doc.setFont("helvetica", "normal")
    cardapio.salgados.forEach((salgado) => {
      if (leftY > pageHeight - margin - 35) {
        doc.addPage()
        addPageBackground()
        leftY = margin + 20
      }
      // Bullet decorativo
      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.circle(leftColumnX + 4, leftY - 1.5, 1.2, "F")
      // Quebrar linha se o texto for muito longo
      const maxWidth = columnWidth - 12 // Largura disponível (coluna - margem - espaço do bullet)
      const lines = doc.splitTextToSize(salgado, maxWidth)
      doc.text(lines, leftColumnX + 8, leftY)
      leftY += itemSpacing * lines.length // Ajustar espaçamento baseado no número de linhas
    })

    // Coluna direita - Doces e Bebidas
    let rightY = startY

    // Card para título Doces
    const docesCardHeight = sectionTitleHeight + 2
    createCard(rightColumnX, rightY, columnWidth, docesCardHeight, gold, darkGold)
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    // Ícone decorativo
    doc.setFillColor(white[0], white[1], white[2])
    doc.circle(rightColumnX + 4, rightY + 5, 1.5, "F")
    doc.text("Doces", rightColumnX + 8, rightY + 6.5)

    rightY += sectionSpacing
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(10.5)
    doc.setFont("helvetica", "normal")
    cardapio.doces.forEach((doce) => {
      if (rightY > pageHeight - margin - 55) {
        doc.addPage()
        addPageBackground()
        rightY = margin + 20
      }
      // Bullet decorativo
      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.circle(rightColumnX + 4, rightY - 1.5, 1.2, "F")
      // Quebrar linha se o texto for muito longo
      const maxWidth = columnWidth - 12 // Largura disponível (coluna - margem - espaço do bullet)
      const lines = doc.splitTextToSize(doce, maxWidth)
      doc.text(lines, rightColumnX + 8, rightY)
      rightY += itemSpacing * lines.length // Ajustar espaçamento baseado no número de linhas
    })

    // Card para título Bebidas
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
    // Ícone decorativo
    doc.setFillColor(white[0], white[1], white[2])
    doc.circle(rightColumnX + 4, rightY + 5, 1.5, "F")
    doc.text("Bebidas", rightColumnX + 8, rightY + 6.5)

    rightY += sectionSpacing
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(10.5)
    doc.setFont("helvetica", "normal")
    Object.entries(cardapio.bebidas).forEach(([bebida, quantidade]) => {
      if (rightY > pageHeight - margin - 35) {
        doc.addPage()
        addPageBackground()
        rightY = margin + 20
      }
      // Bullet decorativo
      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.circle(rightColumnX + 4, rightY - 1.5, 1.2, "F")
      let texto = bebida
      if (bebida === "Cerveja") {
        texto = `${quantidade} unidades de cerveja Heineken`
      } else if (bebida === "Espumante") {
        texto = `${quantidade} garrafas de espumante`
      } else if (quantidade > 1) {
        texto = `${quantidade} ${bebida}`
      }
      // Quebrar linha se o texto for muito longo
      const maxWidth = columnWidth - 12 // Largura disponível (coluna - margem - espaço do bullet)
      const lines = doc.splitTextToSize(texto, maxWidth)
      doc.text(lines, rightColumnX + 8, rightY)
      rightY += itemSpacing * lines.length // Ajustar espaçamento baseado no número de linhas
    })

    // Calcular altura máxima das colunas
    const leftColumnEndY = titleY + titleHeight + 18 + sectionSpacing + (cardapio.salgados.length * itemSpacing)
    const rightColumnEndY = titleY + titleHeight + 18 + sectionSpacing + (cardapio.doces.length * itemSpacing) + 3 + sectionSpacing + (Object.keys(cardapio.bebidas).length * itemSpacing)
    const maxContentY = Math.max(leftColumnEndY, rightColumnEndY)

    // Informações adicionais
    const spaceForFooter = 30
    const availableSpace = pageHeight - maxContentY - spaceForFooter
    const hasAdditionalInfo = cardapio.informacoes_adicionais?.trim()

    if (hasAdditionalInfo && cardapio.informacoes_adicionais) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const lines = doc.splitTextToSize(cardapio.informacoes_adicionais, contentWidth - 10)
      const textHeight = lines.length * 5 + 25

      const startY = maxContentY + 12

      if (textHeight <= availableSpace && startY < pageHeight - spaceForFooter - textHeight) {
        // Cabe na primeira página - com card decorativo
        createCard(margin, startY, contentWidth, sectionTitleHeight + 2, gold, darkGold)
        doc.setTextColor(white[0], white[1], white[2])
        doc.setFontSize(13)
        doc.setFont("helvetica", "bold")
        doc.setFillColor(white[0], white[1], white[2])
        doc.circle(margin + 5, startY + 5, 1.5, "F")
        doc.text("Informações Adicionais", margin + 9, startY + 7)
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(lines, margin + 6, startY + 20)
      } else {
        // Nova página com card decorativo
        doc.addPage()
        addPageBackground()
        createCard(margin, margin, contentWidth, sectionTitleHeight + 2, gold, darkGold)
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

    // Rodapé decorativo com card
    const footerY = pageHeight - margin - 15
    const footerCardHeight = 28
    createCard(margin, footerY, contentWidth, footerCardHeight, lightGreen, gold)
    
    // Linha decorativa acima do rodapé
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(0.8)
    doc.line(margin + 10, footerY, pageWidth - margin - 10, footerY)
    
    // Ícone de café decorativo
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
    
    // Decorações nas laterais do rodapé
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.circle(margin + 5, footerY + footerCardHeight / 2, 2, "F")
    doc.circle(pageWidth - margin - 5, footerY + footerCardHeight / 2, 2, "F")

    // Salvar PDF
    const fileName = `cardapio-${cardapio.data || "evento"}.pdf`
    doc.save(fileName)

    toast({
      title: "PDF gerado",
      description: `Cardápio salvo como ${fileName}`,
    })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cardápios</h1>
          <p className="text-muted-foreground">Visualize e gerencie os cardápios recebidos</p>
        </div>
        <Button asChild className="bg-amber-500 hover:bg-amber-600">
          <Link href="/dashboard/cardapios/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Cardápio
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cardápios</CardTitle>
          <CardDescription>
            Cardápios recebidos via webhook do site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por data, salgados, doces ou bebidas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredCardapios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cardápio encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Salgados</TableHead>
                  <TableHead>Doces</TableHead>
                  <TableHead>Bebidas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCardapios.map((cardapio) => (
                  <TableRow key={cardapio.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(cardapio.data), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {cardapio.horario_inicio} - {cardapio.horario_fim}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {cardapio.quantidade_participantes}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cardapio.salgados.slice(0, 2).map((salgado, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {salgado}
                          </Badge>
                        ))}
                        {cardapio.salgados.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{cardapio.salgados.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cardapio.doces.slice(0, 2).map((doce, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {doce}
                          </Badge>
                        ))}
                        {cardapio.doces.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{cardapio.doces.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(cardapio.bebidas)
                          .slice(0, 2)
                          .map(([bebida, qtd], idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {qtd} {bebida}
                            </Badge>
                          ))}
                        {Object.keys(cardapio.bebidas).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{Object.keys(cardapio.bebidas).length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePDF(cardapio)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

