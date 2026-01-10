"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EmailSenderProps {
  onSuccess?: () => void
}

export function EmailSender({ onSuccess }: EmailSenderProps) {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [text, setText] = useState("")
  const [from, setFrom] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendEmail = async () => {
    if (!to || !subject) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o destinatário e o assunto.",
        variant: "destructive",
      })
      return
    }

    if (!text) {
      toast({
        title: "Conteúdo obrigatório",
        description: "Por favor, preencha o conteúdo do email.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: to.split(",").map((email) => email.trim()),
          subject,
          text: text,
          from: from ? `Eleve Café <${from}>` : undefined,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Erro ao parsear resposta:", parseError)
        throw new Error("Erro ao processar resposta do servidor")
      }

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`)
      }

      if (data.success) {
        toast({
          title: "Email enviado",
          description: "Seu email foi enviado com sucesso.",
        })
        // Limpar os campos após o envio bem-sucedido
        setTo("")
        setSubject("")
        setText("")
        setFrom("")
        // Chamar callback de sucesso se fornecido
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: "Erro ao enviar email",
          description: data.error || "Ocorreu um erro ao enviar o email.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Ocorreu um erro ao enviar o email. Tente novamente."
      
      // Se o email foi enviado mas houve erro ao salvar no banco, não mostrar erro
      if (errorMessage.includes("Unable to fetch") || errorMessage.includes("could not be resolved")) {
        // Pode ser que o email foi enviado mas houve problema na resposta
        // Verificar se o email realmente foi enviado checando se há ID na resposta
        toast({
          title: "Aviso",
          description: "O email pode ter sido enviado, mas houve um problema ao salvar o histórico. Verifique se o email chegou.",
          variant: "default",
        })
      } else {
        toast({
          title: "Erro ao enviar email",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-[#1a1a1a] border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Enviar Email</CardTitle>
        <CardDescription>Envie um email para um ou mais destinatários</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from">De (opcional)</Label>
            <Input
              id="from"
              type="email"
              placeholder="exemplo@dominio.com"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={isLoading}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <p className="text-xs text-gray-400">Deixe em branco para usar contato@elevecafe.com.br</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">Para *</Label>
            <Input
              id="to"
              type="text"
              placeholder="email@exemplo.com ou email1@exemplo.com, email2@exemplo.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={isLoading}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <p className="text-xs text-gray-400">Separe múltiplos emails por vírgula</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Assunto do email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLoading}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text">Mensagem *</Label>
            <Textarea
              id="text"
              placeholder="Digite a mensagem do email aqui..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
              className="min-h-[200px] bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSendEmail}
          disabled={isLoading || !to || !subject || !text}
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
              Enviar Email
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

