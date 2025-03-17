-- Criar uma função RPC para atualizar apenas os campos de imagem
-- Esta função ignora as políticas RLS e pode ser usada como último recurso
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

-- Conceder permissão para usuários autenticados usarem esta função
GRANT EXECUTE ON FUNCTION update_event_images TO authenticated;

