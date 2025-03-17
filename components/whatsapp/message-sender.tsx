"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { sendWhatsAppMessage } from "@/lib/whatsapp-service"
import { useToast } from "@/hooks/use-toast"

export function WhatsAppMessageSender() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendMessage = async () => {
    if (!phoneNumber || !message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o número de telefone e a mensagem.",
        variant: "destructive",
      })
      return
    }

    // Formatar o número de telefone para o formato esperado pela API
    const formattedNumber = formatPhoneNumber(phoneNumber)

    setIsLoading(true)
    try {
      const response = await sendWhatsAppMessage(formattedNumber, message)

      if (response.success) {
        toast({
          title: "Mensagem enviada",
          description: "Sua mensagem foi enviada com sucesso.",
        })
        // Limpar os campos após o envio bem-sucedido
        setMessage("")
      } else {
        toast({
          title: "Erro ao enviar mensagem",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      toast({
        title: "Erro ao enviar mensagem",
        description: "Ocorreu um erro ao enviar a mensagem. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para formatar o número de telefone para o formato esperado pela API
  const formatPhoneNumber = (number: string): string => {
    // Remover todos os caracteres não numéricos
    const digits = number.replace(/\D/g, "")

    // Verificar se o número já tem o código do país
    const hasCountryCode = digits.startsWith("55")

    // Adicionar o código do país se necessário
    const fullNumber = hasCountryCode ? digits : `55${digits}`

    // Retornar no formato esperado pela API
    return `${fullNumber}@c.us`
  }

  return (
    <Card className="bg-[#1a1a1a] border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Enviar Mensagem</CardTitle>
        <CardDescription>Envie uma mensagem para um contato via WhatsApp</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Número de Telefone</Label>
            <Input
              id="phone-number"
              placeholder="Ex: (11) 99999-9999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              className="bg-zinc-800 border-zinc-700"
            />
            <p className="text-xs text-gray-400">
              Digite apenas o número com DDD, sem o +55 ou outros caracteres especiais.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem aqui..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              className="min-h-[120px] bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !phoneNumber || !message}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Mensagem
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

