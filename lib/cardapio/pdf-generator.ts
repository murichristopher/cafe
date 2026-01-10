import type { Cardapio } from "@/types"
import type jsPDF from "jspdf"

// Tipos para dados do formulário
export interface CardapioFormData {
  data: string
  horarioInicio: string
  horarioFim: string
  quantidadeParticipantes: string
  nomeCliente: string
  local: string
  titulo: string
  investimento?: string
  sanduiches: string[]
  salgados: string[]
  doces: string[]
  bebidas: Array<{ nome: string; quantidade: string }>
  informacoesAdicionais: string
}

// Cores do tema
const darkGreen = [13, 51, 44] // #0d332c
const gold = [210, 180, 120] // #d2b478
const lightGold = [230, 200, 140] // #e6c88c
const white = [255, 255, 255]
const darkGold = [180, 150, 90] // #b4965a
const lightGreen = [20, 70, 60] // #14463c

// Funções auxiliares
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

const addPageBackground = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
  doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2])
  doc.rect(0, 0, pageWidth, pageHeight, "F")
}

const createCard = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: number[],
  borderColor: number[]
) => {
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
  doc.setLineWidth(0.5)
  doc.rect(x, y, width, height, "FD")
  doc.setDrawColor(gold[0], gold[1], gold[2])
  doc.setLineWidth(0.3)
  doc.rect(x + 1, y + 1, width - 2, height - 2, "D")
}

// Função para adicionar logo
const addLogo = async (doc: jsPDF, margin: number): Promise<number> => {
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
  return logoHeight
}

// Função para adicionar informações do evento no canto superior direito
const addEventInfo = (
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  logoHeight: number,
  formData: CardapioFormData
) => {
  doc.setTextColor(white[0], white[1], white[2])
  doc.setFontSize(12) // 10 * 1.2
  doc.setFont("helvetica", "normal")
  const eventInfoY = margin - 5 + (logoHeight > 0 ? logoHeight / 2 - 6 : 5)
  const eventInfoX = pageWidth - margin
  const lineSpacing = 5.5

  doc.text(`Data: ${formatDate(formData.data)}`, eventInfoX, eventInfoY, { align: "right" })
  doc.text(
    `Hora: ${formatTime(formData.horarioInicio)}`,
    eventInfoX,
    eventInfoY + lineSpacing,
    { align: "right" }
  )
  doc.text(`Pax: ${formData.quantidadeParticipantes}`, eventInfoX, eventInfoY + lineSpacing * 2, { align: "right" })
  let currentLine = 3
  if (formData.nomeCliente.trim()) {
    doc.text(`Cliente: ${formData.nomeCliente}`, eventInfoX, eventInfoY + lineSpacing * currentLine, { align: "right" })
    currentLine++
  }
  if (formData.local.trim()) {
    doc.text(`Local: ${formData.local}`, eventInfoX, eventInfoY + lineSpacing * currentLine, { align: "right" })
    currentLine++
  }
}

// Função para adicionar título
const addTitle = (
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  logoHeight: number,
  titulo: string
) => {
  const titleY = Math.max(margin - 5 + logoHeight + 6, margin - 5 + 30)
  const titleText = titulo || "COQUETEL"
  
  doc.setFontSize(21)
  doc.setFont("helvetica", "bold")
  const titleHeight = 18

  // Título sem background, apenas texto
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.setFontSize(25.2) // 21 * 1.2
  doc.setFont("helvetica", "bold")
  doc.text(titleText, pageWidth / 2, titleY + titleHeight / 2 + 4, { align: "center" })

  return { titleY, titleHeight }
}

// Função para adicionar linha vertical decorativa
const addVerticalLine = (
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  titleY: number,
  titleHeight: number
) => {
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
  
  return { lineStartY, lineEndY, lineX }
}

// Função para adicionar investimento logo acima do rodapé (em formato de pílula)
const addInvestimento = (
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  investimento?: string
) => {
  if (!investimento || !investimento.trim()) return
  
  // Posicionar investimento logo acima do rodapé
  const footerY = pageHeight - margin - 15
  const footerCardHeight = 28
  const investimentoY = footerY - 12 // Logo acima do rodapé
  
  // Texto do investimento para calcular largura (aumentado em 20%)
  doc.setFontSize(14.4) // 12 * 1.2
  doc.setFont("helvetica", "bold")
  
  const investimentoValue = parseFloat(investimento)
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
  
  // Texto do investimento em verde escuro (aumentado em 20%)
  doc.setTextColor(darkGreen[0], darkGreen[1], darkGreen[2])
  doc.setFontSize(14.4) // 12 * 1.2
  doc.setFont("helvetica", "bold")
  doc.text(text, pageWidth / 2, investimentoY + 2, { align: "center" })
}

