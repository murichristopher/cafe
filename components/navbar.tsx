"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Bell, LogOut, Menu, User, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context" // Update this import
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarContent } from "@/components/sidebar"
import Image from "next/image"

export function Navbar() {
  const { signOut, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  // Atualizar a função handleSignOut para garantir que ela funcione corretamente
  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirecionar para a página inicial após logout
      router.push("/")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  return (
    <header className="border-b border-zinc-800 bg-[#111111] text-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:text-yellow-400">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-zinc-900">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-nklcjetorMW8G4rLEz3oeIycg3uHlQ.png"
              alt="Eleve Café & Cia"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-lg font-semibold hidden md:inline-block">{user?.name || "Eleve Café & Cia"}</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            className="hover:text-yellow-400"
          >
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Atualizar página</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:text-yellow-400">
                <Bell className="h-5 w-5" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <div className="flex items-start gap-4 p-4 hover:bg-muted">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Novo evento criado</p>
                    <p className="text-xs text-muted-foreground">Café da Manhã Especial foi criado</p>
                    <p className="mt-1 text-xs text-muted-foreground">Há 5 minutos</p>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:text-yellow-400">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

