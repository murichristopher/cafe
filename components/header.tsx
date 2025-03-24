"use client"

import { useUser } from "@/lib/auth"
import ClientOnly from "./client-only"

export default function Header() {
  const { user, logout } = useUser()

  return (
    <header className="border-b bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Café da Manhã</h1>

        <ClientOnly>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={logout}
                  className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        </ClientOnly>
      </div>
    </header>
  )
}

