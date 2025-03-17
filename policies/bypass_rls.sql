-- 1. Primeiro, remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Fornecedores só podem confirmar ou cancelar eventos pendentes" ON public.events;
DROP POLICY IF EXISTS "Fornecedores podem atualizar seus eventos" ON public.events;
DROP POLICY IF EXISTS "Fornecedores podem atualizar status de eventos pendentes" ON public.events;
DROP POLICY IF EXISTS "Administradores podem atualizar qualquer evento" ON public.events;

-- 2. Criar uma função bypass que ignora RLS completamente
CREATE OR REPLACE FUNCTION bypass_update_event(
  p_event_id UUID,
  p_updates JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Isso faz a função executar com privilégios do criador
SET search_path = public
AS $$
BEGIN
  UPDATE events
  SET 
    imagem_chegada = COALESCE((p_updates->>'imagem_chegada')::text, imagem_chegada),
    imagem_inicio = COALESCE((p_updates->>'imagem_inicio')::text, imagem_inicio),
    imagem_final = COALESCE((p_updates->>'imagem_final')::text, imagem_final),
    status = COALESCE((p_updates->>'status')::text, status)
  WHERE id = p_event_id;
END;
$$;

-- 3. Criar uma política super permissiva
CREATE POLICY "Super permissiva para testes"
ON public.events
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Garantir que RLS está desativado para a tabela (CUIDADO!)
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 5. Conceder permissões necessárias
GRANT ALL ON events TO authenticated;
GRANT EXECUTE ON FUNCTION bypass_update_event TO authenticated;

