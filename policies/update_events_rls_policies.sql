-- Remover a política restritiva atual para fornecedores, se existir
DROP POLICY IF EXISTS "Fornecedores só podem confirmar ou cancelar eventos pendentes" ON public.events;

-- Criar uma nova política mais permissiva para fornecedores
CREATE POLICY "Fornecedores podem atualizar seus eventos" 
ON public.events
FOR UPDATE 
TO authenticated
USING (
  -- Fornecedor só pode atualizar eventos onde ele é o fornecedor designado
  (auth.uid() = fornecedor_id)
)
WITH CHECK (
  -- Fornecedor só pode atualizar eventos onde ele é o fornecedor designado
  (auth.uid() = fornecedor_id)
);

-- Verificar se existe a política para administradores atualizarem eventos, se não, criar
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer evento" ON public.events;
CREATE POLICY "Administradores podem atualizar qualquer evento" 
ON public.events
FOR UPDATE 
TO authenticated
USING (
  -- Verificar se o usuário é admin verificando a função na tabela de usuários
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  -- Verificar se o usuário é admin verificando a função na tabela de usuários
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Garantir que existe a política para fornecedores inserirem objetos no storage
DROP POLICY IF EXISTS "Fornecedores podem fazer upload de imagens" ON storage.objects;
CREATE POLICY "Fornecedores podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'imagens'
);

