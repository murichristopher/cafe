-- Script para diagnosticar e corrigir problemas com a tabela notifications
-- Execute no SQL Editor do Supabase

-- 1. Verificar a estrutura da tabela notifications
SELECT 
  column_name, 
  data_type, 
  udt_name
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- 2. Resolver incompatibilidade entre UUID e TEXT para a coluna user_id
-- IMPORTANTE: Execute apenas UMA das alternativas abaixo, dependendo do seu caso

-- ALTERNATIVA A: Modificar a coluna user_id para UUID se ela for TEXT
-- DO $$ 
-- BEGIN
--   IF EXISTS (
--     SELECT FROM information_schema.columns
--     WHERE table_schema = 'public'
--     AND table_name = 'notifications'
--     AND column_name = 'user_id'
--     AND data_type = 'text'
--   ) THEN
--     ALTER TABLE public.notifications ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
--     RAISE NOTICE 'Coluna user_id alterada para UUID';
--   ELSE
--     RAISE NOTICE 'Coluna user_id não é do tipo TEXT ou não existe';
--   END IF;
-- END $$;

-- ALTERNATIVA B: Modificar a coluna user_id para TEXT se ela for UUID
-- DO $$ 
-- BEGIN
--   IF EXISTS (
--     SELECT FROM information_schema.columns
--     WHERE table_schema = 'public'
--     AND table_name = 'notifications'
--     AND column_name = 'user_id'
--     AND data_type = 'uuid'
--   ) THEN
--     ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT;
--     RAISE NOTICE 'Coluna user_id alterada para TEXT';
--   ELSE
--     RAISE NOTICE 'Coluna user_id não é do tipo UUID ou não existe';
--   END IF;
-- END $$;

-- 3. Verificar se o RLS está habilitado
SELECT 
  c.relname AS table_name,
  CASE WHEN c.relrowsecurity THEN 'enabled' ELSE 'disabled' END AS rls_status
FROM 
  pg_class c
JOIN 
  pg_namespace n ON n.oid = c.relnamespace
WHERE 
  n.nspname = 'public' 
  AND c.relname = 'notifications';

-- 4. Ativar RLS na tabela
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Limpar todas as políticas existentes
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.notifications;', E'\n')
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications'
  );
END $$;

-- 6. Criar nova política principal para o serviço (esta é a mais importante)
-- Esta política permite que o serviço backend crie notificações para qualquer usuário
CREATE POLICY "backend-service-all" 
ON public.notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Verificar todas as políticas criadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM 
  pg_policies
WHERE 
  schemaname = 'public' 
  AND tablename = 'notifications';

-- 8. Contar registros na tabela para verificar o estado atual
SELECT COUNT(*) AS total_notificacoes FROM public.notifications;

-- 9. Inserir uma notificação de teste
INSERT INTO public.notifications (
  user_id, 
  title, 
  message, 
  type, 
  read
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Substitua por um ID de usuário válido
  'Teste após correção',
  'Esta notificação foi criada após a correção de incompatibilidade de tipos',
  'system',
  false
) RETURNING *;

-- NOTA: Se este script não resolver o problema, pode ser necessário
-- verificar as configurações de autenticação ou se há algum erro
-- específico nas operações que estão tentando inserir notificações.
-- A tabela notifications pode ter triggers ou outras restrições
-- que não estão sendo consideradas aqui. 