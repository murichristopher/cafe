-- Verificar permissões existentes
SELECT *
FROM storage.policies
WHERE bucket_id = 'imagens';

-- Remover políticas existentes que possam estar causando conflito
DROP POLICY IF EXISTS "Fornecedores podem fazer upload de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Todos podem ler imagens" ON storage.objects;

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

-- Garantir que o bucket existe e está configurado corretamente
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagens', 'imagens', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

