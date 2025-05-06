-- Script para encontrar IDs de usuário válidos e testar a inserção de notificações
-- Execute no SQL Editor do Supabase

-- 1. Listar os usuários disponíveis para encontrar um ID válido
SELECT 
  id, 
  email,
  role
FROM 
  public.users
LIMIT 10;

-- 2. Verificar a estrutura da tabela users 
SELECT 
  column_name, 
  data_type, 
  udt_name
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar restrições de chave estrangeira na tabela notifications
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE
  tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'notifications';

-- 4. Após encontrar um ID válido na lista acima, substitua no comando abaixo
-- Substitua '00000000-0000-0000-0000-000000000000' por um ID real de um usuário existente
-- EXEMPLO: Substituir por '123e4567-e89b-12d3-a456-426614174000' (usando um ID válido real da sua tabela)

INSERT INTO public.notifications (
  user_id, 
  title, 
  message, 
  type, 
  read
) VALUES (
  -- SUBSTITUA ESTE ID PELO ID DE UM USUÁRIO REAL DA SUA TABELA:
  '00000000-0000-0000-0000-000000000000', 
  'Teste com ID Válido',
  'Esta notificação usa um ID de usuário válido',
  'system',
  false
) RETURNING id, user_id, title;

-- NOTA: Para usar este script, primeiro execute as consultas 1-3 para
-- encontrar um ID de usuário válido. Depois, modifique a consulta 4
-- substituindo o ID do placeholder por um ID válido real e execute
-- apenas essa parte do script. 