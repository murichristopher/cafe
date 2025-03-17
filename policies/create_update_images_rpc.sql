-- Criar ou substituir a função RPC para atualizar imagens
CREATE OR REPLACE FUNCTION update_event_images(
  p_event_id UUID,
  p_imagem_chegada TEXT DEFAULT NULL,
  p_imagem_inicio TEXT DEFAULT NULL,
  p_imagem_final TEXT DEFAULT NULL
)
RETURNS SETOF events
LANGUAGE plpgsql
SECURITY DEFINER -- Isso faz com que a função seja executada com os privilégios do criador
AS $$
BEGIN
  -- Verificar se o usuário tem permissão para atualizar este evento
  IF NOT EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = p_event_id
    AND (
      -- Usuário é o fornecedor do evento
      e.fornecedor_id = auth.uid()
      OR
      -- Ou usuário é admin
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
      )
    )
  ) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  -- Atualizar apenas os campos de imagem
  UPDATE events
  SET 
    imagem_chegada = COALESCE(p_imagem_chegada, imagem_chegada),
    imagem_inicio = COALESCE(p_imagem_inicio, imagem_inicio),
    imagem_final = COALESCE(p_imagem_final, imagem_final),
    updated_at = NOW()
  WHERE id = p_event_id;
  
  -- Retornar o evento atualizado
  RETURN QUERY SELECT * FROM events WHERE id = p_event_id;
END;
$$;

-- Conceder permissão para usuários autenticados usarem esta função
GRANT EXECUTE ON FUNCTION update_event_images TO authenticated;

