import { supabase } from "@/lib/supabase"

/**
 * Insere um usuário diretamente no banco de dados usando uma função RPC
 * @param userId ID do usuário
 * @param email Email do usuário
 * @param name Nome do usuário
 * @param role Papel do usuário
 * @param phoneNumber Número de telefone do usuário
 * @returns true se a inserção foi bem-sucedida, false caso contrário
 */
export async function insertUserDirectly(
  userId: string,
  email: string,
  name: string,
  role: "admin" | "fornecedor",
  phoneNumber: string,
): Promise<boolean> {
  try {
    // Tenta usar a função RPC create_user
    const { error } = await supabase.rpc("create_user", {
      p_id: userId,
      p_email: email,
      p_name: name,
      p_role: role,
      p_phone: phoneNumber,
    })

    if (error) {
      console.error("Erro ao inserir usuário via RPC:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro inesperado ao inserir usuário:", error)
    return false
  }
}

