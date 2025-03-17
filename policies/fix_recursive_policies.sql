-- Corrigir políticas recursivas na tabela users
-- Primeiro, vamos desativar temporariamente o RLS para a tabela users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes que podem estar causando recursão
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;

-- Criar uma nova política simplificada para SELECT que não causa recursão
CREATE POLICY "Allow all authenticated users to view users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Criar uma política simplificada para UPDATE
CREATE POLICY "Allow users to update their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Criar uma política simplificada para INSERT
CREATE POLICY "Allow all authenticated users to insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Reativar RLS para a tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

