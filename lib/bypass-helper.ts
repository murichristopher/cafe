import { supabase } from "@/lib/supabase"

export async function bypassUpdateEvent(eventId: string, updates: any) {
  try {
    // Tentar primeira abordagem: Função RPC bypass
    const { error: rpcError } = await supabase.rpc("bypass_update_event", {
      p_event_id: eventId,
      p_updates: updates,
    })

    if (!rpcError) {
      console.log("Atualização via RPC bypass bem sucedida")
      return { success: true }
    }

    // Se falhar, tentar atualização direta
    const { error: updateError } = await supabase.from("events").update(updates).eq("id", eventId)

    if (!updateError) {
      console.log("Atualização direta bem sucedida")
      return { success: true }
    }

    // Se ainda falhar, tentar com cabeçalhos personalizados
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(updates),
    })

    if (response.ok) {
      console.log("Atualização via fetch bem sucedida")
      return { success: true }
    }

    throw new Error("Todas as tentativas de atualização falharam")
  } catch (error) {
    console.error("Erro no bypass:", error)
    return { success: false, error }
  }
}

