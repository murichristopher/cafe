import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: "Email e senha são obrigatórios" 
      }, { status: 400 })
    }

    console.log("Testando login para:", email)
    
    // Tenta realizar o login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      console.error("Erro de login:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        status: error.status,
        code: error.code
      }, { status: 401 })
    }

    // Login bem-sucedido, mas não salvamos sessão
    await supabase.auth.signOut()
    
    return NextResponse.json({
      success: true,
      message: "Login bem-sucedido",
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    })
  } catch (error: any) {
    console.error("Erro ao testar login:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Erro inesperado" 
    }, { status: 500 })
  }
} 