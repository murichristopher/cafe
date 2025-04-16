-- Substitua 'email_do_usuario@exemplo.com' pelo email real do fornecedor
-- Substitua 'nova_senha123' pela nova senha desejada

-- 1. Primeiro, encontramos o ID do usuário pelo email
DO $$
DECLARE
  v_user_id UUID;
  v_result BOOLEAN;
BEGIN
  -- Recuperar o ID do usuário
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'email_do_usuario@exemplo.com';

  -- Verificar se o usuário foi encontrado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com este email';
  END IF;

  -- 2. Atualizar a senha
  UPDATE auth.users
  SET 
    encrypted_password = crypt('nova_senha123', gen_salt('bf')),
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE 'Senha atualizada com sucesso para o usuário com ID: %', v_user_id;
END $$; 