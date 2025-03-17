import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

// Função para fazer upload de uma imagem para o Supabase Storage
export async function uploadImage(file: File, eventId: string, type: string): Promise<string | null> {
  try {
    if (!file) return null

    // Criar um nome de arquivo único
    const fileExt = file.name.split(".").pop()
    const fileName = `${eventId}_${type}_${uuidv4()}.${fileExt}`
    const filePath = `eventos/${fileName}`

    // Fazer upload do arquivo
    const { error: uploadError } = await supabase.storage.from("imagens").upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error("Erro no upload:", uploadError)
      return null
    }

    // Obter a URL pública
    const { data } = supabase.storage.from("imagens").getPublicUrl(filePath)
    return data.publicUrl
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error)
    return null
  }
}

// Função para atualizar as imagens de um evento
export async function updateEventImages(
  eventId: string,
  images: {
    chegada?: File | null
    inicio?: File | null
    final?: File | null
  },
): Promise<boolean> {
  try {
    // Fazer upload das imagens
    const uploadPromises = []
    const imageUrls: { [key: string]: string | null } = {}

    if (images.chegada) {
      uploadPromises.push(
        uploadImage(images.chegada, eventId, "chegada").then((url) => {
          imageUrls.imagem_chegada = url
        }),
      )
    }

    if (images.inicio) {
      uploadPromises.push(
        uploadImage(images.inicio, eventId, "inicio").then((url) => {
          imageUrls.imagem_inicio = url
        }),
      )
    }

    if (images.final) {
      uploadPromises.push(
        uploadImage(images.final, eventId, "final").then((url) => {
          imageUrls.imagem_final = url
        }),
      )
    }

    // Aguardar todos os uploads
    await Promise.all(uploadPromises)

    // Se não houver URLs para atualizar, retornar sucesso
    if (Object.keys(imageUrls).length === 0) {
      return true
    }

    // Atualizar o evento com as URLs das imagens
    const { error } = await supabase.from("events").update(imageUrls).eq("id", eventId)

    if (error) {
      console.error("Erro ao atualizar evento:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao atualizar imagens:", error)
    return false
  }
}

