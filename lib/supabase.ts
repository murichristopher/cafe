import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types"

// Obter as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis de ambiente estão definidas e são válidas
if (!supabaseUrl) {
  console.error("NEXT_PUBLIC_SUPABASE_URL não está definida")
  // Fornecer uma URL padrão para evitar erros de renderização
  // Isso permitirá que a aplicação carregue, mas as operações do Supabase falharão
  // até que a URL correta seja configurada
}

if (!supabaseAnonKey) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida")
}

// Verificar se a URL é válida
let isValidUrl = false
try {
  // Tenta criar um objeto URL para validar
  new URL(supabaseUrl || "")
  isValidUrl = true
} catch (error) {
  console.error("NEXT_PUBLIC_SUPABASE_URL não é uma URL válida:", error)
}

// Criar cliente Supabase com verificação de tipo
// Usamos uma URL válida padrão se a URL fornecida não for válida
// Isso permitirá que a aplicação carregue, mas as operações do Supabase falharão
export const supabase = createClient<Database>(
  isValidUrl ? supabaseUrl! : "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-key",
)

// Função auxiliar para verificar se o Supabase está configurado corretamente
export function isSupabaseConfigured(): boolean {
  return isValidUrl && !!supabaseAnonKey
}

// Função auxiliar para verificar a conectividade com o Supabase
export async function checkSupabaseConnectivity(): Promise<boolean> {
  try {
    // Definir um timeout para a operação
    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout ao verificar conectividade")), 5000),
    )

    // Tentar fazer uma consulta simples
    const queryPromise = supabase.from("users").select("count").limit(1)

    // Usar Promise.race para limitar o tempo de espera
    const { error } = await Promise.race([queryPromise, timeoutPromise])

    if (error) {
      console.error("Erro ao verificar conectividade:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao verificar conectividade:", error)
    return false
  }
}

// Função para tentar reconectar ao Supabase com retry
export async function retrySupabaseConnection(maxRetries = 3): Promise<boolean> {
  let retries = 0

  while (retries < maxRetries) {
    try {
      const isConnected = await checkSupabaseConnectivity()
      if (isConnected) {
        return true
      }

      // Esperar um tempo antes de tentar novamente (backoff exponencial)
      const waitTime = Math.pow(2, retries) * 1000
      await new Promise((resolve) => setTimeout(resolve, waitTime))

      retries++
    } catch (error) {
      console.error(`Erro na tentativa ${retries + 1} de reconexão:`, error)
      retries++
    }
  }

  return false
}

