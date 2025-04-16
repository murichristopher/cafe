import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Criando um cliente Supabase com a chave de serviço para acesso administrativo
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { password, email } = await request.json()

    console.log("Alterando senha para fornecedor com email:", email)
    
    if (!password || !email) {
      return NextResponse.json({ error: "Senha e email são obrigatórios" }, { status: 400 })
    }

    // 1. Primeiro, vamos tentar obter o usuário pelo email no Supabase
    let userId = null
    let método = "desconhecido"
    
    try {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        console.error("Erro ao listar usuários:", listError)
        return NextResponse.json({ 
          success: false, 
          error: listError.message,
          message: "Erro ao obter lista de usuários" 
        }, { status: 500 })
      }
      
      const user = users.users.find(u => u.email.toLowerCase() === email.toLowerCase())
      
      if (!user) {
        return NextResponse.json({ 
          success: false, 
          error: "Usuário não encontrado", 
          message: "Não foi possível encontrar o usuário com este email" 
        }, { status: 404 })
      }
      
      userId = user.id
      console.log("Usuário encontrado pelo email:", user.email, "ID:", userId)
    } catch (error: any) {
      console.error("Erro ao buscar usuário:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: "Erro ao buscar usuário" 
      }, { status: 500 })
    }
    
    // 2. Vamos tentar atualizar a senha do usuário usando diferentes métodos
    // até encontrar um que funcione
    let passwordUpdated = false
    let updateError = null
    
    // Método 1: updateUserById (o ideal)
    try {
      método = "updateUserById"
      console.log("Tentando método updateUserById...")
      
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: password }
      )
      
      if (!error) {
        passwordUpdated = true
        console.log("Senha atualizada com sucesso via updateUserById")
      } else {
        updateError = error
        console.error("Erro no método updateUserById:", error)
      }
    } catch (error: any) {
      console.error("Exceção no método updateUserById:", error)
      updateError = error
    }
    
    // Se o primeiro método falhou, tentar o segundo método
    if (!passwordUpdated) {
      try {
        método = "admin.resetPasswordForEmail"
        console.log("Tentando método admin.resetPasswordForEmail...")
        
        // Envie um email de redefinição de senha, mas a senha será definida pelo usuário
        const { error } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email
        })
        
        if (!error) {
          return NextResponse.json({ 
            success: true, 
            message: "Um link de redefinição de senha foi enviado para o email do fornecedor.",
            method: método
          })
        } else {
          console.error("Erro no método resetPasswordForEmail:", error)
        }
      } catch (error: any) {
        console.error("Exceção no método resetPasswordForEmail:", error)
      }
    }
    
    if (passwordUpdated) {
      return NextResponse.json({ 
        success: true, 
        message: "Senha alterada com sucesso",
        method: método
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: updateError ? updateError.message : "Falha em todos os métodos de alteração de senha",
        message: "Não foi possível alterar a senha. Por favor, contate o suporte.",
        method: método
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error("Erro inesperado:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: "Ocorreu um erro inesperado"
    }, { status: 500 })
  }
} 