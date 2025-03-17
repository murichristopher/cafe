"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Calendar, Home, Settings, Users, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context" // Update this import

interface SidebarLinkProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}

function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href} className="relative">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start",
          isActive ? "bg-yellow-400 text-black" : "text-gray-300 hover:bg-zinc-800 hover:text-yellow-400",
        )}
      >
        {icon}
        <span className="ml-2">{children}</span>
      </Button>
      {isActive && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute inset-y-0 left-0 w-1 bg-yellow-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </Link>
  )
}

// Update the SidebarContent component to only show Fornecedores for admins
export function SidebarContent() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  return (
    <div className="flex h-full flex-col gap-2 p-4 bg-[#111111] text-white">
      <div className="flex items-center gap-2 px-2 py-4">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-nklcjetorMW8G4rLEz3oeIycg3uHlQ.png"
          alt="Eleve Café & Cia"
          width={32}
          height={32}
          className="rounded-full"
        />
        <span className="text-lg font-semibold">Eleve Café & Cia</span>
      </div>
      <div className="space-y-1">
        <SidebarLink href="/dashboard" icon={<Home className="h-5 w-5" />}>
          Dashboard
        </SidebarLink>
        <SidebarLink href="/dashboard/events" icon={<Calendar className="h-5 w-5" />}>
          Eventos
        </SidebarLink>
        {isAdmin && (
          <SidebarLink href="/dashboard/fornecedores" icon={<Users className="h-5 w-5" />}>
            Fornecedores
          </SidebarLink>
        )}
        {isAdmin && (
          <SidebarLink href="/dashboard/whatsapp" icon={<MessageSquare className="h-5 w-5" />}>
            Integração com WhatsApp
          </SidebarLink>
        )}
        <SidebarLink href="/dashboard/settings" icon={<Settings className="h-5 w-5" />}>
          Configurações
        </SidebarLink>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-zinc-800 bg-[#111111] md:block">
      <SidebarContent />
    </aside>
  )
}

