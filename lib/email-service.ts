import { Resend } from "resend"

const RESEND_API_KEY = "re_TshSEH38_8PaAmDU1Xw9rrcT5jKSyNqg4"

const resend = new Resend(RESEND_API_KEY)

export interface EmailData {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
}

export interface EmailResponse {
  success: boolean
  id?: string
  error?: string
}

/**
 * Envia um email usando o Resend
 */
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  try {
    const emailPayload: any = {
      from: data.from || "Eleve Café <contato@elevecafe.com.br>",
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
    }

    // Se tiver HTML, usar HTML, senão usar apenas texto
    if (data.html) {
      emailPayload.html = data.html
      if (data.text) {
        emailPayload.text = data.text
      }
    } else if (data.text) {
      emailPayload.text = data.text
    } else {
      return {
        success: false,
        error: "É necessário fornecer conteúdo HTML ou texto para o email",
      }
    }

    if (data.replyTo) {
      emailPayload.reply_to = data.replyTo
    }

    if (data.cc) {
      emailPayload.cc = Array.isArray(data.cc) ? data.cc : [data.cc]
    }

    if (data.bcc) {
      emailPayload.bcc = Array.isArray(data.bcc) ? data.bcc : [data.bcc]
    }

    const result = await resend.emails.send(emailPayload)

    if (result.error) {
      console.error("[EMAIL] Erro ao enviar email:", result.error)
      return {
        success: false,
        error: result.error.message || "Erro ao enviar email",
      }
    }

    console.log("[EMAIL] Email enviado com sucesso:", result.data?.id)
    return {
      success: true,
      id: result.data?.id,
    }
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao enviar email",
    }
  }
}

/**
 * Lista emails enviados (usando a API do Resend)
 */
export async function listSentEmails() {
  try {
    const { data, error } = await resend.emails.list()

    if (error) {
      console.error("[EMAIL] Erro ao listar emails enviados:", error)
      return {
        success: false,
        error: error.message || "Erro ao listar emails enviados",
        emails: [],
      }
    }

    return {
      success: true,
      emails: data?.data || [],
    }
  } catch (error) {
    console.error("[EMAIL] Erro ao listar emails enviados:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao listar emails enviados",
      emails: [],
    }
  }
}

/**
 * Lista emails recebidos (usando a API do Resend)
 */
export async function listReceivedEmails() {
  try {
    const { data, error } = await resend.emails.receiving.list()

    if (error) {
      console.error("[EMAIL] Erro ao listar emails recebidos:", error)
      return {
        success: false,
        error: error.message || "Erro ao listar emails recebidos",
        emails: [],
      }
    }

    return {
      success: true,
      emails: data?.data || [],
    }
  } catch (error) {
    console.error("[EMAIL] Erro ao listar emails recebidos:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao listar emails recebidos",
      emails: [],
    }
  }
}

/**
 * Obtém detalhes completos de um email enviado pelo ID
 */
export async function getSentEmailById(emailId: string) {
  try {
    const { data, error } = await resend.emails.get(emailId)

    if (error) {
      console.error("[EMAIL] Erro ao buscar email enviado:", error)
      return {
        success: false,
        error: error.message || "Erro ao buscar email",
        email: null,
      }
    }

    return {
      success: true,
      email: data,
    }
  } catch (error) {
    console.error("[EMAIL] Erro ao buscar email enviado:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar email",
      email: null,
    }
  }
}

/**
 * Obtém detalhes completos de um email recebido pelo ID
 */
export async function getReceivedEmailById(emailId: string) {
  try {
    const { data, error } = await resend.emails.receiving.get(emailId)

    if (error) {
      console.error("[EMAIL] Erro ao buscar email recebido:", error)
      return {
        success: false,
        error: error.message || "Erro ao buscar email",
        email: null,
      }
    }

    return {
      success: true,
      email: data,
    }
  } catch (error) {
    console.error("[EMAIL] Erro ao buscar email recebido:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao buscar email",
      email: null,
    }
  }
}