// Função para adicionar seção de itens (salgados, doces, bebidas)
const addItemsSection = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  pageHeight: number,
  margin: number,
  title: string,
  items: string[],
  sectionSpacing: number,
  itemSpacing: number,
  sectionTitleHeight: number
) => {
  let currentY = y
  
  // Badge em formato de pílula padronizado (tamanho fixo)
  const badgeWidth = 35 // Largura fixa padronizada
  const badgeHeight = 12
  const borderRadius = badgeHeight / 2
  const badgeX = x
  const badgeY = currentY
  
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
  doc.text(title, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 2, { align: "center" })

  // Ajustar posição Y para começar os itens após o badge
  currentY += badgeHeight + sectionSpacing
  doc.setTextColor(white[0], white[1], white[2])
  doc.setFontSize(10) // Tamanho original dos itens
  doc.setFont("helvetica", "normal")
  
  items.forEach((item) => {
    if (currentY > pageHeight - margin - 35) {
      doc.addPage()
      addPageBackground(doc, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight())
      currentY = margin + 20
    }
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.circle(x + 4, currentY - 1.5, 1.2, "F")
    const maxWidth = width - 12
    const lines = doc.splitTextToSize(item, maxWidth)
    doc.text(lines, x + 8, currentY)
    currentY += itemSpacing * lines.length
  })

  return currentY
}

// Função para adicionar seção de bebidas (com quantidades)
const addBebidasSection = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  pageHeight: number,
  margin: number,
  bebidas: Array<{ nome: string; quantidade: string }>,
  sectionSpacing: number,
  itemSpacing: number,
  sectionTitleHeight: number
) => {
  let currentY = y + 4
  if (currentY > pageHeight - margin - 55) {
    doc.addPage()
    addPageBackground(doc, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight())
    currentY = margin + 20
  }
  
  // Badge em formato de pílula padronizado (tamanho fixo)
  const badgeWidth = 35 // Largura fixa padronizada
  const badgeHeight = 12
  const borderRadius = badgeHeight / 2
  const badgeX = x
  const badgeY = currentY
  
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
  doc.text("Bebidas", badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 2, { align: "center" })

  // Ajustar posição Y para começar os itens após o badge
  currentY += badgeHeight + sectionSpacing
  doc.setTextColor(white[0], white[1], white[2])
  doc.setFontSize(10) // Tamanho original dos itens
  doc.setFont("helvetica", "normal")
  
  bebidas.forEach((bebida) => {
    if (currentY > pageHeight - margin - 35) {
      doc.addPage()
      addPageBackground(doc, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight())
      currentY = margin + 20
    }
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.circle(x + 4, currentY - 1.5, 1.2, "F")
    let texto = bebida.nome
    if (bebida.nome === "Cerveja") {
      texto = `${bebida.quantidade} unidades de cerveja Heineken`
    } else if (bebida.nome === "Espumante") {
      texto = `${bebida.quantidade} garrafas de espumante`
    } else if (parseInt(bebida.quantidade) > 1) {
      texto = `${bebida.quantidade} ${bebida.nome}`
    }
    const maxWidth = width - 12
    const lines = doc.splitTextToSize(texto, maxWidth)
    doc.text(lines, x + 8, currentY)
    currentY += itemSpacing * lines.length
  })

  return currentY
}

// Função para adicionar informações adicionais
const addAdditionalInfo = (
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  maxContentY: number,
  informacoesAdicionais: string,
  sectionTitleHeight: number
) => {
  if (!informacoesAdicionais.trim()) return

  // Calcular posição do investimento para posicionar informações adicionais logo acima
  const footerY = pageHeight - margin - 15
  const investimentoY = footerY - 12 // Posição Y do investimento
  
  doc.setFontSize(12) // 10 * 1.2
  doc.setFont("helvetica", "normal")
  const lines = doc.splitTextToSize(informacoesAdicionais, pageWidth - margin * 2 - 10)
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
    addPageBackground(doc, pageWidth, pageHeight)
    // Apenas texto, sem caixa dourada
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(12) // 10 * 1.2
    doc.setFont("helvetica", "normal")
    doc.text(lines, margin + 3, margin + 10)
  }
}

