-- Script para corrigir o erro de tipo na coluna user_id das políticas RLS
-- Execute no SQL Editor do Supabase

-- 1. Verificar o tipo de dados atual da coluna user_id
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

-- 2. Remover políticas existentes para recriá-las com o tipo correto
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Administradores podem ver todas as notificações" ON public.notifications;
DROP POLICY IF EXISTS "Serviço pode gerenciar todas as notificações" ON public.notifications;

-- 3. Criar política para permitir que o serviço gerencie todas as notificações
-- Esta é a política mais importante para o funcionamento do sistema
CREATE POLICY "Serviço pode gerenciar todas as notificações" 
ON public.notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Recriar políticas com tratamento correto de tipo
-- Versão para user_id como UUID
CREATE POLICY "Usuários podem ver suas próprias notificações UUID" 
ON public.notifications
FOR SELECT 
USING (auth.uid()::uuid = user_id::uuid);

-- Versão alternativa para user_id como TEXT
CREATE POLICY "Usuários podem ver suas próprias notificações TEXT" 
ON public.notifications
FOR SELECT 
USING (auth.uid()::text = user_id::text);

-- 5. Políticas para inserção
-- Versão para user_id como UUID
CREATE POLICY "Usuários podem inserir suas próprias notificações UUID" 
ON public.notifications
FOR INSERT 
WITH CHECK (auth.uid()::uuid = user_id::uuid);

-- Versão alternativa para user_id como TEXT
CREATE POLICY "Usuários podem inserir suas próprias notificações TEXT" 
ON public.notifications
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- 6. Verificar que as políticas foram criadas corretamente
SELECT 
  tablename, 
  policyname
FROM 
  pg_policies
WHERE 
  tablename = 'notifications' 
  AND schemaname = 'public';

-- 7. Testar a inserção direta para verificar se está funcionando
INSERT INTO public.notifications (
  user_id, 
  title, 
  message, 
  type, 
  read
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Substitua por um ID de usuário válido
  'Teste RLS Corrigido',
  'Esta notificação testa a correção do RLS',
  'system',
  false
) RETURNING id;

-- NOTA: Se o erro persistir, pode ser necessário verificar a estrutura da tabela
-- ou alterar o tipo de dados da coluna user_id para compatibilizar. 