import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET() {
  try {
    const { data, error } = await supabase.from("users").select("id, name").eq("role", "fornecedor").order("name")

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error)
    return NextResponse.json({ error: "Erro ao buscar fornecedores" }, { status: 500 })
  }
}

