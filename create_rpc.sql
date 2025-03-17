-- Criar função RPC para buscar usuário por ID sem passar pelas políticas RLS
CREATE OR REPLACE FUNCTION get_user_by_id(user_id UUID)
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.users WHERE id = user_id;
$$;

