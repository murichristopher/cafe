"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"
import { WhatsAppStatusCard } from "@/components/whatsapp/status-card"
import { WhatsAppQRCodeCard } from "@/components/whatsapp/qr-code-card"
import { WhatsAppMessageSender } from "@/components/whatsapp/message-sender"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function WhatsAppIntegrationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)

  // Redirecionar para dashboard se não for admin
  if (user && user.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-yellow-400 hover:underline flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Dashboard
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-yellow-400" />
        <h1 className="text-2xl font-bold">Integração com WhatsApp</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <WhatsAppStatusCard onStatusChange={setIsConnected} />
        </motion.div>

        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <WhatsAppQRCodeCard />
          </motion.div>
        )}
      </div>

      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <WhatsAppMessageSender />
        </motion.div>
      )}
    </div>
  )
}

