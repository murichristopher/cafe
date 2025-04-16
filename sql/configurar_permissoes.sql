-- Este script configura as permissões necessárias para que a service_role key 
-- possa alterar senhas no Supabase

-- 1. Conceder permissão para a role 'service_role' acessar a tabela auth.users
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO service_role;
GRANT UPDATE ON auth.users TO service_role;

-- 2. Conceder permissão para usar funções criptográficas
GRANT EXECUTE ON FUNCTION gen_salt(text) TO service_role;
GRANT EXECUTE ON FUNCTION crypt(text, text) TO service_role;

-- 3. Permitir que a função de alteração de senha seja executada por service_role
ALTER FUNCTION public.alterar_senha_usuario(p_email TEXT, p_senha TEXT)
SET SEARCH_PATH = public, auth, pg_temp; 