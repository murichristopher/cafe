"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, RefreshCw, Loader2, Inbox, Clock, User, Reply, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Email {
  id: string
  from: string
  to: string | string[]
  subject?: string
  created_at?: string
}

interface EmailDetail {
  id: string
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  created_at: string
}

export function EmailReceived() {
  const [emails, setEmails] = useState<Email[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyTo, setReplyTo] = useState("")
  const [replySubject, setReplySubject] = useState("")
  const [replyText, setReplyText] = useState("")
  const [isSendingReply, setIsSendingReply] = useState(false)
  const { toast } = useToast()

  const fetchEmails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/emails/received")
      const data = await response.json()

      if (data.success) {
        setEmails(data.emails || [])
      } else {
        toast({
          title: "Erro ao carregar emails",
          description: data.error || "Ocorreu um erro ao carregar os emails recebidos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar emails recebidos:", error)
      toast({
        title: "Erro ao carregar emails",
        description: "Ocorreu um erro ao carregar os emails recebidos. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmailDetail = async (emailId: string) => {
    setIsLoadingDetail(true)
    try {
      const response = await fetch(`/api/emails/received/${emailId}`)
      const data = await response.json()

      if (data.success && data.email) {
        setSelectedEmail({
          id: data.email.id,
          from: data.email.from || "",
          to: data.email.to || [],
          subject: data.email.subject || "Sem assunto",
          html: data.email.html,
          text: data.email.text,
          created_at: data.email.created_at,
        })
        setIsDialogOpen(true)
      } else {
        toast({
          title: "Erro ao carregar email",
          description: data.error || "Não foi possível carregar o conteúdo do email.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do email:", error)
      toast({
        title: "Erro ao carregar email",
        description: "Ocorreu um erro ao carregar o conteúdo do email.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDetail(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__emailReceivedRefresh = fetchEmails
    }
  }, [])

  const handleViewEmail = (email: Email) => {
    fetchEmailDetail(email.id)
  }

  const handleReply = () => {
    if (selectedEmail) {
      setReplyTo(selectedEmail.from)
      setReplySubject(selectedEmail.subject.startsWith("Re: ") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`)
      setReplyText("")
      setIsReplying(true)
    }
  }

  const handleSendReply = async () => {
    if (!replyTo || !replySubject || !replyText) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    setIsSendingReply(true)
    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: replyTo,
          subject: replySubject,
          text: replyText,
          from: undefined, // Usa o padrão
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao enviar resposta")
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Resposta enviada",
          description: "Sua resposta foi enviada com sucesso.",
        })
        setIsReplying(false)
        setReplyTo("")
        setReplySubject("")
        setReplyText("")
      } else {
        toast({
          title: "Erro ao enviar resposta",
          description: data.error || "Ocorreu um erro ao enviar a resposta.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar resposta:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Ocorreu um erro ao enviar a resposta. Tente novamente."
      
      toast({
        title: "Erro ao enviar resposta",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleCancelReply = () => {
    setIsReplying(false)
    setReplyTo("")
    setReplySubject("")
    setReplyText("")
  }

  const getTimeDisplay = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    }
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] bg-[#1a1a1a] border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <Inbox className="h-5 w-5 text-yellow-400" />
          <div>
            <h2 className="text-white font-semibold">Emails Recebidos</h2>
            <p className="text-xs text-gray-400">{emails.length} {emails.length === 1 ? 'email' : 'emails'}</p>
          </div>
        </div>
        <Button
          onClick={fetchEmails}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="border-zinc-700"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Email List */}
      <ScrollArea className="flex-1">
        {isLoading && emails.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum email recebido encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {emails.map((email) => {
              const toArray = Array.isArray(email.to) ? email.to : email.to ? [email.to] : []
              const primaryRecipient = toArray[0] || ""

              return (
                <div
                  key={email.id}
                  className="p-4 hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  onClick={() => handleViewEmail(email)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                      <Inbox className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {email.from || "Desconhecido"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 font-medium truncate mb-1">
                        {email.subject || "Sem assunto"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {primaryRecipient}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeDisplay(email.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewEmail(email)
                        }}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        Abrir
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Email Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-zinc-800">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
            </div>
          ) : selectedEmail ? (
            <>
              <DialogHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-white text-xl">{selectedEmail.subject}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 min-w-[60px]">De:</span>
                          <span className="text-white">{selectedEmail.from}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 min-w-[60px]">Para:</span>
                          <span className="text-white">
                            {Array.isArray(selectedEmail.to) ? selectedEmail.to.join(", ") : selectedEmail.to}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 min-w-[60px]">Data:</span>
                          <span className="text-white">
                            {format(new Date(selectedEmail.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </DialogDescription>
                  </div>
                  <Button
                    onClick={handleReply}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    disabled={isReplying}
                  >
                    <Reply className="mr-2 h-4 w-4" />
                    Responder
                  </Button>
                </div>
              </DialogHeader>
              <Separator className="bg-zinc-800" />
              
              {isReplying ? (
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reply-to" className="text-white">Para</Label>
                    <Input
                      id="reply-to"
                      type="email"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      disabled={isSendingReply}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reply-subject" className="text-white">Assunto</Label>
                    <Input
                      id="reply-subject"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      disabled={isSendingReply}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reply-text" className="text-white">Mensagem</Label>
                    <Textarea
                      id="reply-text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={isSendingReply}
                      className="min-h-[200px] bg-zinc-800 border-zinc-700 text-white"
                      placeholder="Digite sua resposta aqui..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={handleCancelReply}
                      variant="outline"
                      disabled={isSendingReply}
                      className="border-zinc-700"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSendReply}
                      disabled={isSendingReply || !replyTo || !replySubject || !replyText}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    >
                      {isSendingReply ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Resposta
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  {selectedEmail.html ? (
                    <div
                      className="prose prose-invert max-w-none bg-zinc-900 p-6 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                    />
                  ) : selectedEmail.text ? (
                    <div className="bg-zinc-900 p-6 rounded-lg whitespace-pre-wrap text-white">
                      {selectedEmail.text}
                    </div>
                  ) : (
                    <p className="text-gray-400">Sem conteúdo disponível</p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
