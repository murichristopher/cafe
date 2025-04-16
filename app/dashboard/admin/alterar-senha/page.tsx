"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AlterarSenhaGuidePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Guia para Alteração de Senha de Fornecedores</h1>
      
      <Alert className="mb-6 border-amber-500 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-500">Importante</AlertTitle>
        <AlertDescription>
          Como a alteração direta de senha pelo administrador não está funcionando, a solução 
          é enviar um link de redefinição para o fornecedor.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-6 md:grid-cols-1">
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardHeader>
            <CardTitle>Passo 1: Informe ao Fornecedor</CardTitle>
            <CardDescription>
              Comunique ao fornecedor que ele receberá um email para redefinir sua senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 mb-4">
              Informe ao fornecedor que ele deve verificar sua caixa de entrada, incluindo a pasta de spam, 
              pois receberá um email para redefinir sua senha.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardHeader>
            <CardTitle>Passo 2: Acesse a página de redefinição</CardTitle>
            <CardDescription>
              Você precisa acessar a página de redefinição de senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 mb-4">
              Acesse a página de redefinição de senha clicando no botão abaixo. 
              Digite o email do fornecedor para enviar o link de redefinição.
            </p>
            <Button asChild className="bg-amber-500 hover:bg-amber-600">
              <Link href="/reset-password">
                Ir para redefinição de senha <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardHeader>
            <CardTitle>Passo 3: O Fornecedor recebe o email</CardTitle>
            <CardDescription>
              O fornecedor receberá um email com instruções
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 mb-4">
              O sistema enviará automaticamente um email com um link de redefinição de senha.
              O fornecedor deverá clicar nesse link e definir sua nova senha.
            </p>
            <Alert className="border-blue-500 bg-blue-500/10">
              <AlertDescription className="text-blue-400">
                <strong>Dica:</strong> Se o fornecedor não encontrar o email, peça para verificar a pasta de spam 
                ou lixo eletrônico. Se necessário, repita o processo para enviar um novo link.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1a1a1a] border-zinc-800">
          <CardHeader>
            <CardTitle>Passo 4: Confirmação da nova senha</CardTitle>
            <CardDescription>
              O fornecedor definirá sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 mb-4">
              Após clicar no link, o fornecedor será direcionado para uma página onde poderá definir 
              sua nova senha. Após confirmar, ele será redirecionado para a página de login.
            </p>
            <Alert className="border-green-500 bg-green-500/10">
              <AlertDescription className="text-green-400">
                <strong>Pronto!</strong> O fornecedor já pode fazer login com sua nova senha.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 