import { supabase } from "@/lib/supabase"

export async function deleteEvent(eventId: string) {
  try {
    // Primeiro, tentar excluir as imagens associadas ao evento
    const { data: eventData } = await supabase
      .from("events")
      .select("event_image, imagem_chegada, imagem_inicio, imagem_final")
      .eq("id", eventId)
      .single()

    if (eventData) {
      // Coletar todas as imagens para excluir
      const imagesToDelete = [
        eventData.event_image,
        eventData.imagem_chegada,
        eventData.imagem_inicio,
        eventData.imagem_final,
      ].filter(Boolean) // Remove nulls/undefined

      // Se houver imagens, tentar excluí-las do storage
      if (imagesToDelete.length > 0) {
        for (const imageUrl of imagesToDelete) {
          try {
            // Extrair o caminho do arquivo da URL
            const filePath = imageUrl.split("/").slice(-2).join("/")
            await supabase.storage.from("imagens").remove([filePath])
          } catch (error) {
            console.error("Erro ao excluir imagem:", error)
            // Continuar mesmo se houver erro ao excluir imagens
          }
        }
      }
    }

    // Excluir o evento
    const { error } = await supabase.from("events").delete().eq("id", eventId)

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Erro ao excluir evento:", error)
    return {
      success: false,
      error: error.message || "Ocorreu um erro ao excluir o evento",
    }
  }
}

