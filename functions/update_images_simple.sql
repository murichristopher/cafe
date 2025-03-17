-- Remover a função existente
DROP FUNCTION IF EXISTS update_event_images(UUID, TEXT, TEXT, TEXT);

-- Criar uma nova função que retorna o registro atualizado
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

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION update_event_images TO authenticated;

