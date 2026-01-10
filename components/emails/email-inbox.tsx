"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, RefreshCw, Loader2, Paperclip, Clock, User, Send } from "lucide-react"
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

interface Email {
  id: string
  from?: string
  to?: string | string[]
  subject?: string
  created_at?: string
  last_event?: string
}

interface EmailDetail {
  id: string
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  created_at: string
  last_event?: string
}

export function EmailInbox() {
  const [emails, setEmails] = useState<Email[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const { toast } = useToast()

  const fetchEmails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/emails/sent")
      const data = await response.json()

      if (data.success) {
        setEmails(data.emails || [])
      } else {
        toast({
          title: "Erro ao carregar emails",
          description: data.error || "Ocorreu um erro ao carregar os emails.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar emails:", error)
      toast({
        title: "Erro ao carregar emails",
        description: "Ocorreu um erro ao carregar os emails. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmailDetail = async (emailId: string) => {
    setIsLoadingDetail(true)
    try {
      const response = await fetch(`/api/emails/sent/${emailId}`)
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
          last_event: data.email.last_event,
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
      (window as any).__emailInboxRefresh = fetchEmails
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sent: "default",
      delivered: "secondary",
      bounced: "destructive",
      failed: "destructive",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="text-xs">
        {status}
      </Badge>
    )
  }

  const handleViewEmail = (email: Email) => {
    fetchEmailDetail(email.id)
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
          <Mail className="h-5 w-5 text-yellow-400" />
          <div>
            <h2 className="text-white font-semibold">Emails Enviados</h2>
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
            <p>Nenhum email encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {emails.map((email) => {
              const toArray = Array.isArray(email.to) ? email.to : email.to ? [email.to] : []
              const primaryRecipient = toArray[0] || ""
              const hasMoreRecipients = toArray.length > 1

              return (
                <div
                  key={email.id}
                  className="p-4 hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                  onClick={() => handleViewEmail(email)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      <Send className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {primaryRecipient}
                          {hasMoreRecipients && ` +${toArray.length - 1}`}
                        </span>
                        {email.last_event && getStatusBadge(email.last_event)}
                      </div>
                      <p className="text-sm text-gray-300 font-medium truncate mb-1">
                        {email.subject || "Sem assunto"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {email.from || "Desconhecido"}
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
                    {selectedEmail.last_event && (
                      <div className="pt-2">
                        {getStatusBadge(selectedEmail.last_event)}
                      </div>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <Separator className="bg-zinc-800" />
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
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
