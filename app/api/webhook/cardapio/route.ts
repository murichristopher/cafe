import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Handler para OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

export async function POST(request: NextRequest) {
  console.log("[WEBHOOK] POST /api/webhook/cardapio - Recebendo cardápio")
  
  try {
    const payload = await request.json()
    console.log("[WEBHOOK] Payload recebido:", JSON.stringify(payload, null, 2))

    // Validar campos obrigatórios
    const {
      data,
      horarioInicio,
      horarioFim,
      quantidadeParticipantes,
      salgados,
      doces,
      bebidas,
      informacoesAdicionais,
      timestamp
    } = payload

    if (!data || !horarioInicio || !horarioFim || !quantidadeParticipantes) {
      console.error("[WEBHOOK] Campos obrigatórios faltando")
      return NextResponse.json(
        { error: "Campos obrigatórios faltando: data, horarioInicio, horarioFim, quantidadeParticipantes" },
        { 
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      )
    }

    // Inserir no banco de dados
    const { data: cardapioData, error: insertError } = await supabase
      .from("cardapios")
      .insert({
        data: data,
        horario_inicio: horarioInicio,
        horario_fim: horarioFim,
        quantidade_participantes: quantidadeParticipantes,
        salgados: salgados || [],
        doces: doces || [],
        bebidas: bebidas || {},
        informacoes_adicionais: informacoesAdicionais || null,
        timestamp: timestamp || new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error("[WEBHOOK] Erro ao inserir cardápio:", insertError)
      return NextResponse.json(
        { error: "Erro ao salvar cardápio", details: insertError.message },
        { 
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      )
    }

    console.log("[WEBHOOK] Cardápio salvo com sucesso:", cardapioData.id)
    return NextResponse.json(
      { 
        success: true, 
        id: cardapioData.id,
        message: "Cardápio recebido e salvo com sucesso"
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    )
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar webhook:", error)
    return NextResponse.json(
      { error: "Erro ao processar webhook", details: error instanceof Error ? error.message : "Erro desconhecido" },
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    )
  }
}

// Permitir GET para verificação de saúde do endpoint
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Webhook de cardápio está funcionando",
    endpoint: "/api/webhook/cardapio"
  })
}

