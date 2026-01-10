"use client"

import { useState, useEffect } from "react"
import { Download, Calendar, Clock, Users, Search, FileText, Plus, Edit } from "lucide-react"
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
        doc.setFontSize(16.8) // 14 * 1.2
        doc.setFont("helvetica", "bold")
        doc.text("ELEVE", margin, topSectionY + 8)
        doc.setFontSize(12) // 10 * 1.2
        doc.text("CAFÉ", margin, topSectionY + 16)
        logoHeight = 20
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error)
      doc.setTextColor(gold[0], gold[1], gold[2])
      doc.setFontSize(16.8) // 14 * 1.2
      doc.setFont("helvetica", "bold")
      doc.text("ELEVE", margin, topSectionY + 8)
      doc.setFontSize(12) // 10 * 1.2
      doc.text("CAFÉ", margin, topSectionY + 16)
      logoHeight = 20
    }

    // Informações do evento (canto superior direito) - sem moldura, alinhado com logo
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(12) // 10 * 1.2
    doc.setFont("helvetica", "normal")
    const eventInfoY = topSectionY + (logoHeight > 0 ? logoHeight / 2 - 6 : 5)
    const eventInfoX = pageWidth - margin
    const lineSpacing = 5.5
    
    doc.text(`Data: ${formatDate(cardapio.data)}`, eventInfoX, eventInfoY, { align: "right" })
    doc.text(
      `Hora: ${formatTime(cardapio.horario_inicio)}`,
      eventInfoX,
      eventInfoY + lineSpacing,
      { align: "right" }
    )
    doc.text(
      `Pax: ${cardapio.quantidade_participantes}`,
      eventInfoX,
      eventInfoY + lineSpacing * 2,
      { align: "right" }
    )
    let currentLine = 3
    if (cardapio.nome_cliente) {
      doc.text(`Cliente: ${cardapio.nome_cliente}`, eventInfoX, eventInfoY + lineSpacing * currentLine, { align: "right" })
      currentLine++
    }
    if (cardapio.local) {
      doc.text(`Local: ${cardapio.local}`, eventInfoX, eventInfoY + lineSpacing * currentLine, { align: "right" })
      currentLine++
    }

    // Título - alinhado após logo e info (sem background)
    const titleY = Math.max(topSectionY + logoHeight + 6, topSectionY + 30)
    const titleHeight = 18
    const titleText = cardapio.titulo || "COQUETEL"
    
    // Texto principal sem background
    doc.setTextColor(gold[0], gold[1], gold[2])
    doc.setFontSize(25.2) // 21 * 1.2
    doc.setFont("helvetica", "bold")
    doc.text(titleText, pageWidth / 2, titleY + titleHeight / 2 + 4, { align: "center" })

    // Linha vertical dourada decorativa (pontilhada)
    const lineX = pageWidth / 2
    const lineStartY = titleY + titleHeight + 8
    const lineEndY = pageHeight - margin - 40
    
    // Linha principal pontilhada
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(1.5)
    // Padrão de traço: [comprimento do traço, espaço entre traços]
    doc.setLineDashPattern([3, 3], 0)
    doc.line(lineX, lineStartY, lineX, lineEndY)
    
    // Resetar padrão de linha para sólida
    doc.setLineDashPattern([], 0)

    // Colunas - perfeitamente alinhadas
    const leftColumnX = margin
    const rightColumnX = pageWidth / 2 + columnGap / 2
    const columnWidth = (pageWidth - margin * 2 - columnGap) / 2
    const sectionSpacing = 16 // Espaço entre título e itens
    const itemSpacing = 5.5 // Espaço entre itens
    const sectionTitleHeight = 9 // Altura do título da seção
    const startY = titleY + titleHeight + 12 // Posição inicial alinhada

    // Coluna esquerda - Sanduíches e Salgados
    let leftY = startY

    // Sanduíches (se houver)
    if (cardapio.sanduiches && cardapio.sanduiches.length > 0) {
      // Badge em formato de pílula padronizado (tamanho fixo)
      const badgeWidth = 35 // Largura fixa padronizada
      const badgeHeight = 12
      const borderRadius = badgeHeight / 2
      const badgeX = leftColumnX
      const badgeY = leftY
      
      // Fundo dourado em formato de pílula
      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.setDrawColor(gold[0], gold[1], gold[2])
      doc.setLineWidth(0.5)
      
      // Retângulo central
      doc.rect(badgeX + borderRadius, badgeY, badgeWidth - borderRadius * 2, badgeHeight, "FD")
      
      // Círculos nas extremidades
      doc.circle(badgeX + borderRadius, badgeY + borderRadius, borderRadius, "FD")
      doc.circle(badgeX + badgeWidth - borderRadius, badgeY + borderRadius, borderRadius, "FD")
      
      // Texto em verde escuro (aumentado em 20%)
      doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2])
      doc.setFontSize(14.4) // 12 * 1.2
      doc.setFont("helvetica", "bold")
      doc.text("Sanduíches", badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 2, { align: "center" })

      // Ajustar posição Y para começar os itens após o badge
      leftY += badgeHeight + sectionSpacing
      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(10) // Tamanho original dos itens
      doc.setFont("helvetica", "normal")
      cardapio.sanduiches.forEach((sanduiche) => {
        if (leftY > pageHeight - margin - 35) {
          doc.addPage()
          addPageBackground()
          leftY = margin + 20
        }
        // Bullet decorativo
        doc.setFillColor(gold[0], gold[1], gold[2])
        doc.circle(leftColumnX + 4, leftY - 1.5, 1.2, "F")
        // Quebrar linha se o texto for muito longo
        const maxWidth = columnWidth - 12
        const lines = doc.splitTextToSize(sanduiche, maxWidth)
        doc.text(lines, leftColumnX + 8, leftY)
        leftY += itemSpacing * lines.length
      })
      leftY += 4 // Espaço entre sanduíches e salgados
    }

    // Badge em formato de pílula padronizado (tamanho fixo)
    const salgadosBadgeWidth = 35 // Largura fixa padronizada
    const salgadosBadgeHeight = 12
    const salgadosBorderRadius = salgadosBadgeHeight / 2
    const salgadosBadgeX = leftColumnX
    const salgadosBadgeY = leftY
    
    // Fundo dourado em formato de pílula
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(0.5)
    
    // Retângulo central
    doc.rect(salgadosBadgeX + salgadosBorderRadius, salgadosBadgeY, salgadosBadgeWidth - salgadosBorderRadius * 2, salgadosBadgeHeight, "FD")
    
    // Círculos nas extremidades
    doc.circle(salgadosBadgeX + salgadosBorderRadius, salgadosBadgeY + salgadosBorderRadius, salgadosBorderRadius, "FD")
    doc.circle(salgadosBadgeX + salgadosBadgeWidth - salgadosBorderRadius, salgadosBadgeY + salgadosBorderRadius, salgadosBorderRadius, "FD")
    
    // Texto em verde escuro (aumentado em 20%)
    doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2])
    doc.setFontSize(14.4) // 12 * 1.2
    doc.setFont("helvetica", "bold")
    doc.text("Salgados", salgadosBadgeX + salgadosBadgeWidth / 2, salgadosBadgeY + salgadosBadgeHeight / 2 + 2, { align: "center" })

    // Ajustar posição Y para começar os itens após o badge
    leftY += salgadosBadgeHeight + sectionSpacing
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(10) // Tamanho original dos itens
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

    // Badge em formato de pílula padronizado (tamanho fixo)
    const docesBadgeWidth = 35 // Largura fixa padronizada
    const docesBadgeHeight = 12
    const docesBorderRadius = docesBadgeHeight / 2
    const docesBadgeX = rightColumnX
    const docesBadgeY = rightY
    
    // Fundo dourado em formato de pílula
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(0.5)
    
    // Retângulo central
    doc.rect(docesBadgeX + docesBorderRadius, docesBadgeY, docesBadgeWidth - docesBorderRadius * 2, docesBadgeHeight, "FD")
    
    // Círculos nas extremidades
    doc.circle(docesBadgeX + docesBorderRadius, docesBadgeY + docesBorderRadius, docesBorderRadius, "FD")
    doc.circle(docesBadgeX + docesBadgeWidth - docesBorderRadius, docesBadgeY + docesBorderRadius, docesBorderRadius, "FD")
    
    // Texto em verde escuro (aumentado em 20%)
    doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2])
    doc.setFontSize(14.4) // 12 * 1.2
    doc.setFont("helvetica", "bold")
    doc.text("Doces", docesBadgeX + docesBadgeWidth / 2, docesBadgeY + docesBadgeHeight / 2 + 2, { align: "center" })

    // Ajustar posição Y para começar os itens após o badge
    rightY += docesBadgeHeight + sectionSpacing
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(10) // Tamanho original dos itens
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

    // Badge em formato de pílula padronizado (tamanho fixo)
    rightY += 4
    if (rightY > pageHeight - margin - 55) {
      doc.addPage()
      addPageBackground()
      rightY = margin + 20
    }
    const bebidasBadgeWidth = 35 // Largura fixa padronizada
    const bebidasBadgeHeight = 12
    const bebidasBorderRadius = bebidasBadgeHeight / 2
    const bebidasBadgeX = rightColumnX
    const bebidasBadgeY = rightY
    
    // Fundo dourado em formato de pílula
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(0.5)
    
    // Retângulo central
    doc.rect(bebidasBadgeX + bebidasBorderRadius, bebidasBadgeY, bebidasBadgeWidth - bebidasBorderRadius * 2, bebidasBadgeHeight, "FD")
    
    // Círculos nas extremidades
    doc.circle(bebidasBadgeX + bebidasBorderRadius, bebidasBadgeY + bebidasBorderRadius, bebidasBorderRadius, "FD")
    doc.circle(bebidasBadgeX + bebidasBadgeWidth - bebidasBorderRadius, bebidasBadgeY + bebidasBorderRadius, bebidasBorderRadius, "FD")
    
    // Texto em verde escuro (aumentado em 20%)
    doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2])
    doc.setFontSize(14.4) // 12 * 1.2
    doc.setFont("helvetica", "bold")
    doc.text("Bebidas", bebidasBadgeX + bebidasBadgeWidth / 2, bebidasBadgeY + bebidasBadgeHeight / 2 + 2, { align: "center" })

    // Ajustar posição Y para começar os itens após o badge
    rightY += bebidasBadgeHeight + sectionSpacing
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(10) // Tamanho original dos itens
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

    // Calcular altura máxima das colunas (ajustado para incluir investimento e sanduíches)
    const sanduichesHeight = cardapio.sanduiches && cardapio.sanduiches.length > 0 
      ? sectionSpacing + (cardapio.sanduiches.length * itemSpacing) + 4 
      : 0
    const leftColumnEndY = startY + sanduichesHeight + sectionSpacing + (cardapio.salgados.length * itemSpacing)
    const rightColumnEndY = startY + sectionSpacing + (cardapio.doces.length * itemSpacing) + 3 + sectionSpacing + (Object.keys(cardapio.bebidas).length * itemSpacing)
    const maxContentY = Math.max(leftColumnEndY, rightColumnEndY)

    // Adicionar investimento logo acima do rodapé (em formato de pílula)
    if (cardapio.investimento) {
      // Posicionar investimento logo acima do rodapé
      const footerY = pageHeight - margin - 15
      const footerCardHeight = 28
      const investimentoY = footerY - 12 // Logo acima do rodapé
      
      // Texto do investimento para calcular largura (aumentado em 20%)
      doc.setFontSize(14.4) // 12 * 1.2
      doc.setFont("helvetica", "bold")
      
      const investimentoValue = typeof cardapio.investimento === "number" ? cardapio.investimento : parseFloat(String(cardapio.investimento || "0"))
      const formattedValue = investimentoValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
      
      const text = `Investimento: ${formattedValue}`
      const textWidth = doc.getTextWidth(text)
      
      // Dimensões do badge em formato de pílula (maior)
      const padding = 12
      const badgeWidth = textWidth + padding * 2
      const badgeHeight = 12
      const borderRadius = badgeHeight / 2 // Raio para bordas arredondadas
      const badgeX = pageWidth / 2 - badgeWidth / 2
      const badgeY = investimentoY - badgeHeight / 2
      
      // Desenhar badge em formato de pílula (retângulo com bordas arredondadas)
      // Fundo branco sem borda dourada
      doc.setFillColor(white[0], white[1], white[2])
      doc.setDrawColor(white[0], white[1], white[2])
      doc.setLineWidth(0)
      
      // Retângulo central
      doc.rect(badgeX + borderRadius, badgeY, badgeWidth - borderRadius * 2, badgeHeight, "FD")
      
      // Círculos nas extremidades para criar bordas arredondadas (sem borda)
      doc.circle(badgeX + borderRadius, badgeY + borderRadius, borderRadius, "F")
      doc.circle(badgeX + badgeWidth - borderRadius, badgeY + borderRadius, borderRadius, "F")
      
      // Texto do investimento em verde escuro
      doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2])
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(text, pageWidth / 2, investimentoY + 2, { align: "center" })
    }

    // Informações adicionais
    const hasAdditionalInfo = cardapio.informacoes_adicionais?.trim()

    if (hasAdditionalInfo && cardapio.informacoes_adicionais) {
      // Calcular posição do investimento para posicionar informações adicionais logo acima
      const footerY = pageHeight - margin - 15
      const investimentoY = footerY - 12 // Posição Y do investimento
      
      doc.setFontSize(12) // 10 * 1.2
      doc.setFont("helvetica", "normal")
      const lines = doc.splitTextToSize(cardapio.informacoes_adicionais, contentWidth - 10)
      const textHeight = lines.length * 5
      
      // Posicionar logo acima do investimento (com espaço de 8mm)
      const startInfoY = investimentoY - textHeight - 8

      // Verificar se cabe na página atual
      if (startInfoY > maxContentY + 10) {
        // Apenas texto, sem caixa dourada - posicionado logo acima do investimento
        doc.setTextColor(white[0], white[1], white[2])
        doc.setFontSize(12) // 10 * 1.2
        doc.setFont("helvetica", "normal")
        doc.text(lines, margin + 3, startInfoY)
      } else {
        // Não cabe, criar nova página
        doc.addPage()
        addPageBackground()
        doc.setTextColor(white[0], white[1], white[2])
        doc.setFontSize(12) // 10 * 1.2
        doc.setFont("helvetica", "normal")
        doc.text(lines, margin + 3, margin + 10)
      }
    }

    // Adicionar investimento logo acima do rodapé (em formato de pílula)
    const investimentoFooterY = pageHeight - margin - 15
    
    if (cardapio.investimento) {
      // Posicionar investimento logo acima do rodapé
      const investimentoY = investimentoFooterY - 12 // Logo acima do rodapé
      
      // Texto do investimento para calcular largura (aumentado em 20%)
      doc.setFontSize(14.4) // 12 * 1.2
      doc.setFont("helvetica", "bold")
      
      const investimentoValue = typeof cardapio.investimento === "number" ? cardapio.investimento : parseFloat(String(cardapio.investimento || "0"))
      const formattedValue = investimentoValue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
      
      const text = `Investimento: ${formattedValue}`
      const textWidth = doc.getTextWidth(text)
      
      // Dimensões do badge em formato de pílula (maior)
      const padding = 12
      const badgeWidth = textWidth + padding * 2
      const badgeHeight = 12
      const borderRadius = badgeHeight / 2 // Raio para bordas arredondadas
      const badgeX = pageWidth / 2 - badgeWidth / 2
      const badgeY = investimentoY - badgeHeight / 2
      
      // Desenhar badge em formato de pílula (retângulo com bordas arredondadas)
      // Fundo branco sem borda dourada
      doc.setFillColor(white[0], white[1], white[2])
      doc.setDrawColor(white[0], white[1], white[2])
      doc.setLineWidth(0)
      
      // Retângulo central
      doc.rect(badgeX + borderRadius, badgeY, badgeWidth - borderRadius * 2, badgeHeight, "FD")
      
      // Círculos nas extremidades para criar bordas arredondadas (sem borda)
      doc.circle(badgeX + borderRadius, badgeY + borderRadius, borderRadius, "F")
      doc.circle(badgeX + badgeWidth - borderRadius, badgeY + borderRadius, borderRadius, "F")
      
      // Texto do investimento em verde escuro
      doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2])
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(text, pageWidth / 2, investimentoY + 2, { align: "center" })
    }

    // Rodapé - textos lado a lado no final da página
    const footerY = pageHeight - margin - 5
    
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(10.8) // 9 * 1.2
    doc.setFont("helvetica", "normal")
    
    // Calcular larguras dos textos
    const siteText = "www.elevecafe.com.br"
    const whatsappText = "WhatsApp: (21) 96591-3009"
    const instagramText = "Instagram: @eleve.cafe"
    
    const siteWidth = doc.getTextWidth(siteText)
    const whatsappWidth = doc.getTextWidth(whatsappText)
    const instagramWidth = doc.getTextWidth(instagramText)
    
    const totalWidth = siteWidth + whatsappWidth + instagramWidth
    const spacing = (pageWidth - margin * 2 - totalWidth) / 4 // Espaço entre textos e nas laterais
    
    // Posicionar textos lado a lado
    let currentX = margin + spacing
    doc.text(siteText, currentX, footerY)
    
    currentX += siteWidth + spacing
    doc.text(whatsappText, currentX, footerY)
    
    currentX += whatsappWidth + spacing
    doc.text(instagramText, currentX, footerY)

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
                  <TableHead>Cliente</TableHead>
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
                      <div className="font-medium">
                        {cardapio.nome_cliente || "-"}
                      </div>
                    </TableCell>
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePDF(cardapio)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/dashboard/cardapios/${cardapio.id}/edit`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
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

