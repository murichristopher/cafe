import type { EventWithFornecedor, EventWithFornecedores } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import * as XLSX from "xlsx"

/**
 * Converte uma lista de eventos para um formato adequado para Excel
 * @param events Lista de eventos a serem convertidos
 * @returns Array de objetos formatados para Excel
 */
export function eventsToExcelData(events: EventWithFornecedor[] | EventWithFornecedores[]): any[] {
  return events.map((event) => {
    const date = new Date(event.date)
    const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR })
    const formattedTime = format(date, "HH:mm", { locale: ptBR })

    // Formatar data de pagamento se existir
    let formattedPaymentDate = ""
    if (event.dia_pagamento) {
      const paymentDate = new Date(event.dia_pagamento)
      formattedPaymentDate = format(paymentDate, "dd/MM/yyyy", { locale: ptBR })
    }

    // Obter nome do fornecedor
    let fornecedorName = ""
    if ("fornecedor" in event && event.fornecedor) {
      fornecedorName = event.fornecedor.name
    } else if ("fornecedores" in event && event.fornecedores && event.fornecedores.length > 0) {
      fornecedorName = event.fornecedores.map((f) => f.name).join(", ")
    }

    return {
      // Removido o campo ID
      Título: event.title,
      Descrição: event.description.replace(/\n/g, " "), // Remover quebras de linha
      Data: formattedDate,
      Horário: formattedTime,
      Local: event.location,
      Status: getStatusText(event.status),
      Fornecedor: fornecedorName,
      "Valor (R$)": event.valor ? event.valor.toString().replace(".", ",") : "",
      "Nota Fiscal": event.nota_fiscal || "",
      "Status Pagamento": getPagamentoText(event.pagamento),
      "Data Pagamento": formattedPaymentDate,
      PAX: event.pax ? event.pax.toString() : "",
    }
  })
}

/**
 * Exporta uma lista de eventos para um arquivo Excel (XLSX)
 * @param events Lista de eventos a serem exportados
 */
export async function exportEventsToExcel(events: EventWithFornecedores[]): Promise<void> {
  try {
    // Converter eventos para formato adequado para Excel
    const excelData = eventsToExcelData(events)

    // Criar uma nova planilha
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Criar um novo livro e adicionar a planilha
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eventos")

    // Gerar o arquivo Excel e fazer o download
    const fileName = `eventos_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    XLSX.writeFile(workbook, fileName)

    return Promise.resolve()
  } catch (error) {
    console.error("Erro ao exportar para Excel:", error)
    return Promise.reject(error)
  }
}

// Funções auxiliares para formatação de texto
function getStatusText(status: string): string {
  switch (status) {
    case "confirmado":
      return "Confirmado"
    case "cancelado":
      return "Cancelado"
    case "aguardando_aprovacao":
      return "Aguardando Aprovação"
    case "concluido":
      return "Concluído"
    default:
      return "Pendente"
  }
}

function getPagamentoText(pagamento: string | null): string {
  if (!pagamento) return ""
  switch (pagamento) {
    case "realizado":
      return "Realizado"
    case "cancelado":
      return "Cancelado"
    default:
      return "Pendente"
  }
}

