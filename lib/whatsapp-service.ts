// Serviço para interagir com a API do WhatsApp
const API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || ""

// Tipo para o status do WhatsApp
export type WhatsAppStatus = {
  connected: boolean
}

// Tipo para o QR Code
export type WhatsAppQRCode = {
  qrCode: string
}

// Tipo para a resposta de envio de mensagem
export type WhatsAppSendMessageResponse = {
  success: boolean
  message: string
}

// Tipo para a requisição de envio de mensagem
export type WhatsAppSendMessageRequest = {
  to: string
  message: string
}

// Modificar a função checkWhatsAppStatus para adicionar o cabeçalho
export async function checkWhatsAppStatus(): Promise<WhatsAppStatus> {
  try {
    const response = await fetch(`${API_URL}/status`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
    if (!response.ok) {
      console.log(`${API_URL}/status`)
      throw new Error("Falha ao verificar status do WhatsApp")
    }
    return await response.json()
  } catch (error) {
    console.error(`${API_URL}/status`, error)
    return { connected: false }
  }
}

// Modificar a função getWhatsAppQRCode para adicionar o cabeçalho
export async function getWhatsAppQRCode(): Promise<WhatsAppQRCode | null> {
  try {
    const response = await fetch(`${API_URL}/connect`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
    if (!response.ok) {
      if (response.status === 400) {
        console.warn("QR Code ainda não foi gerado")
        return null
      }
      throw new Error("Falha ao obter QR Code")
    }
    return await response.json()
  } catch (error) {
    console.error("Erro ao obter QR Code:", error)
    return null
  }
}

// Modificar a função sendWhatsAppMessage para adicionar o cabeçalho
export async function sendWhatsAppMessage(to: string, message: string): Promise<WhatsAppSendMessageResponse> {
  try {
    const response = await fetch(`${API_URL}/send-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ to, message }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Falha ao enviar mensagem")
    }

    return await response.json()
  } catch (error: any) {
    console.error("Erro ao enviar mensagem:", error)
    return {
      success: false,
      message: error.message || "Ocorreu um erro ao enviar a mensagem",
    }
  }
}

