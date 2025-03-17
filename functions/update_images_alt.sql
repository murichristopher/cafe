-- Verificar o tipo de retorno da função existente
DO $$
DECLARE
  func_exists BOOLEAN;
  return_type TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_event_images' 
    AND pronargs = 4
  ) INTO func_exists;
  
  IF func_exists THEN
    -- Obter o tipo de retorno atual
    SELECT pg_catalog.pg_get_function_result(oid) 
    FROM pg_proc 
    WHERE proname = 'update_event_images' 
    AND pronargs = 4
    INTO return_type;
    
    -- Remover a função existente
    EXECUTE 'DROP FUNCTION IF EXISTS update_event_images(UUID, TEXT, TEXT, TEXT)';
    
    -- Recriar com o mesmo tipo de retorno
    IF return_type = 'events' OR return_type = 'SETOF events' THEN
      EXECUTE '
      CREATE OR REPLACE FUNCTION update_event_images(
        event_id UUID,
        imagem_chegada TEXT,
        imagem_inicio TEXT,
        imagem_final TEXT
      ) RETURNS SETOF events AS $$
      BEGIN
        UPDATE events
        SET 
          imagem_chegada = COALESCE(imagem_chegada, events.imagem_chegada),
          imagem_inicio = COALESCE(imagem_inicio, events.imagem_inicio),
          imagem_final = COALESCE(imagem_final, events.imagem_final)
        WHERE id = event_id;
        
        RETURN QUERY SELECT * FROM events WHERE id = event_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      ';
    ELSE
      EXECUTE '
      CREATE OR REPLACE FUNCTION update_event_images(
        event_id UUID,
        imagem_chegada TEXT,
        imagem_inicio TEXT,
        imagem_final TEXT
      ) RETURNS VOID AS $$
      BEGIN
        UPDATE events
        SET 
          imagem_chegada = COALESCE(imagem_chegada, events.imagem_chegada),
          imagem_inicio = COALESCE(imagem_inicio, events.imagem_inicio),
          imagem_final = COALESCE(imagem_final, events.imagem_final)
        WHERE id = event_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      ';
    END IF;
  ELSE
    -- Criar a função se não existir
    EXECUTE '
    CREATE OR REPLACE FUNCTION update_event_images(
      event_id UUID,
      imagem_chegada TEXT,
      imagem_inicio TEXT,
      imagem_final TEXT
    ) RETURNS VOID AS $$
    BEGIN
      UPDATE events
      SET 
        imagem_chegada = COALESCE(imagem_chegada, events.imagem_chegada),
        imagem_inicio = COALESCE(imagem_inicio, events.imagem_inicio),
        imagem_final = COALESCE(imagem_final, events.imagem_final)
      WHERE id = event_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ';
  END IF;
END $$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION update_event_images TO authenticated;

