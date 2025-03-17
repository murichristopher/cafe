import { supabase } from "@/lib/supabase"

// Função específica para atualizar apenas os campos de imagem de um evento
export async function updateEventImages(
  eventId: string,
  imageData: {
    imagem_chegada?: string | null
    imagem_inicio?: string | null
    imagem_final?: string | null
  },
) {
  try {
    console.log(`Atualizando imagens para o evento ${eventId}:`, imageData)

    // Usar uma abordagem diferente para atualizar apenas os campos de imagem
    // Criando um objeto que contém apenas os campos que queremos atualizar
    const updateFields: any = {}

    if ("imagem_chegada" in imageData) {
      updateFields.imagem_chegada = imageData.imagem_chegada
    }

    if ("imagem_inicio" in imageData) {
      updateFields.imagem_inicio = imageData.imagem_inicio
    }

    if ("imagem_final" in imageData) {
      updateFields.imagem_final = imageData.imagem_final
    }

    console.log("Campos a serem atualizados:", updateFields)

    // Usar uma abordagem mais direta com RPC se necessário
    // Isso pode contornar as políticas RLS se estiverem causando problemas
    const { data, error } = await supabase.from("events").update(updateFields).eq("id", eventId).select()

    if (error) {
      console.error("Erro ao atualizar imagens do evento:", error)
      throw error
    }

    console.log("Imagens atualizadas com sucesso:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Erro inesperado ao atualizar imagens:", error)
    return { success: false, error }
  }
}

