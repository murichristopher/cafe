-- Remover políticas existentes
DROP POLICY IF EXISTS "Fornecedores só podem confirmar ou cancelar eventos pendentes" ON public.events;
DROP POLICY IF EXISTS "Fornecedores podem atualizar seus eventos" ON public.events;
DROP POLICY IF EXISTS "Fornecedores podem atualizar status de eventos pendentes" ON public.events;
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer evento" ON public.events;

-- Criar política simples para leitura
CREATE POLICY "Permitir leitura para usuários autenticados"
ON public.events FOR SELECT
TO authenticated
USING (true);

-- Criar política simples para atualização
CREATE POLICY "Permitir atualização para fornecedores e admins"
ON public.events FOR UPDATE
TO authenticated
USING (
  fornecedor_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

