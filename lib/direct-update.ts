import { supabase } from "@/lib/supabase"

// Função que usa uma abordagem mais direta para atualizar apenas os campos de imagem
export async function directImageUpdate(
  eventId: string,
  imageData: {
    imagem_chegada?: string | null
    imagem_inicio?: string | null
    imagem_final?: string | null
  },
) {
  try {
    console.log(`Tentando atualização direta para o evento ${eventId}:`, imageData)

    // Construir a query SQL diretamente
    // Isso pode contornar algumas restrições de RLS em certos casos
    const { data, error } = await supabase.rpc("update_event_images", {
      p_event_id: eventId,
      p_imagem_chegada: imageData.imagem_chegada,
      p_imagem_inicio: imageData.imagem_inicio,
      p_imagem_final: imageData.imagem_final,
    })

    if (error) {
      console.error("Erro na atualização direta:", error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error("Erro na atualização direta:", error)
    return { success: false, error }
  }
}

