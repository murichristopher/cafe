-- Verificar se existe uma política de exclusão para a tabela users
SELECT * FROM pg_policies WHERE tablename = 'users' AND cmd = 'DELETE';

-- Criar ou substituir a política de exclusão para permitir que administradores excluam usuários
CREATE POLICY "Admins podem excluir qualquer usuário" 
ON public.users 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Garantir que a tabela users tem RLS habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

