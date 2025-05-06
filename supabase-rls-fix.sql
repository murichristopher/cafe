-- Script para correção de problemas de RLS (Row Level Security) na tabela notifications
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se RLS está ativo para a tabela notifications (usando o catálogo do sistema PostgreSQL)
SELECT 
  n.nspname AS schema,
  c.relname AS tabela,
  c.relrowsecurity AS rls_ativo
FROM pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'notifications';

-- 2. Habilitar RLS na tabela notifications (caso não esteja habilitado)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes (para recriá-las corretamente)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notificações" ON public.notifications;
DROP POLICY IF EXISTS "Administradores podem ver todas as notificações" ON public.notifications;
DROP POLICY IF EXISTS "Serviço pode gerenciar todas as notificações" ON public.notifications;

-- 4. Criar política para permitir que usuários vejam suas próprias notificações
CREATE POLICY "Usuários podem ver suas próprias notificações" 
ON public.notifications
FOR SELECT 
USING (auth.uid()::text = user_id);

-- 5. Criar política para permitir que usuários insiram suas próprias notificações
CREATE POLICY "Usuários podem inserir suas próprias notificações" 
ON public.notifications
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- 6. Criar política para permitir que usuários atualizem suas próprias notificações
CREATE POLICY "Usuários podem atualizar suas próprias notificações" 
ON public.notifications
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- 7. Criar política para permitir que o serviço gerencie todas as notificações
-- Esta política é importante para que os endpoints de API possam criar notificações para qualquer usuário
CREATE POLICY "Serviço pode gerenciar todas as notificações" 
ON public.notifications
USING (true)
WITH CHECK (true);

-- 8. Política para administradores verem todas as notificações (opcional)
CREATE POLICY "Administradores podem ver todas as notificações" 
ON public.notifications
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()::text
    AND users.role = 'admin'
  )
);

-- 9. Verificar que as políticas foram criadas corretamente
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE tablename = 'notifications' AND schemaname = 'public';

-- NOTA IMPORTANTE: 
-- Se você estiver usando o token anônimo do Supabase para operações de backend,
-- e as políticas acima não resolverem o problema, pode ser necessário
-- desativar temporariamente o RLS para depuração:

-- ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Lembre-se de reativar após a depuração!
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY; 