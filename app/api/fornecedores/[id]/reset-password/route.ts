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

    try {
      // 1. Verificar se o email existe no Supabase Auth
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (userError) {
        console.error("Erro ao listar usuários:", userError)
        return NextResponse.json({ 
          success: false, 
          error: userError.message,
          message: "Erro ao buscar informações de usuário" 
        }, { status: 500 })
      }

      // Encontrar o usuário pelo email
      const authUser = userData.users.find(u => u.email === email)
      
      if (!authUser) {
        console.error("Usuário não encontrado:", email)
        return NextResponse.json({ 
          success: false, 
          error: "Usuário não encontrado", 
          message: "Usuário não encontrado no sistema de autenticação"
        }, { status: 404 })
      }

      // 2. Usar a função RPC direta com SQL Raw para alterar a senha
      // Esta é uma abordagem mais direta que utiliza a API privilegiada do Supabase
      const { data, error } = await supabaseAdmin.rpc('alterar_senha_usuario', {
        p_email: email,
        p_senha: password
      })

      if (error) {
        console.error("Erro ao alterar senha via RPC:", error)
        
        // Tentativa alternativa usando a API Admin direta
        console.log("Tentando método alternativo com updateUserById...")
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { password: password }
        )
        
        if (updateError) {
          console.error("Erro no método alternativo também:", updateError)
          return NextResponse.json({ 
            success: false, 
            error: error.message,
            message: "Não foi possível alterar a senha do fornecedor"
          }, { status: 500 })
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Senha do fornecedor alterada com sucesso"
      })
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: "Erro ao processar a alteração de senha"
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