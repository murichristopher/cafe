"use client"

import { useState, useEffect } from "react"
import { Download, Calendar, Clock, Users, Search, FileText } from "lucide-react"
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
import { jsPDF } from "jspdf"
import type { Cardapio } from "@/types"

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

  const generatePDF = (cardapio: Cardapio) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Cores (aproximação do design da imagem)
    const darkGreen = [34, 68, 51] // #224433
    const gold = [212, 175, 55] // #D4AF37
    const white = [255, 255, 255]

    // Fundo verde escuro
    doc.setFillColor(darkGreen[0], darkGreen[1], darkGreen[2])
    doc.rect(0, 0, 210, 297, "F")

    // Logo e título no topo esquerdo
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("ELEVE", 20, 25)
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text("CAFÉ", 20, 32)

    // Data e horário no topo direito
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    const dataFormatada = format(new Date(cardapio.data), "dd/MM", { locale: ptBR })
    doc.text(`Data: ${dataFormatada}`, 150, 22)
    doc.text(`Horário: ${cardapio.horario_inicio} às ${cardapio.horario_fim}`, 150, 28)
    doc.text(`${cardapio.quantidade_participantes} participantes`, 150, 34)

    // Título COQUETEL com borda tracejada
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    const titleWidth = doc.getTextWidth("COQUETEL")
    const titleX = (210 - titleWidth) / 2
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(0.5)
    doc.setLineDashPattern([5, 5], 0)
    doc.rect(titleX - 5, 45, titleWidth + 10, 12)
    doc.setTextColor(gold[0], gold[1], gold[2])
    doc.text("COQUETEL", 105, 54, { align: "center" })

    // Linha divisória vertical dourada com ícone de café no meio
    doc.setLineWidth(1.5)
    doc.setLineDashPattern([], 0)
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.line(105, 70, 105, 240)
    
    // Ícone de café simples (círculo representando xícara)
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.circle(105, 155, 3, "F")

    // Coluna esquerda - Salgados
    doc.setTextColor(gold[0], gold[1], gold[2])
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.rect(20, 70, 75, 7, "F")
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Salgados:", 22, 75.5)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(white[0], white[1], white[2])
    let yPos = 85
    cardapio.salgados.forEach((salgado) => {
      if (yPos < 240) {
        doc.text(salgado, 22, yPos)
        yPos += 6
      }
    })

    // Coluna direita - Doces
    const docesStartY = 70
    doc.setTextColor(gold[0], gold[1], gold[2])
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.rect(110, docesStartY, 80, 7, "F")
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Doces:", 112, 75.5)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(white[0], white[1], white[2])
    yPos = 85
    cardapio.doces.forEach((doce) => {
      if (yPos < 180) {
        doc.text(doce, 112, yPos)
        yPos += 6
      }
    })

    // Bebidas (abaixo dos doces na coluna direita)
    const bebidasY = yPos + 8
    if (bebidasY < 240) {
      doc.setTextColor(gold[0], gold[1], gold[2])
      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.rect(110, bebidasY, 80, 7, "F")
      doc.setTextColor(white[0], white[1], white[2])
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Bebidas:", 112, bebidasY + 5.5)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(white[0], white[1], white[2])
      let bebidasYPos = bebidasY + 15
      Object.entries(cardapio.bebidas).forEach(([bebida, quantidade]) => {
        if (bebidasYPos < 240 && quantidade > 0) {
          const texto = quantidade === 1 
            ? bebida 
            : `${quantidade} ${bebida.includes("unidades") || bebida.includes("garrafas") ? "" : "unidades de"} ${bebida}`
          doc.text(texto, 112, bebidasYPos)
          bebidasYPos += 6
        }
      })
    }

    // Informações de contato no rodapé esquerdo
    doc.setFontSize(7)
    doc.setTextColor(white[0], white[1], white[2])
    doc.setFont("helvetica", "normal")
    doc.text("www.elevecafe.com.br", 20, 275)
    doc.text("WhatsApp: (21) 96591-3009", 20, 282)
    doc.text("Instagram: @eleve.cafe", 20, 289)

    // Informações adicionais se houver
    if (cardapio.informacoes_adicionais) {
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.text("Informações adicionais:", 20, 250)
      const lines = doc.splitTextToSize(cardapio.informacoes_adicionais, 80)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      let infoY = 257
      lines.forEach((line: string) => {
        if (infoY < 270) {
          doc.text(line, 22, infoY)
          infoY += 4
        }
      })
    }

    // Salvar PDF
    const fileName = `cardapio-${format(new Date(cardapio.data), "yyyy-MM-dd")}-${cardapio.id.substring(0, 8)}.pdf`
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

