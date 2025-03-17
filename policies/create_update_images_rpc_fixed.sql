-- Verificar se a coluna updated_at existe na tabela events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'updated_at'
  ) THEN
    -- Se não existir, não tentamos atualizar esse campo
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
      -- Atualizar apenas os campos de imagem
      UPDATE events
      SET 
        imagem_chegada = COALESCE(p_imagem_chegada, imagem_chegada),
        imagem_inicio = COALESCE(p_imagem_inicio, imagem_inicio),
        imagem_final = COALESCE(p_imagem_final, imagem_final)
      WHERE id = p_event_id;
      
      -- Retornar o evento atualizado
      RETURN QUERY SELECT * FROM events WHERE id = p_event_id;
    END;
    $$;
  ELSE
    -- Se existir, atualizamos o campo updated_at
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
  END IF;
END $$;

-- Conceder permissão para usuários autenticados usarem esta função
GRANT EXECUTE ON FUNCTION update_event_images TO authenticated;

