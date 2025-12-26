"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
// Importe o ícone MessageSquare do lucide-react
import { Calendar, Home, MessageSquare, Settings, Users, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

// Atualize a função MobileNav para incluir o novo link
export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Se não houver usuário, não renderizar a navegação
  if (!user) return null

  const isAdmin = user.role === "admin"

  // Define navigation items based on user role
  const navItems = [
    {
      href: "/dashboard",
      icon: Home,
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/events",
      icon: Calendar,
      label: "Eventos",
      active: pathname.startsWith("/dashboard/events"),
    },
    // Only show the "Fornecedores" tab to administrators
    ...(isAdmin
      ? [
          {
            href: "/dashboard/fornecedores",
            icon: Users,
            label: "Fornecedores",
            active: pathname.startsWith("/dashboard/fornecedores"),
          },
        ]
      : []),
    // Only show the "Estoque" tab to administrators
    ...(isAdmin
      ? [
          {
            href: "/dashboard/estoque",
            icon: Package,
            label: "Estoque",
            active: pathname.startsWith("/dashboard/estoque"),
          },
        ]
      : []),
    // Only show the "WhatsApp" tab to administrators
    ...(isAdmin
      ? [
          {
            href: "/dashboard/whatsapp",
            icon: MessageSquare,
            label: "WhatsApp",
            active: pathname.startsWith("/dashboard/whatsapp"),
          },
        ]
      : []),
    {
      href: "/dashboard/settings",
      icon: Settings,
      label: "Config",
      active: pathname.startsWith("/dashboard/settings"),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-800 bg-[#111111] md:hidden">
      <div className={`grid h-16 ${isAdmin ? "grid-cols-6" : "grid-cols-3"} px-2`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
              item.active ? "text-yellow-400" : "text-gray-400 hover:text-gray-300",
            )}
          >
            <item.icon className={cn("h-5 w-5", item.active ? "text-yellow-400" : "text-gray-400")} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

