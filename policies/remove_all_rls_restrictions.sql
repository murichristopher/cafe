-- Listar todas as políticas existentes para a tabela events
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies 
WHERE 
  tablename = 'events';

-- Remover TODAS as políticas existentes para a tabela events
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'events'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.events';
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Criar políticas simples e permissivas
-- Política para permitir SELECT para todos os usuários autenticados
CREATE POLICY "Permitir leitura de eventos para usuários autenticados"
ON public.events
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir INSERT para administradores
CREATE POLICY "Permitir criação de eventos para administradores"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Política para permitir UPDATE para fornecedores (apenas seus próprios eventos)
CREATE POLICY "Permitir atualização de eventos para fornecedores"
ON public.events
FOR UPDATE
TO authenticated
USING (
  fornecedor_id = auth.uid()
)
WITH CHECK (
  fornecedor_id = auth.uid()
);

-- Política para permitir UPDATE para administradores (todos os eventos)
CREATE POLICY "Permitir atualização de eventos para administradores"
ON public.events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Política para permitir DELETE para administradores
CREATE POLICY "Permitir exclusão de eventos para administradores"
ON public.events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

