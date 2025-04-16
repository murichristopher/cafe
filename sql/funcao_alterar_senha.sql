-- Função para alterar a senha de um usuário diretamente
-- Esta função deve ser executada no SQL Editor do Supabase
CREATE OR REPLACE FUNCTION public.alterar_senha_usuario(p_email TEXT, p_senha TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Encontrar o ID do usuário pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  -- Se não encontrou o usuário, retorna falso
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com o email %', p_email;
  END IF;
  
  -- Atualizar a senha diretamente na tabela auth.users
  UPDATE auth.users
  SET 
    encrypted_password = crypt(p_senha, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao alterar senha: %', SQLERRM;
    RETURN FALSE;
END;
$$; 