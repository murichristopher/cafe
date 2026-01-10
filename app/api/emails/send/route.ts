import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-service"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, text, from, replyTo, cc, bcc } = body

    // Validar dados obrigatórios
    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: "Campos 'to' e 'subject' são obrigatórios" },
        { status: 400 }
      )
    }

    // Obter usuário autenticado via cookies (opcional, não bloquear se falhar)
    let userId: string | null = null
    try {
      const cookieStore = await cookies()
      const accessToken = cookieStore.get("sb-access-token")?.value || 
                         cookieStore.get("supabase-auth-token")?.value

      if (accessToken) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        })
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null
      }
    } catch (authError) {
      console.error("[API] Erro ao obter usuário (não crítico):", authError)
      // Continuar mesmo sem userId
    }

    // Enviar email via Resend
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      from,
      replyTo,
      cc,
      bcc,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    // Salvar email no banco de dados (não bloquear se der erro)
    // Se a tabela não existir ou houver qualquer erro, apenas logar mas sempre retornar sucesso
    // pois o email já foi enviado com sucesso
    const saveToDatabase = async () => {
      try {
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
        const toArray = Array.isArray(to) ? to : [to]
        const fromEmail = from || "contato@elevecafe.com.br"
        // Extrair apenas o email se vier no formato "Nome <email>"
        const cleanFromEmail = fromEmail.includes("<") 
          ? fromEmail.match(/<(.+)>/)?.[1] || fromEmail 
          : fromEmail

        const { error: dbError } = await supabaseClient
          .from("emails")
          .insert({
            resend_id: result.id,
            from_email: cleanFromEmail,
            to_email: toArray,
            subject,
            html_content: html,
            text_content: text,
            status: "sent",
            created_by: userId,
          })

        if (dbError) {
          console.error("[API] Erro ao salvar email no banco (não crítico):", dbError.message)
        }
      } catch (dbError: any) {
        console.error("[API] Erro ao salvar email no banco (não crítico):", dbError?.message || dbError)
      }
    }

    // Executar salvamento em background, não esperar
    saveToDatabase().catch(() => {
      // Ignorar erros silenciosamente
    })

    // Sempre retornar sucesso se o email foi enviado
    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Email enviado com sucesso",
    })
  } catch (error) {
    console.error("[API] Erro ao enviar email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar email",
      },
      { status: 500 }
    )
  }
}

