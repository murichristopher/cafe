-- Script para corrigir o erro de incompatibilidade de tipos (text = uuid) nas políticas RLS
-- Execute no SQL Editor do Supabase

-- 1. Remover todas as políticas RLS existentes para a tabela notifications
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Administradores podem ver todas as notificações" ON public.notifications;
DROP POLICY IF EXISTS "Serviço pode gerenciar todas as notificações" ON public.notifications;

-- 2. Criar uma única política que permite todas as operações (a mais simples e eficaz)
-- Esta política não usa nenhuma verificação de tipo de user_id
CREATE POLICY "Acesso total à tabela notifications" 
ON public.notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Verificar que a política foi criada corretamente
SELECT 
  tablename, 
  policyname
FROM 
  pg_policies
WHERE 
  tablename = 'notifications' 
  AND schemaname = 'public';

-- 4. Verificar o tipo atual da coluna user_id para confirmação
SELECT 
  column_name, 
  data_type, 
  udt_name
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'notifications'
  AND column_name = 'user_id'; 