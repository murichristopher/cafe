-- Criar o bucket 'imagens' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagens', 'imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Remover todas as políticas existentes para o bucket 'imagens'
DROP POLICY IF EXISTS "Permitir leitura de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de imagens" ON storage.objects;

-- Criar políticas simples
-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura de imagens"
ON storage.objects FOR SELECT
USING (bucket_id = 'imagens');

-- Política para permitir upload para usuários autenticados
CREATE POLICY "Permitir upload de imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'imagens');

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização de imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'imagens');

-- Política para permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão de imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'imagens');

