-- Listar todas as políticas existentes para a tabela events
SELECT * FROM pg_policies WHERE tablename = 'events';

-- Remover TODAS as políticas restritivas para fornecedores na tabela events
DROP POLICY IF EXISTS "Fornecedores só podem confirmar ou cancelar eventos pendentes" ON public.events;
DROP POLICY IF EXISTS "Fornecedores podem atualizar seus eventos" ON public.events;
DROP POLICY IF EXISTS "Fornecedores podem atualizar status de eventos pendentes" ON public.events;
-- Adicione aqui qualquer outra política que possa estar causando restrições

-- Criar uma nova política totalmente permissiva para fornecedores
CREATE POLICY "Fornecedores têm controle total sobre seus eventos" 
ON public.events
FOR UPDATE 
TO authenticated
USING (
  -- Fornecedor só pode atualizar eventos onde ele é o fornecedor designado
  (auth.uid() = fornecedor_id)
)
WITH CHECK (
  -- Fornecedor só pode atualizar eventos onde ele é o fornecedor designado
  -- Sem restrições adicionais sobre campos ou status
  (auth.uid() = fornecedor_id)
);

-- Garantir que existe a política para administradores atualizarem qualquer evento
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

-- Garantir que fornecedores possam ler seus próprios eventos
DROP POLICY IF EXISTS "Fornecedores podem ver seus eventos" ON public.events;
CREATE POLICY "Fornecedores podem ver seus eventos" 
ON public.events
FOR SELECT 
TO authenticated
USING (
  auth.uid() = fornecedor_id OR
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

-- Garantir que fornecedores possam ler objetos do storage
DROP POLICY IF EXISTS "Todos podem ler imagens" ON storage.objects;
CREATE POLICY "Todos podem ler imagens"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'imagens'
);

