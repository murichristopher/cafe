-- Script SQL simplificado para corrigir RLS da tabela notifications
-- Execute no SQL Editor do Supabase

-- Ativar RLS na tabela (essencial para segurança)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (para evitar conflitos)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias notificações" ON public.notifications; 
DROP POLICY IF EXISTS "Serviço pode gerenciar todas as notificações" ON public.notifications;

-- Criar política para permitir que o serviço faça tudo
-- Esta é a política mais importante para que a API do backend possa
-- criar notificações para qualquer usuário
CREATE POLICY "Serviço pode gerenciar todas as notificações" 
ON public.notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- Criar política para usuários verem suas próprias notificações
CREATE POLICY "Usuários podem ver suas próprias notificações" 
ON public.notifications
FOR SELECT 
USING (auth.uid()::text = user_id);

-- Criar política para usuários inserir suas próprias notificações
CREATE POLICY "Usuários podem inserir suas próprias notificações" 
ON public.notifications
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id); 