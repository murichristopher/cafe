import { supabase } from "@/lib/supabase"

/**
 * Verifica se um usuário existe na tabela users
 * @param userId ID do usuário
 * @returns true se o usuário existe, false caso contrário
 */
export async function checkUserExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("users").select("id").eq("id", userId).single()

  if (error) {
    console.error("Erro ao verificar usuário:", error)
    return false
  }

  return !!data
}

/**
 * Verifica se um usuário tem um número de telefone na tabela users
 * @param userId ID do usuário
 * @returns O número de telefone ou null se não existir
 */
export async function getUserPhoneNumber(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from("users").select("phone_number").eq("id", userId).single()

  if (error) {
    console.error("Erro ao buscar número de telefone:", error)
    return null
  }

  return data?.phone_number || null
}

/**
 * Atualiza o número de telefone de um usuário
 * @param userId ID do usuário
 * @param phoneNumber Número de telefone
 * @returns true se a atualização foi bem-sucedida, false caso contrário
 */
export async function updateUserPhoneNumber(userId: string, phoneNumber: string): Promise<boolean> {
  const { error } = await supabase.from("users").update({ phone_number: phoneNumber }).eq("id", userId)

  if (error) {
    console.error("Erro ao atualizar número de telefone:", error)
    return false
  }

  return true
}

