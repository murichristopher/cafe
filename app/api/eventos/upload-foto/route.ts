import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as Blob | null
    const eventId = formData.get("event_id") as string | null

    if (!file || !eventId) {
      return NextResponse.json({ error: "Arquivo e event_id são obrigatórios" }, { status: 400 })
    }

    const fileName = `registros/${eventId}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from("imagens")
      .upload(fileName, file, { contentType: "image/jpeg", upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from("imagens")
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
