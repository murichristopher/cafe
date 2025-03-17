-- Verificar políticas existentes para DELETE
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM 
  pg_policies 
WHERE 
  tablename = 'events' AND cmd = 'DELETE';

-- Remover políticas existentes para DELETE
DROP POLICY IF EXISTS "Permitir exclusão de eventos para administradores" ON public.events;

-- Criar política para permitir que administradores excluam eventos
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

-- Verificar se a política foi criada corretamente
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM 
  pg_policies 
WHERE 
  tablename = 'events' AND cmd = 'DELETE';

