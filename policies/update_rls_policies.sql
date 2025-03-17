-- Remover políticas existentes
DROP POLICY IF EXISTS "Fornecedores podem atualizar eventos pendentes" ON public.events;
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer evento" ON public.events;

-- Criar nova política para fornecedores com os status em português
CREATE POLICY "Fornecedores podem atualizar eventos pendentes"
ON public.events
FOR UPDATE 
TO authenticated
USING (
  -- Fornecedor só pode atualizar eventos onde ele é o fornecedor designado
  (auth.uid() = fornecedor_id)
  AND
  -- E o status é 'pendente' (não mais 'pending')
  (status = 'pendente')
)
WITH CHECK (
  -- Fornecedor só pode atualizar eventos onde ele é o fornecedor designado
  (auth.uid() = fornecedor_id)
);

-- Política para administradores (sem mudança na lógica, apenas para manter consistência)
CREATE POLICY "Administradores podem atualizar qualquer evento"
ON public.events
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

