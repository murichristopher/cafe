-- Remover a política existente que pode estar causando o problema
DROP POLICY IF EXISTS "Fornecedores só podem confirmar ou cancelar eventos pendentes" ON public.events;

-- Criar uma nova política com o valor correto "pending"
CREATE POLICY "Fornecedores podem atualizar eventos pendentes" 
ON public.events
FOR UPDATE 
TO authenticated
USING (
  -- Fornecedor só pode atualizar eventos onde ele é o fornecedor designado
  (auth.uid() = fornecedor_id)
  AND
  -- E o status é "pending" (não "pendente")
  (status = 'pending')
)
WITH CHECK (
  -- Fornecedor só pode atualizar eventos onde ele é o fornecedor designado
  (auth.uid() = fornecedor_id)
);

-- Garantir que administradores possam atualizar qualquer evento
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer evento" ON public.events;
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

