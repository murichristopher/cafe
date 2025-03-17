import { sendWhatsAppMessage, checkWhatsAppStatus } from "@/lib/whatsapp-service"

/**
 * Tests the WhatsApp notification system by sending a test message
 * @param phoneNumber The phone number to send the test message to
 * @returns Result of the test
 */
export async function testWhatsAppNotification(phoneNumber: string) {
  console.log(`[TEST] Starting WhatsApp notification test to ${phoneNumber}`)

  try {
    // First check if WhatsApp is connected
    const status = await checkWhatsAppStatus()
    console.log(`[TEST] WhatsApp connection status:`, status)

    if (!status.connected) {
      console.error(`[TEST] WhatsApp is not connected. Cannot send test message.`)
      return {
        success: false,
        message: "WhatsApp is not connected. Please connect first.",
      }
    }

    // Send test message
    const message =
      "Este é um teste de notificação do sistema de eventos. Se você recebeu esta mensagem, o sistema está funcionando corretamente."
    console.log(`[TEST] Sending test message to ${phoneNumber}`)

    const result = await sendWhatsAppMessage(phoneNumber, message)
    console.log(`[TEST] WhatsApp test message result:`, result)

    return result
  } catch (error) {
    console.error(`[TEST] Error in WhatsApp test:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during test",
    }
  }
}

