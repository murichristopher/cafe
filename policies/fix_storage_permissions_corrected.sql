-- Verificar permissões existentes corretamente
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM 
  pg_policies 
WHERE 
  schemaname = 'storage' AND tablename = 'objects';

-- Remover políticas existentes que possam estar causando conflito
DROP POLICY IF EXISTS "Fornecedores podem fazer upload de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Todos podem ler imagens" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar suas próprias imagens" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar suas próprias imagens" ON storage.objects;
DROP POLICY IF EXISTS "Imagens são publicamente acessíveis" ON storage.objects;

-- Criar nova política mais permissiva para upload de imagens
CREATE POLICY "Permitir upload de imagens para usuários autenticados"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'imagens'
);

-- Criar política para permitir atualização de objetos
CREATE POLICY "Permitir atualização de imagens para usuários autenticados"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'imagens')
WITH CHECK (bucket_id = 'imagens');

-- Criar política para permitir leitura de objetos
CREATE POLICY "Permitir leitura de imagens para todos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'imagens');

-- Criar política para permitir exclusão de objetos
CREATE POLICY "Permitir exclusão de imagens para usuários autenticados"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'imagens');

-- Garantir que o bucket existe e está configurado corretamente
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagens', 'imagens', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

