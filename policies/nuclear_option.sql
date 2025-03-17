-- ⚠️ ATENÇÃO: Isso é uma solução extrema e deve ser usada apenas temporariamente ⚠️

-- 1. Desabilitar TODAS as políticas RLS
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 2. Dar permissões totais para usuários autenticados
GRANT ALL ON events TO authenticated;

-- 3. Criar uma view sem RLS para bypass
CREATE OR REPLACE VIEW events_bypass AS
SELECT * FROM events;

-- 4. Dar permissões na view
GRANT ALL ON events_bypass TO authenticated;

-- 5. Criar função para inserir através da view
CREATE OR REPLACE FUNCTION insert_through_bypass(
  event_data JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO events_bypass
  SELECT * FROM jsonb_populate_record(null::events, event_data);
END;
$$;

-- 6. Criar função para atualizar através da view
CREATE OR REPLACE FUNCTION update_through_bypass(
  p_event_id UUID,
  p_updates JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE events_bypass
  SET 
    imagem_chegada = COALESCE((p_updates->>'imagem_chegada')::text, imagem_chegada),
    imagem_inicio = COALESCE((p_updates->>'imagem_inicio')::text, imagem_inicio),
    imagem_final = COALESCE((p_updates->>'imagem_final')::text, imagem_final),
    status = COALESCE((p_updates->>'status')::text, status)
  WHERE id = p_event_id;
END;
$$;

-- 7. Dar permissões nas funções
GRANT EXECUTE ON FUNCTION insert_through_bypass TO authenticated;
GRANT EXECUTE ON FUNCTION update_through_bypass TO authenticated;