// Função para adicionar rodapé
const addFooter = (
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  contentWidth: number
) => {
  // Posicionar no final da página
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
}

// Função principal para gerar PDF
export const generateCardapioPDF = async (formData: CardapioFormData) => {
  // Verificar se estamos no cliente
  if (typeof window === "undefined") {
    throw new Error("generateCardapioPDF só pode ser executado no cliente")
  }

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
  const sectionSpacing = 16
  const itemSpacing = 5.5
  const sectionTitleHeight = 9

  // Adicionar fundo
  addPageBackground(doc, pageWidth, pageHeight)

  // Adicionar logo
  const logoHeight = await addLogo(doc, margin)

  // Adicionar informações do evento
  addEventInfo(doc, pageWidth, margin, logoHeight, formData)

  // Adicionar título
  const { titleY, titleHeight } = addTitle(doc, pageWidth, margin, logoHeight, formData.titulo)

  // Adicionar linha vertical
  const { lineStartY, lineEndY, lineX } = addVerticalLine(doc, pageWidth, pageHeight, margin, titleY, titleHeight)

  // Configurar colunas
  const leftColumnX = margin
  const rightColumnX = pageWidth / 2 + columnGap / 2
  const columnWidth = (pageWidth - margin * 2 - columnGap) / 2
  const startY = titleY + titleHeight + 12

  // Adicionar seções
  // Sanduíches (coluna esquerda, primeiro)
  let leftY = startY
  if (formData.sanduiches && formData.sanduiches.length > 0) {
    leftY = addItemsSection(
      doc,
      leftColumnX,
      startY,
      columnWidth,
      pageHeight,
      margin,
      "Sanduíches",
      formData.sanduiches,
      sectionSpacing,
      itemSpacing,
      sectionTitleHeight
    )
    leftY += 4 // Espaço entre sanduíches e salgados
  }
  
  // Salgados (coluna esquerda, depois de sanduíches)
  leftY = addItemsSection(
    doc,
    leftColumnX,
    leftY,
    columnWidth,
    pageHeight,
    margin,
    "Salgados",
    formData.salgados,
    sectionSpacing,
    itemSpacing,
    sectionTitleHeight
  )

  const rightYDoces = addItemsSection(
    doc,
    rightColumnX,
    startY,
    columnWidth,
    pageHeight,
    margin,
    "Doces",
    formData.doces,
    sectionSpacing,
    itemSpacing,
    sectionTitleHeight
  )

  const rightY = addBebidasSection(
    doc,
    rightColumnX,
    rightYDoces,
    columnWidth,
    pageHeight,
    margin,
    formData.bebidas,
    sectionSpacing,
    itemSpacing,
    sectionTitleHeight
  )

  // Calcular altura máxima (ajustado para incluir investimento e sanduíches)
  const sanduichesHeight = formData.sanduiches && formData.sanduiches.length > 0 
    ? sectionSpacing + (formData.sanduiches.length * itemSpacing) + 4 
    : 0
  const leftColumnEndY = startY + sanduichesHeight + sectionSpacing + (formData.salgados.length * itemSpacing)
  const rightColumnEndY = startY + sectionSpacing + (formData.doces.length * itemSpacing) + 4 + sectionSpacing + (formData.bebidas.length * itemSpacing)
  const maxContentY = Math.max(leftColumnEndY, rightColumnEndY)

  // Adicionar informações adicionais
  addAdditionalInfo(doc, pageWidth, pageHeight, margin, maxContentY, formData.informacoesAdicionais, sectionTitleHeight)

  // Adicionar investimento logo acima do rodapé
  addInvestimento(doc, pageWidth, pageHeight, margin, formData.investimento)

  // Adicionar rodapé
  addFooter(doc, pageWidth, pageHeight, margin, contentWidth)

  // Salvar PDF
  const fileName = `cardapio-${formData.data || "evento"}.pdf`
  doc.save(fileName)
}

