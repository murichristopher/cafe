"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Mail, Plus } from "lucide-react"
import Link from "next/link"
import { EmailSender } from "@/components/emails/email-sender"
import { EmailInbox } from "@/components/emails/email-inbox"
import { EmailReceived } from "@/components/emails/email-received"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function EmailsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isNewEmailOpen, setIsNewEmailOpen] = useState(false)

  const handleEmailSent = () => {
    setIsNewEmailOpen(false)
    // Atualizar lista de emails após envio
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).__emailInboxRefresh) {
        (window as any).__emailInboxRefresh()
      }
    }, 1000)
  }

  // Redirecionar para dashboard se não for admin
  if (user && user.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-yellow-400 hover:underline flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Dashboard
        </Link>
        <Button
          onClick={() => setIsNewEmailOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Email
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6 text-yellow-400" />
        <h1 className="text-2xl font-bold text-white">Gerenciamento de Emails</h1>
      </div>

      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="bg-zinc-900 border-zinc-800">
          <TabsTrigger value="sent" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
            Emails Enviados
          </TabsTrigger>
          <TabsTrigger value="received" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
            Emails Recebidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmailInbox />
          </motion.div>
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmailReceived />
          </motion.div>
        </TabsContent>
      </Tabs>

      <Dialog open={isNewEmailOpen} onOpenChange={setIsNewEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Novo Email</DialogTitle>
            <DialogDescription className="text-gray-400">
              Envie um email para um ou mais destinatários
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="space-y-4">
              <EmailSender onSuccess={handleEmailSent} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
