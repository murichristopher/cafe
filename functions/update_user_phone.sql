-- Criar uma função RPC para atualizar o número de telefone de um usuário
-- Esta função ignora as políticas RLS e pode ser usada para atualizar o telefone
-- após o usuário já estar autenticado
CREATE OR REPLACE FUNCTION public.update_user_phone(
  p_user_id UUID,
  p_phone_number TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Isso faz a função executar com os privilégios do criador
AS $$
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE NOTICE 'Usuário com ID % não encontrado', p_user_id;
    RETURN FALSE;
  END IF;

  -- Atualizar o número de telefone
  UPDATE public.users
  SET phone_number = p_phone_number
  WHERE id = p_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atualizar número de telefone: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Conceder permissão para usuários autenticados usarem esta função
GRANT EXECUTE ON FUNCTION public.update_user_phone TO authenticated;

