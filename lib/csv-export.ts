import type { EventWithFornecedor, EventWithFornecedores } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Converte uma lista de eventos para um formato adequado para CSV
 * @param events Lista de eventos a serem convertidos
 * @returns Array de objetos formatados para CSV
 */
export function eventsToCSV(events: EventWithFornecedor[] | EventWithFornecedores[]): any[] {
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
 * Exporta uma lista de eventos para um arquivo CSV
 * @param events Lista de eventos a serem exportados
 */
export async function exportEventsToCSV(events: EventWithFornecedores[]): Promise<void> {
  // Converter eventos para formato CSV
  const csvData = eventsToCSV(events)

  // Usar a função downloadCSV para fazer o download
  downloadCSV(csvData, `eventos_${format(new Date(), "yyyy-MM-dd")}.csv`)
}

/**
 * Função genérica para download de CSV a partir de dados
 * @param data Dados a serem convertidos em CSV
 * @param filename Nome do arquivo para download
 * @param headers Cabeçalhos opcionais para o CSV
 */
export function downloadCSV(
  data: any[],
  filename = `export_${format(new Date(), "yyyy-MM-dd")}.csv`,
  headers?: string[],
): void {
  if (!data || data.length === 0) {
    console.warn("Nenhum dado para exportar")
    return
  }

  // Se não foram fornecidos cabeçalhos, usar as chaves do primeiro objeto
  const csvHeaders = headers || Object.keys(data[0])

  // Criar linhas do CSV
  const csvRows = data.map((row) => {
    // Se row é um objeto, extrair valores na ordem dos cabeçalhos
    if (typeof row === "object" && row !== null) {
      return csvHeaders
        .map((header) => {
          const value = row[header]
          // Formatar o valor e escapar aspas
          return formatCSVValue(value)
        })
        .join(",")
    }
    // Se row é um array, juntar valores
    else if (Array.isArray(row)) {
      return row.map(formatCSVValue).join(",")
    }
    // Caso contrário, usar o valor diretamente
    return formatCSVValue(row)
  })

  // Combinar cabeçalhos e linhas
  const csvContent = [csvHeaders.join(","), ...csvRows].join("\n")

  // Criar blob e link para download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  // Configurar e simular clique no link
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Função auxiliar para formatar valores para CSV
function formatCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '""'
  }

  // Formatar datas
  if (value instanceof Date) {
    return `"${format(value, "dd/MM/yyyy", { locale: ptBR })}"`
  }

  // Converter para string e escapar aspas
  const stringValue = String(value).replace(/"/g, '""')
  return `"${stringValue}"`
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

